import { PlanType, Subscription } from '@/user/entities/subscription.entity';
import { PaymentFrequency } from '@/wompi/entities/payment-source.entity';

/** Respuesta de la API de Pagos de Mercado Pago */
export interface MPPaymentResponse {
  id: number;
  status: MPPaymentStatus;
  status_detail: string;
  date_approved: string | null;
  date_created: string;
  description: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
  payer: {
    email: string;
    id?: string;
  };
  payment_method_id: string;
  payment_type_id: string;
  card?: {
    id: string;
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    cardholder: {
      name: string;
    };
  };
  installments: number;
  issuer_id: string;
  statement_descriptor: string;
}

export type MPPaymentStatus =
  | 'approved'
  | 'pending'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

/** Payload del webhook de Mercado Pago */
export interface MPWebhookPayload {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

/** Datos de la transacción interna (se almacena en metadata) */
export interface MPDetailTransaction {
  planType: PlanType;
  frequency: PaymentFrequency;
  userId: string;
  cardTokenId?: string;
}

/** Resultado de crear un pago */
export interface MPTransactionResult {
  success: boolean;
  payment: MPPaymentResponse | null;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

/** Respuesta al crear una preferencia de Checkout Pro */
export interface MPPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

/** Metadata codificada en external_reference de la preferencia */
export interface MPExternalReference {
  userId: string;
  planType: PlanType;
  frequency: PaymentFrequency;
}

/** Promesa pendiente de suscripción (para flujo webhook si se necesita) */
export interface PendingMPSubscription {
  resolve: (subscription: Subscription) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

/** Resumen de renovación */
export interface RenewedSubscriptionSummary {
  id: number;
  userEmail: string;
  planType: string;
  renewedAt: string;
}

/** Mapa de status_detail a mensajes legibles en español */
export const MP_STATUS_MESSAGES: Record<string, string> = {
  accredited: 'Pago acreditado exitosamente',
  pending_contingency: 'El pago está siendo procesado',
  pending_review_manual: 'El pago está en revisión',
  cc_rejected_bad_filled_card_number: 'Número de tarjeta incorrecto',
  cc_rejected_bad_filled_date: 'Fecha de expiración incorrecta',
  cc_rejected_bad_filled_other: 'Datos de la tarjeta incorrectos',
  cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
  cc_rejected_blacklist: 'Tarjeta en lista negra',
  cc_rejected_call_for_authorize: 'Debes autorizar el pago con tu banco',
  cc_rejected_card_disabled: 'Tarjeta deshabilitada. Contacta a tu banco',
  cc_rejected_card_error: 'Error en la tarjeta. Intenta con otra',
  cc_rejected_duplicated_payment: 'Pago duplicado. Ya se procesó este cobro',
  cc_rejected_high_risk: 'Pago rechazado por seguridad',
  cc_rejected_insufficient_amount: 'Fondos insuficientes',
  cc_rejected_invalid_installments: 'Cuotas inválidas',
  cc_rejected_max_attempts: 'Límite de intentos alcanzado. Intenta más tarde',
  cc_rejected_other_reason: 'Pago rechazado. Intenta con otro medio de pago',
};
