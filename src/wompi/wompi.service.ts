import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  RequestTimeoutException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  PaymentFrequency,
  PaymentSource,
} from './entities/payment-source.entity';
import {
  PLAN_DETAILS,
  PlanType,
  Subscription,
} from '../user/entities/subscription.entity';
import { UserService } from '../user/user.service';
import { v4 as uuidv4 } from 'uuid';
import axiosWompi from '@/utils/axiosWompiInstance';
import { encrypt, decrypt } from '@/utils/encrypt';
import { extractWompiErrorDetails } from './wompi.util';
import * as crypto from 'crypto';
import {
  DetailTransaction,
  PendingSubscription,
  RenewedSubscriptionSummary,
  TransactionResult,
  WompiWebhookPayload,
} from './wompi.types';

@Injectable()
export class WompiService {
  private pendingSubscriptions: Map<string, PendingSubscription> = new Map();
  private readonly WEBHOOK_TIMEOUT = 60000;

  constructor(
    @InjectRepository(PaymentSource)
    private paymentSourceRepository: Repository<PaymentSource>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async processSubscription(data: {
    userId: string;
    email: string;
    planType: PlanType;
    frequency: string;
    tokenId: string;
    acceptanceToken: string;
    acceptPersonalAuthToken: string;
  }): Promise<Subscription> {
    const user = await this.userService.findOne(data.userId);
    if (!user) {
      throw new BadRequestException({
        message: 'Usuario no encontrado',
        details: 'El usuario no existe',
        code: 'USER_NOT_FOUND',
      });
    }
    try {
      const sourceResponse = await axiosWompi.post('/payment_sources', {
        type: 'CARD',
        token: data.tokenId,
        customer_email: data.email,
        acceptance_token: data.acceptanceToken,
        accept_personal_auth: data.acceptPersonalAuthToken,
      });

      if (sourceResponse.data.data?.status !== 'AVAILABLE') {
        const errorMessage =
          sourceResponse.data.data?.status_message ||
          'La fuente de pago no está disponible';
        throw new BadRequestException({
          message: 'Error al crear la fuente de pago',
          details: errorMessage,
          code: 'PAYMENT_SOURCE_UNAVAILABLE',
        });
      }

      const sourceId = sourceResponse.data.data.id;

      let planPrice = PLAN_DETAILS[data.planType].price;
      if (data.frequency === 'ANNUALLY') {
        planPrice = planPrice * 12 * 0.8;
      }
      const reference = `sub-${data.planType}-${uuidv4().substring(0, 8)}`;

      const transactionResult = await this.createTransaction({
        sourceId,
        amountInCents: Math.round(planPrice * 100),
        email: data.email,
        reference,
        description: `Suscripción ${data.planType} - ${data.frequency}`,
        detail: {
          planType: data.planType,
          frequency: data.frequency as PaymentFrequency,
          userId: data.userId,
          sourceId: encrypt(String(sourceId), process.env.ENCRYPTION_KEY),
        },
      });

      if (!transactionResult.success) {
        throw new BadRequestException({
          message: 'Error al procesar la transacción',
          details: transactionResult.error.message,
          code: transactionResult.error.code,
          additionalInfo: transactionResult.error.details,
        });
      }

      const transaction = transactionResult.transaction;

      const subscriptionPromise = await new Promise<Subscription>(
        (resolve, reject) => {
          const timer = setTimeout(() => {
            this.pendingSubscriptions.delete(transaction.id);
            reject(
              new RequestTimeoutException(
                'Tiempo de espera excedido para la confirmación del pago',
              ),
            );
          }, this.WEBHOOK_TIMEOUT);

          this.pendingSubscriptions.set(transaction.id, {
            resolve,
            reject,
            timer,
          });
        },
      );

      return subscriptionPromise;
    } catch (error) {
      console.error(
        'Error processing subscription:',
        JSON.stringify(error.response?.data || error.message, null, 2),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorDetail = extractWompiErrorDetails(error);

      throw new BadRequestException({
        message: 'Error al procesar la suscripción',
        details: errorDetail.message,
        code: errorDetail.code,
      });
    }
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const paymentSources = await this.paymentSourceRepository.find({
      where: { user: { id: userId }, active: true },
    });
    for (const ps of paymentSources) {
      ps.active = false;
      await this.paymentSourceRepository.save(ps);
    }
    return await this.userService.cancelUserSubscription(userId);
  }

  async renewSubscriptions(): Promise<RenewedSubscriptionSummary[]> {
    const now = new Date();
    const renewedSubscriptions: RenewedSubscriptionSummary[] = [];
    const expiredSources = await this.paymentSourceRepository.find({
      where: { nextCharge: LessThan(now), active: true },
      relations: ['user'],
    });
    for (const source of expiredSources) {
      try {
        const sourceIdString = decrypt(
          source.sourceId,
          process.env.ENCRYPTION_KEY,
        );
        const sourceId = parseInt(sourceIdString, 10);

        if (isNaN(sourceId)) {
          console.error(
            `Invalid sourceId for PaymentSource ${source.id}: ${sourceIdString}`,
          );
          continue;
        }

        const plan = PLAN_DETAILS[source.planType];
        if (!plan) {
          console.warn(`Plan not found for planType: ${source.planType}`);
          continue;
        }
        let finalPrice = plan.price;
        if (source.frequency === PaymentFrequency.ANNUALLY) {
          finalPrice = finalPrice * 12 * 0.8;
        }
        const amountInCents = Math.round(finalPrice * 100);

        const transactionResult = await this.createTransaction({
          sourceId,
          amountInCents,
          email: source.user.email,
          reference: `renew-${source.id}-${Date.now()}`,
          description: `Renovación ${source.planType} - ${source.frequency}`,
          recurrent: true,
          detail: {
            planType: source.planType,
            frequency: source.frequency,
            userId: source.user.id,
            sourceId: source.sourceId,
          },
        });

        const transaction = transactionResult.transaction;

        await new Promise<Subscription>((resolve, reject) => {
          const timer = setTimeout(() => {
            this.pendingSubscriptions.delete(transaction.id);
            reject(
              new RequestTimeoutException(
                'Tiempo de espera excedido para la confirmación del pago',
              ),
            );
          }, this.WEBHOOK_TIMEOUT);

          this.pendingSubscriptions.set(transaction.id, {
            resolve,
            reject,
            timer,
          });
        });

        renewedSubscriptions.push({
          id: source.id,
          userEmail: source.user.email,
          planType: source.planType,
          renewedAt: new Date().toISOString(),
        });
      } catch (error) {
        const errorDetail = extractWompiErrorDetails(error);
        console.error(
          `Error renewing PaymentSource ${source.id}:`,
          errorDetail.message,
          errorDetail.details || '',
        );
      }
    }
    console.info('Resumen de suscripciones renovadas:', renewedSubscriptions);
    return renewedSubscriptions;
  }

  async handleWebhookEvent(payload: WompiWebhookPayload): Promise<{
    subscriptionsProcessed: number;
    rejectedSubscriptions: number;
  }> {
    this.validateSignature(payload);
    const summary = {
      subscriptionsProcessed: 0,
      rejectedSubscriptions: 0,
    };

    if (payload.event === 'transaction.updated') {
      const transaction = payload.data?.transaction;
      if (transaction?.status === 'APPROVED' && !transaction?.payment_link_id) {
        // subscription logic
        const pendingSubscription = this.pendingSubscriptions.get(
          transaction.id,
        );
        if (!pendingSubscription) {
          throw new NotFoundException(
            'No se encontró la suscripción pendiente',
          );
        }
        clearTimeout(pendingSubscription.timer);
        const dataTransaction = JSON.parse(
          transaction.payment_method.payment_description,
        );
        if (transaction.status === 'APPROVED') {
          try {
            const user = await this.userService.findOne(dataTransaction.userId);
            if (!user) {
              throw new NotFoundException('Usuario no encontrado');
            }
            let paymentSource = await this.paymentSourceRepository.findOne({
              where: { sourceId: dataTransaction.sourceId },
            });
            let nextCharge = new Date();
            if (!paymentSource) {
              paymentSource = new PaymentSource();
              nextCharge = this.calculateNextChargeDate(
                dataTransaction.frequency,
              );
            } else {
              if (paymentSource.frequency === PaymentFrequency.MONTHLY) {
                nextCharge.setMonth(nextCharge.getMonth() + 1);
              } else if (
                paymentSource.frequency === PaymentFrequency.ANNUALLY
              ) {
                nextCharge.setFullYear(nextCharge.getFullYear() + 1);
              }
            }
            paymentSource.sourceId = dataTransaction.sourceId;
            paymentSource.user = user;
            paymentSource.planType = dataTransaction.planType;
            paymentSource.frequency = dataTransaction.frequency;
            paymentSource.nextCharge = nextCharge;
            paymentSource.active = true;
            await this.paymentSourceRepository.save(paymentSource);
            const subscription = await this.userService.confirmSubscription(
              dataTransaction.planType,
              dataTransaction.userId,
              paymentSource,
            );
            pendingSubscription.resolve(subscription);
            summary.subscriptionsProcessed++;
          } catch (error) {
            pendingSubscription.reject(error);
            summary.rejectedSubscriptions++;
          }
        } else if (
          transaction.status === 'DECLINED' ||
          transaction.status === 'ERROR' ||
          transaction.status === 'VOIDED'
        ) {
          pendingSubscription.reject(
            new BadRequestException({
              message: 'Pago rechazado',
              details:
                transaction.status_message || 'La transacción fue rechazada',
              code: transaction.status,
            }),
          );
          summary.rejectedSubscriptions++;
        }
        this.pendingSubscriptions.delete(transaction.id);
      }
    }
    console.info('Resumen del procesamiento del webhook:', summary);
    return summary;
  }

  private async createTransaction(data: {
    sourceId: number;
    amountInCents: number;
    email: string;
    reference: string;
    description: string;
    recurrent?: boolean;
    detail: DetailTransaction;
  }): Promise<TransactionResult> {
    try {
      const response = await axiosWompi.post('/transactions', {
        amount_in_cents: data.amountInCents,
        currency: 'COP',
        customer_email: data.email,
        reference: data.reference,
        payment_source_id: data.sourceId,
        payment_method: {
          installments: 1,
          payment_description: JSON.stringify(data.detail),
        },
        recurrent: data.recurrent || false,
      });

      return {
        success: true,
        transaction: response.data.data,
      };
    } catch (error) {
      console.error(
        'Error creating transaction:',
        JSON.stringify(error.response?.data || error, null, 2),
      );

      const errorDetail = extractWompiErrorDetails(error);

      return {
        success: false,
        transaction: null,
        error: {
          code: errorDetail.code,
          message: errorDetail.message,
          details: errorDetail.details,
        },
      };
    }
  }

  private validateSignature(payload: WompiWebhookPayload): void {
    const receivedChecksum = payload.signature.checksum;
    if (!receivedChecksum) {
      throw new UnauthorizedException('Checksum de evento no proporcionado');
    }
    const properties = payload.signature.properties;
    if (!properties || !Array.isArray(properties)) {
      throw new BadRequestException('Propiedades de firma inválidas');
    }
    let concatenatedString = '';
    for (const prop of properties) {
      const parts = prop.split('.');
      let value = payload.data;
      for (const part of parts) {
        if (!value || value[part] === undefined) {
          throw new BadRequestException(
            `Propiedad ${prop} no encontrada en los datos`,
          );
        }
        value = value[part];
      }
      concatenatedString += String(value);
    }
    concatenatedString += payload.timestamp;
    concatenatedString += process.env.WOMPI_EVENTS_SECRET;
    const hmac = crypto.createHash('sha256');
    const computedChecksum = hmac
      .update(concatenatedString)
      .digest('hex')
      .toUpperCase();
    if (computedChecksum !== String(receivedChecksum).toUpperCase()) {
      console.error(
        `Firma inválida. Esperada: ${computedChecksum}, Recibida: ${receivedChecksum}`,
      );
      throw new UnauthorizedException('Firma de evento inválida');
    }
  }

  private calculateNextChargeDate(frequency: string): Date {
    const nextDate = new Date();
    if (frequency === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === 'ANNUALLY') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    return nextDate;
  }
}
