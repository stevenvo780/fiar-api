import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
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
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '@/utils/encrypt';
import {
  MPExternalReference,
  MPPreferenceResponse,
  MPWebhookPayload,
  MP_STATUS_MESSAGES,
  RenewedSubscriptionSummary,
} from './mercadopago.types';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private mpClient: MercadoPagoConfig;
  private paymentApi: Payment;
  private preferenceApi: Preference;

  constructor(
    @InjectRepository(PaymentSource)
    private paymentSourceRepository: Repository<PaymentSource>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    this.paymentApi = new Payment(this.mpClient);
    this.preferenceApi = new Preference(this.mpClient);
  }

  /**
   * Crea una Preferencia de Checkout Pro en Mercado Pago.
   * Retorna la URL de la pasarela para que el frontend redirija al usuario.
   */
  async createPreference(data: {
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
      // Calcular precio según plan y frecuencia
      let planPrice = PLAN_DETAILS[data.planType].price;
      const planName = `Suscripción ${data.planType}`;
      let description = `${planName} - Mensual`;

      if (data.frequency === 'ANNUALLY') {
        planPrice = Math.round(planPrice * 12 * 0.8);
        description = `${planName} - Anual (20% descuento)`;
      }

      // external_reference codifica userId|planType|frequency
      const externalReference = `${data.userId}|${data.planType}|${data.frequency}|${uuidv4().substring(0, 8)}`;

      // Determinar las URLs de retorno
      const frontendUrl =
        process.env.APP_DOMAIN?.replace(/\/$/, '') || 'http://localhost:3001';

      const backendUrl =
        process.env.NODE_ENV === 'DEV'
          ? 'http://localhost:8080/api/v1'
          : `${frontendUrl.replace(/:\d+$/, '')}:8080/api/v1`;

      // Construir body de la preferencia
      const preferenceBody: any = {
        items: [
          {
            id: `plan-${data.planType}-${data.frequency}`,
            title: description,
            quantity: 1,
            unit_price: planPrice,
            currency_id: 'COP',
          },
        ],
        payer: {
          email: data.email,
        },
        external_reference: externalReference,
        statement_descriptor: 'FIAR',
      };

      // back_urls y auto_return solo funcionan con URLs públicas (no localhost)
      const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1');
      if (!isLocalhost) {
        preferenceBody.back_urls = {
          success: `${frontendUrl}/payment/success`,
          failure: `${frontendUrl}/payment/failure`,
          pending: `${frontendUrl}/payment/pending`,
        };
        preferenceBody.auto_return = 'approved';
        preferenceBody.notification_url = `${backendUrl}/mercadopago/webhook`;
      }

      const preference = await this.preferenceApi.create({
        body: preferenceBody,
      });

      this.logger.log(
        `Preferencia creada: id=${preference.id}, external_reference=${externalReference}`,
      );

      return {
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      };
    } catch (error) {
      this.logger.error(
        'Error creating preference:',
        JSON.stringify(error.cause || error.message, null, 2),
      );

      throw new BadRequestException({
        message: 'Error al crear la preferencia de pago',
        details: error.message || 'Error desconocido',
        code: 'MP_PREFERENCE_ERROR',
      });
    }
  }

  /**
   * Parsea el external_reference para extraer los datos de la suscripción.
   */
  private parseExternalReference(ref: string): MPExternalReference | null {
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
   * Cancela una suscripción activa.
   */
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

  /**
   * Renueva suscripciones vencidas.
   * Con Checkout Pro no hay cobro automático con tarjeta guardada,
   * por lo que se marca para revisión y se puede enviar un recordatorio.
   */
  async renewSubscriptions(): Promise<RenewedSubscriptionSummary[]> {
    const now = new Date();
    const renewedSubscriptions: RenewedSubscriptionSummary[] = [];
    const expiredSources = await this.paymentSourceRepository.find({
      where: { nextCharge: LessThan(now), active: true },
      relations: ['user'],
    });

    for (const source of expiredSources) {
      try {
        this.logger.warn(
          `Renovación pendiente para PaymentSource ${source.id} (usuario: ${source.user.email}). ` +
            `Con Checkout Pro se requiere que el usuario vuelva a pagar manualmente.`,
        );

        // Actualizar nextCharge para evitar re-intentos inmediatos
        const nextRetry = new Date();
        nextRetry.setDate(nextRetry.getDate() + 1);
        source.nextCharge = nextRetry;
        await this.paymentSourceRepository.save(source);

        renewedSubscriptions.push({
          id: source.id,
          userEmail: source.user.email,
          planType: source.planType,
          renewedAt: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error(
          `Error renewing PaymentSource ${source.id}:`,
          error.message,
        );
      }
    }

    this.logger.log('Resumen de suscripciones renovadas:', renewedSubscriptions);
    return renewedSubscriptions;
  }

  /**
   * Maneja eventos de webhook de Mercado Pago.
   * Cuando el pago es aprobado, confirma la suscripción del usuario.
   */
  async handleWebhookEvent(
    payload: MPWebhookPayload,
  ): Promise<{ processed: boolean; paymentId?: string; status?: string }> {
    this.logger.log(
      `Webhook recibido: type=${payload.type}, action=${payload.action}, data.id=${payload.data?.id}`,
    );

    if (payload.type === 'payment') {
      try {
        // Consultar el estado del pago en MP
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
          } else {
            this.logger.warn(
              `No se pudo parsear external_reference: ${paymentInfo.external_reference}`,
            );
          }
        }

        return {
          processed: true,
          paymentId: payload.data.id,
          status: paymentInfo.status as string,
        };
      } catch (error) {
        this.logger.error(
          `Error consultando pago ${payload.data.id}:`,
          error.message,
        );
        return { processed: false };
      }
    }

    return { processed: false };
  }

  /**
   * Confirma la suscripción de un usuario después de un pago aprobado.
   * Crea/actualiza el PaymentSource y confirma la suscripción en el usuario.
   */
  private async confirmPaymentSubscription(
    refData: MPExternalReference,
    paymentId: string,
  ): Promise<void> {
    const user = await this.userService.findOne(refData.userId);
    if (!user) {
      this.logger.error(
        `Usuario ${refData.userId} no encontrado al confirmar suscripción`,
      );
      return;
    }

    // Verificar si ya existe una fuente activa para este pago (idempotencia)
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
    paymentSource.frequency = refData.frequency as PaymentFrequency;
    paymentSource.nextCharge = nextCharge;
    paymentSource.active = true;
    await this.paymentSourceRepository.save(paymentSource);

    // Confirmar suscripción en el usuario
    await this.userService.confirmSubscription(
      refData.planType,
      refData.userId,
      paymentSource,
    );

    this.logger.log(
      `Suscripción confirmada vía webhook para usuario ${refData.userId}: ` +
        `${refData.planType} (${refData.frequency}), paymentId=${paymentId}`,
    );
  }

  /**
   * Verifica el estado de un pago por su ID (para la página de retorno).
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

      let refData: MPExternalReference | null = null;
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
