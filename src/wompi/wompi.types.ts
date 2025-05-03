import { PlanType, Subscription } from '@/user/entities/subscription.entity';
import { PaymentFrequency } from './entities/payment-source.entity';

export interface WompiWebhookPayload {
  data: {
    transaction?: WompiTransaction;
    id?: string;
    status?: string;
  };
  event: string;
  sent_at: string;
  signature: WompiSignature;
  timestamp: number;
  environment?: string;
}

export interface WompiSignature {
  checksum: string;
  properties: string[];
}

export interface WompiTransaction {
  id: string;
  status: string;
  currency: string;
  reference: string;
  created_at: string;
  finalized_at: string | null;
  customer_email: string;
  amount_in_cents: number;
  payment_source_id: number;
  payment_link_id?: string | null;
  payment_method_type: string;
  payment_method: PaymentMethodCard;
  status_message?: string | null;
  billing_data?: WompiBillingData;
  customer_data?: WompiCustomerData;
  redirect_url?: string | null;
  decline_code?: string;
  decline_reason?: string;
}

export interface PaymentMethodCard {
  type: string;
  installments: number;
  payment_description: string;
  extra: {
    bin: string;
    name: string;
    brand: string;
    exp_year: string;
    exp_month: string;
    last_four: string;
    card_holder: string;
    is_three_ds: boolean;
    unique_code: string;
    card_type: string;
    three_ds_auth_type: string | null;
    processor_response_code: string;
    three_ds_auth?: Record<string, any>;
  };
}

export interface WompiBillingData {
  legal_id?: string;
  legal_id_type?: string;
}

export interface WompiBrowserInfo {
  browser_tz?: string;
  browser_language?: string;
  browser_user_agent?: string;
  browser_color_depth?: string;
  browser_screen_width?: string;
  browser_screen_height?: string;
}

export interface WompiCustomerData {
  device_id?: string;
  full_name?: string;
  phone_number?: string;
  device_data_token?: string;
  browser_info?: WompiBrowserInfo;
}

export interface TransactionResult {
  success: boolean;
  transaction: WompiTransaction | null;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface PendingSubscription {
  resolve: (subscription: Subscription) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export interface DetailTransaction {
  planType: PlanType;
  frequency: PaymentFrequency;
  userId: string;
  sourceId: string;
}

export interface RenewedSubscriptionSummary {
  id: number;
  userEmail: string;
  planType: string;
  renewedAt: string;
}
