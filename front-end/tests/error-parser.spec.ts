import { describe, it, expect } from 'vitest';
import { parseApiError, extractErrorMessage, getErrorTitleByStatus } from '../src/lib/error-parser';
import { ApiErrorResponse } from '../src/api/types';

describe('Error Parser and Backend Error Normalization', () => {
  describe('getErrorTitleByStatus', () => {
    it('returns appropriate semantic titles based on HTTP status code', () => {
      expect(getErrorTitleByStatus(400)).toBe('Dados inválidos');
      expect(getErrorTitleByStatus(401)).toBe('Não autorizado');
      expect(getErrorTitleByStatus(403)).toBe('Acesso não permitido');
      expect(getErrorTitleByStatus(404)).toBe('Não encontrado');
      expect(getErrorTitleByStatus(409)).toBe('Conflito de dados');
      expect(getErrorTitleByStatus(422)).toBe('Erro de validação');
      expect(getErrorTitleByStatus(429)).toBe('Limite de requisições excedido');
      expect(getErrorTitleByStatus(500)).toBe('Erro no servidor');
      expect(getErrorTitleByStatus(undefined)).toBe('Atenção');
    });
  });

  describe('parseApiError with Backend Responses', () => {
    it('translates auth 409 duplicate email response', () => {
      const backendError: ApiErrorResponse = {
        statusCode: 409,
        error: 'Conflict',
        message: 'Email already registered',
        path: '/auth/register',
        timestamp: new Date().toISOString(),
      };

      const parsed = parseApiError(backendError);
      expect(parsed.statusCode).toBe(409);
      expect(parsed.title).toBe('Conflito de dados');
      expect(parsed.message).toBe('Este e-mail já está cadastrado no CadêMetrô.');
    });

    it('translates auth 401 invalid credentials', () => {
      const backendError: ApiErrorResponse = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        path: '/auth/login',
        timestamp: new Date().toISOString(),
      };

      const parsed = parseApiError(backendError);
      expect(parsed.statusCode).toBe(401);
      expect(parsed.title).toBe('Não autorizado');
      expect(parsed.message).toBe('E-mail ou senha incorretos. Verifique os dados digitados.');
    });

    it('translates auth 403 suspended account', () => {
      const backendError: ApiErrorResponse = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Account is suspended',
        path: '/auth/login',
        timestamp: new Date().toISOString(),
      };

      const parsed = parseApiError(backendError);
      expect(parsed.statusCode).toBe(403);
      expect(parsed.title).toBe('Acesso não permitido');
      expect(parsed.message).toBe('Esta conta está suspensa. Entre em contato com a moderação.');
    });

    it('translates report confirmation restrictions (own report)', () => {
      const confirmError: ApiErrorResponse = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Cannot confirm your own report',
        path: '/reports/1/confirm',
        timestamp: new Date().toISOString(),
      };

      const parsedConfirm = parseApiError(confirmError);
      expect(parsedConfirm.message).toBe('Você não pode confirmar seu próprio relato.');

      const disputeError: ApiErrorResponse = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Cannot dispute your own report',
        path: '/reports/1/dispute',
        timestamp: new Date().toISOString(),
      };

      const parsedDispute = parseApiError(disputeError);
      expect(parsedDispute.message).toBe('Você não pode contestar seu próprio relato.');
    });

    it('translates rate limit error responses (429)', () => {
      const loginRateLimit: ApiErrorResponse = {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Too many login attempts, please try again after a minute.',
        timestamp: new Date().toISOString(),
      };

      const parsedLogin = parseApiError(loginRateLimit);
      expect(parsedLogin.statusCode).toBe(429);
      expect(parsedLogin.title).toBe('Limite de requisições excedido');
      expect(parsedLogin.message).toContain('Muitas tentativas de login');

      const reportRateLimit: ApiErrorResponse = {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Too many reports created, please try again after a minute.',
        timestamp: new Date().toISOString(),
      };

      const parsedReport = parseApiError(reportRateLimit);
      expect(parsedReport.message).toContain('limite de relatos');
    });

    it('translates dynamic backend error patterns', () => {
      const missingStationError = parseApiError({
        statusCode: 400,
        message: 'stationId and directionId are required for report type TRAIN_ARRIVING',
      });
      expect(missingStationError.message).toBe('Estação e sentido são obrigatórios para este tipo de relato.');

      const invalidDirectionError = parseApiError({
        statusCode: 400,
        message: 'Direction 99 does not belong to line 1',
      });
      expect(invalidDirectionError.message).toBe('O sentido selecionado não pertence à linha escolhida.');

      const duplicateLineCode = parseApiError({
        statusCode: 409,
        message: 'Line with code "centro" already exists',
      });
      expect(duplicateLineCode.message).toBe('Já existe uma linha com o código "centro". Escolha outro identificador.');

      const notFoundReport = parseApiError({
        statusCode: 404,
        message: 'Report with ID 999 not found',
      });
      expect(notFoundReport.message).toBe('Relato não encontrado ou já removido pela moderação.');
    });

    it('formats Joi validation pipe errors nicely', () => {
      const validationError: ApiErrorResponse = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed: "email" must be a valid email; "password" length must be at least 8 characters long',
        path: '/auth/register',
      };

      const parsed = parseApiError(validationError);
      expect(parsed.statusCode).toBe(400);
      expect(parsed.title).toBe('Dados inválidos');
      expect(parsed.message).toContain('E-mail informado é inválido.');
      expect(parsed.message).toContain('A senha deve conter no mínimo 8 caracteres.');
    });

    it('handles network failure and timeout errors', () => {
      const networkErr = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };
      const parsedNetwork = parseApiError(networkErr);
      expect(parsedNetwork.title).toBe('Falha de conexão');
      expect(parsedNetwork.message).toContain('Não foi possível conectar ao servidor');

      const timeoutErr = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      };
      const parsedTimeout = parseApiError(timeoutErr);
      expect(parsedTimeout.title).toBe('Tempo esgotado');
      expect(parsedTimeout.message).toContain('A conexão demorou muito');
    });

    it('extractErrorMessage returns just the string message', () => {
      const msg = extractErrorMessage({
        statusCode: 401,
        message: 'Invalid credentials',
      });
      expect(msg).toBe('E-mail ou senha incorretos. Verifique os dados digitados.');
    });

    it('handles null, undefined or empty input gracefully', () => {
      expect(parseApiError(null).title).toBe('Erro inesperado');
      expect(parseApiError(undefined).title).toBe('Erro inesperado');
      expect(parseApiError('Custom plain text error').message).toBe('Custom plain text error');
    });
  });
});
