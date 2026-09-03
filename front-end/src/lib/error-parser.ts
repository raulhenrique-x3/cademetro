import { ApiErrorResponse } from '@/api/types';

/**
 * Backend error message translation dictionary.
 * Maps known backend exception and limiter messages to user-friendly Portuguese.
 */
const BACKEND_MESSAGE_TRANSLATIONS: Record<string, string> = {
  // Auth exceptions
  'Email already registered': 'Este e-mail já está cadastrado no CadêMetrô.',
  'Invalid credentials': 'E-mail ou senha incorretos. Verifique os dados digitados.',
  'Account is suspended': 'Esta conta está suspensa. Entre em contato com a moderação.',
  'Invalid refresh token': 'Sua sessão expirou. Faça login novamente.',
  'Refresh token expired': 'Sua sessão expirou. Faça login novamente.',
  'Logged out successfully': 'Desconectado com sucesso.',

  // Report & Moderation exceptions
  'Cannot confirm your own report': 'Você não pode confirmar seu próprio relato.',
  'Cannot dispute your own report': 'Você não pode contestar seu próprio relato.',

  // Rate Limiting (Express rate-limit)
  'Too many login attempts, please try again after a minute.':
    'Muitas tentativas de login. Aguarde um minuto antes de tentar novamente.',
  'Too many account registrations, please try again after an hour.':
    'Muitas contas criadas a partir desta rede. Aguarde uma hora para tentar novamente.',
  'Too many reports created, please try again after a minute.':
    'Você atingiu o limite de relatos temporário. Aguarde um minuto.',
  'Too many confirmation actions, please try again after a minute.':
    'Muitas confirmações ou contestações em pouco tempo. Aguarde um minuto.',
  'Too many requests, please try again later.':
    'Muitas requisições em pouco tempo. Aguarde um momento e tente novamente.',

  // Generic HTTP
  'Internal server error': 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
  'Internal Server Error': 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
  'Not Found': 'O recurso solicitado não foi encontrado.',
  'Unauthorized': 'Ação não autorizada. Faça login para continuar.',
  'Forbidden': 'Você não tem permissão para realizar esta ação.',
};

/**
 * Parses dynamic or pattern-based backend error messages.
 */
function translateDynamicMessage(msg: string): string | null {
  const trimmed = msg.trim();

  // Pattern: "Line with ID X not found"
  if (/^Line with ID \d+ not found$/i.test(trimmed)) {
    return 'Linha de metrô informada não foi encontrada.';
  }

  // Pattern: "Report with ID X not found"
  if (/^Report with ID \d+ not found$/i.test(trimmed)) {
    return 'Relato não encontrado ou já removido pela moderação.';
  }

  // Pattern: "Station with ID X not found"
  if (/^Station with ID \d+ not found$/i.test(trimmed)) {
    return 'Estação de metrô informada não foi encontrada.';
  }

  // Pattern: "Line with code "X" already exists"
  if (/^Line with code ".*" already exists$/i.test(trimmed)) {
    const match = trimmed.match(/"(.*)"/);
    const code = match ? match[1] : '';
    return `Já existe uma linha com o código "${code}". Escolha outro identificador.`;
  }

  // Pattern: "Direction X does not belong to line Y"
  if (/Direction \d+ does not belong to line \d+/i.test(trimmed)) {
    return 'O sentido selecionado não pertence à linha escolhida.';
  }

  // Pattern: "Station X does not belong to line Y"
  if (/Station \d+ does not belong to line \d+/i.test(trimmed)) {
    return 'A estação selecionada não pertence à linha escolhida.';
  }

  // Pattern: "stationId and directionId are required for report type X"
  if (/stationId and directionId are required for report type/i.test(trimmed)) {
    return 'Estação e sentido são obrigatórios para este tipo de relato.';
  }

  // Pattern: "Validation failed: ..." (Joi validation pipe from backend)
  if (trimmed.startsWith('Validation failed:')) {
    const rawDetails = trimmed.replace(/^Validation failed:\s*/, '');
    return formatValidationDetails(rawDetails);
  }

  return null;
}

/**
 * Translates common Joi schema field validation messages into Portuguese.
 */
function formatValidationDetails(details: string): string {
  const parts = details.split(';').map((p) => p.trim());
  const translated = parts.map((part) => {
    if (/must be a valid email/i.test(part)) return 'E-mail informado é inválido.';
    if (/length must be at least 8 characters long/i.test(part)) return 'A senha deve conter no mínimo 8 caracteres.';
    if (/is required/i.test(part)) {
      const fieldMatch = part.match(/"([^"]+)"/);
      const field = fieldMatch ? fieldMatch[1] : 'Campo';
      return `O campo "${field}" é obrigatório.`;
    }
    return part;
  });

  return `Dados inválidos: ${translated.join(' ')}`;
}

export interface ParsedError {
  title: string;
  message: string;
  statusCode?: number;
}

/**
 * Extracts a user-friendly title based on HTTP status code.
 */
export function getErrorTitleByStatus(statusCode?: number): string {
  switch (statusCode) {
    case 400:
      return 'Dados inválidos';
    case 401:
      return 'Não autorizado';
    case 403:
      return 'Acesso não permitido';
    case 404:
      return 'Não encontrado';
    case 409:
      return 'Conflito de dados';
    case 422:
      return 'Erro de validação';
    case 429:
      return 'Limite de requisições excedido';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Erro no servidor';
    default:
      return 'Atenção';
  }
}

/**
 * Parses any incoming error object (ApiErrorResponse, AxiosError, Error, string, or unknown)
 * into a structured title and friendly message for toasts.
 */
export function parseApiError(error: unknown): ParsedError {
  if (!error) {
    return {
      title: 'Erro inesperado',
      message: 'Ocorreu um erro ao processar sua solicitação.',
    };
  }

  // 1. String direct error
  if (typeof error === 'string') {
    const translated = BACKEND_MESSAGE_TRANSLATIONS[error] || translateDynamicMessage(error) || error;
    return {
      title: 'Atenção',
      message: translated,
    };
  }

  // 2. ApiErrorResponse or Axios response structure
  const anyErr = error as any;
  const responseData: ApiErrorResponse | undefined =
    anyErr.response?.data || (anyErr.statusCode && anyErr.error ? anyErr : undefined);

  if (responseData && typeof responseData === 'object') {
    const statusCode = responseData.statusCode || anyErr.response?.status;
    const rawMessage = responseData.message || anyErr.message;

    let finalMessage = 'Ocorreu um erro ao processar a requisição.';

    if (Array.isArray(rawMessage)) {
      finalMessage = rawMessage.join('; ');
    } else if (typeof rawMessage === 'string') {
      finalMessage =
        BACKEND_MESSAGE_TRANSLATIONS[rawMessage] ||
        translateDynamicMessage(rawMessage) ||
        rawMessage;
    }

    const title = getErrorTitleByStatus(statusCode);

    return {
      title,
      message: finalMessage,
      statusCode,
    };
  }

  // 3. Network or Axios connection error
  if (anyErr.code === 'ERR_NETWORK' || anyErr.message?.includes('Network Error')) {
    return {
      title: 'Falha de conexão',
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
      statusCode: 0,
    };
  }

  if (anyErr.code === 'ECONNABORTED' || anyErr.message?.includes('timeout')) {
    return {
      title: 'Tempo esgotado',
      message: 'A conexão demorou muito para responder. Tente novamente.',
      statusCode: 408,
    };
  }

  // 4. Standard Error object
  if (anyErr instanceof Error || typeof anyErr.message === 'string') {
    const translated =
      BACKEND_MESSAGE_TRANSLATIONS[anyErr.message] ||
      translateDynamicMessage(anyErr.message) ||
      anyErr.message;

    const statusCode = anyErr.statusCode || anyErr.status;
    return {
      title: getErrorTitleByStatus(statusCode),
      message: translated || 'Ocorreu um erro inesperado.',
      statusCode,
    };
  }

  return {
    title: 'Erro inesperado',
    message: 'Não foi possível completar a operação. Tente novamente.',
  };
}

/**
 * Convenience helper to get just the friendly error message string.
 */
export function extractErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}
