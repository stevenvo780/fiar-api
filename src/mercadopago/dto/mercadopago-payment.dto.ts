import { IsEnum } from 'class-validator';
import { PlanType } from '../../user/entities/subscription.entity';
import { PaymentFrequency } from '../../wompi/entities/payment-source.entity';

/**
 * DTO para crear una suscripción recurrente (PreApproval) en Mercado Pago.
 * Solo necesitamos el plan y la frecuencia; MP maneja los datos de pago
 * en su propia pasarela y cobra automáticamente según la periodicidad.
 */
export class MercadoPagoPaymentDto {
  @IsEnum(PlanType)
  planType: PlanType;

  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;
}
