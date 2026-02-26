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

/** Respuesta al crear una suscripción recurrente (PreApproval) */
export interface MPPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  isSandbox?: boolean;
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
