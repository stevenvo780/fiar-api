export function extractWompiErrorDetails(error: any): {
  code: string;
  message: string;
  details?: string;
} {
  if (error.response?.data) {
    const errorData = error.response.data;

    if (errorData.error?.type) {
      const errorType = errorData.error.type;
      let errorMessage = 'Error desconocido';
      if (errorData.error.messages) {
        const messages = Object.values(errorData.error.messages)
          .flat()
          .join('; ');
        errorMessage = messages || errorType;
      }
      return {
        code: errorType,
        message: errorMessage,
        details: JSON.stringify(errorData.error),
      };
    }

    if (errorData.data?.status) {
      const transactionData = errorData.data;
      return {
        code: transactionData.status,
        message: transactionData.status_message || 'Transacción rechazada',
        details: `Código de rechazo: ${transactionData.decline_code}, Razón: ${
          transactionData.decline_reason || 'No especificada'
        }`,
      };
    }

    return {
      code: 'API_ERROR',
      message: errorData.message || 'Error en la API de Wompi',
      details: JSON.stringify(errorData),
    };
  }
  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'Error desconocido al procesar la transacción',
  };
}
