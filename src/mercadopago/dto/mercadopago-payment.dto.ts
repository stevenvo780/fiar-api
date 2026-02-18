import { IsEnum } from 'class-validator';
import { PlanType } from '../../user/entities/subscription.entity';
import { PaymentFrequency } from '../../wompi/entities/payment-source.entity';

/**
 * DTO para crear una preferencia de Checkout Pro.
 * Solo necesitamos el plan y la frecuencia; Mercado Pago maneja
 * los datos de pago en su propia pasarela.
 */
export class MercadoPagoPaymentDto {
  @IsEnum(PlanType)
  planType: PlanType;

  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;
}
