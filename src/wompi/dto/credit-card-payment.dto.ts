import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlanType } from '../../user/entities/subscription.entity';
import { PaymentFrequency } from '../entities/payment-source.entity';

export class CreditCardPaymentDto {
  @IsEnum(PlanType)
  planType: PlanType;

  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  @IsNotEmpty()
  tokenId: string;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  acceptanceToken: string;

  @IsNotEmpty()
  @IsString()
  acceptPersonalAuthToken: string;
}
