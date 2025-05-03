import { PlanType } from '../../user/entities/subscription.entity';
import { PaymentFrequency } from '../entities/payment-source.entity';

export interface CreditCardInfo {
  number: string;
  expirationDate: string;
  securityCode: string;
  name: string;
}

export interface CreditCardPaymentParams {
  creditCard: CreditCardInfo;
  planType: PlanType;
  frequency: string | PaymentFrequency;
  token: string;
  emailAddress: string;
  userId: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface CardTokenRequest {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
  card_holder: string;
}

export interface CardTokenResponse {
  status: string;
  data: {
    id: string;
    created_at: string;
    brand: string;
    name: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    expires_at: string;
  };
}

export interface PaymentSourceRequest {
  type: string;
  token: string;
  customer_email: string;
  acceptance_token: string;
  accept_personal_auth: string;
}

export interface PaymentSourceResponse {
  data: {
    id: number;
    public_data: {
      type: string;
      brand?: string;
      last_four?: string;
    };
    type: string;
    status: string;
  };
}

export interface TransactionRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: {
    installments: number;
  };
  payment_source_id: number;
  reference: string;
  signature: string;
}

export interface TransactionResponse {
  data: {
    id: string;
    created_at: string;
    amount_in_cents: number;
    reference: string;
    currency: string;
    payment_method_type: string;
    payment_method: {
      type: string;
      installments: number;
      extra?: any;
    };
    redirect_url: string | null;
    status: string;
    status_message: string | null;
    customer_email: string;
    payment_source_id: number;
  };
}

export interface CardPaymentSuccess {
  status: string;
  transactionId: string;
  subscription: any;
  paymentSource: any;
}

export interface CardPaymentPending {
  status: string;
  transactionId: string;
  message: string;
}

export type CardPaymentResult = CardPaymentSuccess | CardPaymentPending;
