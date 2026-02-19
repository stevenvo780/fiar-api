import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentFrequency,
  PaymentSource,
} from '../wompi/entities/payment-source.entity';
import {
  PLAN_DETAILS,
  PlanType,
  Subscription,
} from '../user/entities/subscription.entity';
import { UserService } from '../user/user.service';
import { encrypt } from '@/utils/encrypt';
import {
  MPPreferenceResponse,
  MPWebhookPayload,
  MP_STATUS_MESSAGES,
} from './mercadopago.types';
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private mpClient: MercadoPagoConfig;
  private paymentApi: Payment;
  private preApprovalApi: PreApproval;

  constructor(
    @InjectRepository(PaymentSource)
    private paymentSourceRepository: Repository<PaymentSource>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    this.paymentApi = new Payment(this.mpClient);
    this.preApprovalApi = new PreApproval(this.mpClient);
  }

  /**
   * Crea una Suscripción Recurrente en Mercado Pago (PreApproval).
   * MP se encarga de cobrar automáticamente según la periodicidad.
   * Retorna el init_point para redirigir al usuario al checkout de MP.
   */
  async createSubscription(data: {
    userId: string;
    email: string;
    planType: PlanType;
    frequency: string;
  }): Promise<MPPreferenceResponse> {
    const user = await this.userService.findOne(data.userId);
    if (!user) {
      throw new BadRequestException({
        message: 'Usuario no encontrado',
        details: 'El usuario no existe',
        code: 'USER_NOT_FOUND',
      });
    }

    try {
      const planPrice = PLAN_DETAILS[data.planType].price;
      const isAnnual = data.frequency === 'ANNUALLY';

      let frequencyValue: number;
      let frequencyType: string;
      let transactionAmount: number;
      let description: string;

      if (isAnnual) {
        // Cobro cada 12 meses con 20% descuento
        frequencyValue = 12;
        frequencyType = 'months';
        transactionAmount = Math.round(planPrice * 12 * 0.8);
        description = `Suscripción FIAR - Plan ${data.planType} Anual`;
      } else {
        // Cobro mensual
        frequencyValue = 1;
        frequencyType = 'months';
        transactionAmount = planPrice;
        description = `Suscripción FIAR - Plan ${data.planType} Mensual`;
      }

      // external_reference codifica userId|planType|frequency
      const externalReference = `${data.userId}|${data.planType}|${data.frequency}`;

      const frontendUrl =
        process.env.APP_DOMAIN?.replace(/\/$/, '') || 'http://localhost:3001';

      // En sandbox (MP_SANDBOX_MODE=true) el payer_email DEBE ser de un test user
      // para que coincida con el collector (también test user).
      const isSandbox = process.env.MP_SANDBOX_MODE === 'true';
      const payerEmail = isSandbox
        ? process.env.MP_TEST_PAYER_EMAIL || data.email
        : data.email;

      if (isSandbox && process.env.MP_TEST_PAYER_EMAIL) {
        this.logger.log(
          `[SANDBOX] Usando payer_email de test: ${payerEmail} (original: ${data.email})`,
        );
      }

      const preApprovalBody: any = {
        reason: description,
        external_reference: externalReference,
        payer_email: payerEmail,
        auto_recurring: {
          frequency: frequencyValue,
          frequency_type: frequencyType,
          transaction_amount: transactionAmount,
          currency_id: 'COP',
        },
      };

      // back_url es obligatorio en PreApproval y debe ser URL pública (no localhost)
      const isLocalhost =
        frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1');
      const backUrl = isLocalhost
        ? 'https://fiar-front.vercel.app/payment/success'
        : `${frontendUrl}/payment/success`;
      preApprovalBody.back_url = backUrl;

      const subscription = await this.preApprovalApi.create({
        body: preApprovalBody,
      });

      this.logger.log(
        `Suscripción recurrente creada: id=${subscription.id}, ` +
          `status=${subscription.status}, external_reference=${externalReference}`,
      );

      // Guardar el mpSubscriptionId en la entidad Subscription del usuario
      await this.saveMpSubscriptionId(
        data.userId,
        subscription.id,
        subscription.status,
      );

      return {
        id: subscription.id,
        init_point: subscription.init_point,
        sandbox_init_point: subscription.init_point,
      };
    } catch (error) {
      const errorMsg =
        error.message || error.cause?.toString() || 'Error desconocido';
      this.logger.error(
        'Error creating MP subscription:',
        JSON.stringify(errorMsg, null, 2),
      );

      // Manejo de error específico: el pagador y el cobrador son la misma persona
      if (
        errorMsg.includes('Payer and collector cannot be the same') ||
        errorMsg.includes('payer_email')
      ) {
        throw new BadRequestException({
          message:
            'No puedes suscribirte con la misma cuenta que administra los pagos. Usa una cuenta diferente.',
          details: errorMsg,
          code: 'MP_SAME_USER_ERROR',
        });
      }

      throw new BadRequestException({
        message: 'Error al crear la suscripción recurrente',
        details: errorMsg,
        code: 'MP_SUBSCRIPTION_ERROR',
      });
    }
  }

  /**
   * Guarda el ID de suscripción MP en la entidad Subscription del usuario.
   */
  private async saveMpSubscriptionId(
    userId: string,
    mpSubscriptionId: string,
    mpStatus: string,
  ): Promise<void> {
    let subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!subscription) {
      const user = await this.userService.findOne(userId);
      subscription = new Subscription();
      subscription.user = user;
      subscription.planType = PlanType.FREE;
      subscription.startDate = new Date();
    }

    subscription.mpSubscriptionId = mpSubscriptionId;
    subscription.mpSubscriptionStatus = mpStatus || 'pending';
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Consulta el estado de la suscripción recurrente en Mercado Pago.
   */
  async getSubscriptionInfo(userId: string): Promise<{
    status: string;
    mpSubscriptionId: string | null;
    planType: string;
    nextPaymentDate: string | null;
    reason: string | null;
  }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!subscription || !subscription.mpSubscriptionId) {
      return {
        status: 'none',
        mpSubscriptionId: null,
        planType: subscription?.planType || PlanType.FREE,
        nextPaymentDate: null,
        reason: null,
      };
    }

    try {
      const mpSub = await this.preApprovalApi.get({
        id: subscription.mpSubscriptionId,
      });

      // Actualizar estado local
      subscription.mpSubscriptionStatus = mpSub.status;
      await this.subscriptionRepository.save(subscription);

      return {
        status: mpSub.status,
        mpSubscriptionId: mpSub.id,
        planType: subscription.planType,
        nextPaymentDate: mpSub.next_payment_date || null,
        reason: mpSub.reason || null,
      };
    } catch (error) {
      this.logger.error(
        `Error consultando suscripción MP ${subscription.mpSubscriptionId}:`,
        error.message,
      );
      return {
        status: subscription.mpSubscriptionStatus || 'unknown',
        mpSubscriptionId: subscription.mpSubscriptionId,
        planType: subscription.planType,
        nextPaymentDate: null,
        reason: null,
      };
    }
  }

  /**
   * Cancela una suscripción recurrente en Mercado Pago y en el sistema local.
   */
  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId } },
    });

    // Cancelar en Mercado Pago si tiene suscripción activa
    if (subscription?.mpSubscriptionId) {
      try {
        await this.preApprovalApi.update({
          id: subscription.mpSubscriptionId,
          body: { status: 'cancelled' },
        });
        this.logger.log(
          `Suscripción MP ${subscription.mpSubscriptionId} cancelada para usuario ${userId}`,
        );
      } catch (error) {
        this.logger.error(
          `Error cancelando suscripción MP ${subscription.mpSubscriptionId}:`,
          error.message,
        );
      }

      subscription.mpSubscriptionStatus = 'cancelled';
      subscription.mpSubscriptionId = null;
      await this.subscriptionRepository.save(subscription);
    }

    // Desactivar payment sources locales
    const paymentSources = await this.paymentSourceRepository.find({
      where: { user: { id: userId }, active: true },
    });
    for (const ps of paymentSources) {
      ps.active = false;
      await this.paymentSourceRepository.save(ps);
    }

    return await this.userService.cancelUserSubscription(userId);
  }

  /**
   * Pausa una suscripción recurrente en Mercado Pago.
   */
  async pauseSubscription(
    userId: string,
  ): Promise<{ success: boolean; status: string }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!subscription?.mpSubscriptionId) {
      throw new BadRequestException('No tienes una suscripción activa');
    }

    try {
      await this.preApprovalApi.update({
        id: subscription.mpSubscriptionId,
        body: { status: 'paused' },
      });

      subscription.mpSubscriptionStatus = 'paused';
      await this.subscriptionRepository.save(subscription);

      this.logger.log(
        `Suscripción MP ${subscription.mpSubscriptionId} pausada para usuario ${userId}`,
      );

      return { success: true, status: 'paused' };
    } catch (error) {
      this.logger.error('Error pausando suscripción MP:', error.message);
      throw new BadRequestException('Error al pausar la suscripción');
    }
  }

  /**
   * Maneja eventos de webhook de Mercado Pago.
   * Soporta tanto pagos (payment) como suscripciones (subscription_preapproval).
   */
  async handleWebhookEvent(
    payload: MPWebhookPayload,
  ): Promise<{ processed: boolean; type?: string; status?: string }> {
    this.logger.log(
      `Webhook recibido: type=${payload.type}, action=${payload.action}, data.id=${payload.data?.id}`,
    );

    // Webhook de suscripción (preapproval)
    if (payload.type === 'subscription_preapproval') {
      return this.handleSubscriptionWebhook(payload);
    }

    // Webhook de pago (asociado a suscripción recurrente)
    if (payload.type === 'payment') {
      return this.handlePaymentWebhook(payload);
    }

    return { processed: false };
  }

  /**
   * Maneja webhook de suscripción (subscription_preapproval).
   * Se dispara cuando la suscripción cambia de estado.
   */
  private async handleSubscriptionWebhook(
    payload: MPWebhookPayload,
  ): Promise<{ processed: boolean; type?: string; status?: string }> {
    try {
      const mpSub = await this.preApprovalApi.get({
        id: payload.data.id,
      });

      this.logger.log(
        `Suscripción MP ${payload.data.id}: status=${mpSub.status}, ` +
          `external_reference=${mpSub.external_reference}`,
      );

      if (mpSub.external_reference) {
        const refData = this.parseExternalReference(mpSub.external_reference);
        if (refData) {
          const subscription = await this.subscriptionRepository.findOne({
            where: { user: { id: refData.userId } },
          });

          if (subscription) {
            subscription.mpSubscriptionStatus = mpSub.status;

            // Si la suscripción fue autorizada → activar el plan
            if (mpSub.status === 'authorized') {
              subscription.planType = refData.planType;
              subscription.startDate = new Date();
              subscription.endDate = null;
              this.logger.log(
                `Plan ${refData.planType} activado para usuario ${refData.userId} vía suscripción recurrente`,
              );
            }

            // Si fue cancelada → bajar a FREE
            if (mpSub.status === 'cancelled') {
              subscription.planType = PlanType.FREE;
              subscription.endDate = new Date();
              subscription.mpSubscriptionId = null;
              this.logger.log(
                `Suscripción cancelada para usuario ${refData.userId}`,
              );
            }

            await this.subscriptionRepository.save(subscription);
          }
        }
      }

      return {
        processed: true,
        type: 'subscription_preapproval',
        status: mpSub.status,
      };
    } catch (error) {
      this.logger.error(
        `Error procesando webhook de suscripción ${payload.data.id}:`,
        error.message,
      );
      return { processed: false };
    }
  }

  /**
   * Maneja webhook de pago (payment).
   * Los cobros recurrentes generan webhooks de pago automáticamente.
   */
  private async handlePaymentWebhook(
    payload: MPWebhookPayload,
  ): Promise<{ processed: boolean; type?: string; status?: string }> {
    try {
      const paymentInfo = await this.paymentApi.get({
        id: payload.data.id,
      });

      this.logger.log(
        `Pago ${payload.data.id}: status=${paymentInfo.status}, ` +
          `status_detail=${paymentInfo.status_detail}, ` +
          `external_reference=${paymentInfo.external_reference}`,
      );

      if (paymentInfo.status === 'approved' && paymentInfo.external_reference) {
        const refData = this.parseExternalReference(
          paymentInfo.external_reference,
        );

        if (refData) {
          await this.confirmPaymentSubscription(
            refData,
            String(paymentInfo.id),
          );
        }
      }

      return {
        processed: true,
        type: 'payment',
        status: paymentInfo.status as string,
      };
    } catch (error) {
      this.logger.error(
        `Error procesando webhook de pago ${payload.data.id}:`,
        error.message,
      );
      return { processed: false };
    }
  }

  /**
   * Confirma/renueva la suscripción tras un pago aprobado.
   * Se llama tanto en el primer pago como en cada renovación automática.
   */
  private async confirmPaymentSubscription(
    refData: {
      userId: string;
      planType: PlanType;
      frequency: PaymentFrequency;
    },
    paymentId: string,
  ): Promise<void> {
    const user = await this.userService.findOne(refData.userId);
    if (!user) {
      this.logger.error(
        `Usuario ${refData.userId} no encontrado al confirmar pago recurrente`,
      );
      return;
    }

    // Verificar idempotencia
    const encryptedPaymentId = encrypt(paymentId, process.env.ENCRYPTION_KEY);
    const existingSource = await this.paymentSourceRepository.findOne({
      where: { sourceId: encryptedPaymentId },
    });

    if (existingSource && existingSource.active) {
      this.logger.log(
        `Pago ${paymentId} ya fue procesado (idempotencia). Ignorando.`,
      );
      return;
    }

    const nextCharge = this.calculateNextChargeDate(refData.frequency);

    const paymentSource = existingSource || new PaymentSource();
    paymentSource.sourceId = encryptedPaymentId;
    paymentSource.user = user;
    paymentSource.planType = refData.planType;
    paymentSource.frequency = refData.frequency;
    paymentSource.nextCharge = nextCharge;
    paymentSource.active = true;
    await this.paymentSourceRepository.save(paymentSource);

    // Confirmar suscripción
    await this.userService.confirmSubscription(
      refData.planType,
      refData.userId,
      paymentSource,
    );

    this.logger.log(
      `Pago recurrente confirmado para usuario ${refData.userId}: ` +
        `${refData.planType} (${refData.frequency}), paymentId=${paymentId}`,
    );
  }

  /**
   * Parsea el external_reference para extraer los datos de la suscripción.
   */
  private parseExternalReference(ref: string): {
    userId: string;
    planType: PlanType;
    frequency: PaymentFrequency;
  } | null {
    try {
      const parts = ref.split('|');
      if (parts.length < 3) return null;
      return {
        userId: parts[0],
        planType: parts[1] as PlanType,
        frequency: parts[2] as PaymentFrequency,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verifica el estado de un pago por su ID.
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    statusDetail: string;
    message: string;
    planType?: string;
    frequency?: string;
  }> {
    try {
      const paymentInfo = await this.paymentApi.get({ id: paymentId });

      let refData: {
        userId: string;
        planType: PlanType;
        frequency: PaymentFrequency;
      } | null = null;
      if (paymentInfo.external_reference) {
        refData = this.parseExternalReference(paymentInfo.external_reference);
      }

      return {
        status: paymentInfo.status as string,
        statusDetail: paymentInfo.status_detail,
        message:
          MP_STATUS_MESSAGES[paymentInfo.status_detail] ||
          `Estado del pago: ${paymentInfo.status}`,
        planType: refData?.planType,
        frequency: refData?.frequency,
      };
    } catch (error) {
      this.logger.error(
        `Error consultando estado del pago ${paymentId}:`,
        error.message,
      );
      throw new BadRequestException({
        message: 'Error al consultar el estado del pago',
        details: error.message,
      });
    }
  }

  /**
   * Calcula la próxima fecha de cobro según la frecuencia.
   */
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
