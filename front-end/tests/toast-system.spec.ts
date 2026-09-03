import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from '../src/context/toast-context';
import { queryClient } from '../src/lib/query-client';

describe('Toast System and Global Mutation Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Imperative Toast Dispatcher', () => {
    it('creates error toasts with parsed backend messages', () => {
      const showSpy = vi.spyOn(toast, 'show');

      const toastId = toast.error({
        statusCode: 409,
        error: 'Conflict',
        message: 'Email already registered',
      });

      expect(toastId).toBeDefined();
      expect(showSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Conflito de dados',
          message: 'Este e-mail já está cadastrado no CadêMetrô.',
          duration: 4500,
        }),
      );
    });

    it('creates success toasts with custom title and message', () => {
      const showSpy = vi.spyOn(toast, 'show');

      const toastId = toast.success('Relato publicado com sucesso!', 'Tudo certo');
      expect(toastId).toBeDefined();
      expect(showSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Tudo certo',
          message: 'Relato publicado com sucesso!',
          duration: 3000,
        }),
      );
    });

    it('creates warning and info toasts', () => {
      const showSpy = vi.spyOn(toast, 'show');

      toast.warning('Atenção: verifique as informações.');
      expect(showSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Atenção',
          message: 'Atenção: verifique as informações.',
        }),
      );

      toast.info('Nova atualização disponível.');
      expect(showSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          title: 'Informação',
          message: 'Nova atualização disponível.',
        }),
      );
    });
  });

  describe('TanStack Query MutationCache Integration', () => {
    it('triggers error toast automatically on mutation failure', async () => {
      const errorSpy = vi.spyOn(toast, 'error');

      const backendError = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'Cannot confirm your own report',
      };

      try {
        await queryClient.getMutationCache().build(queryClient, {
          mutationFn: async () => {
            throw backendError;
          },
        }).execute();
      } catch {
        // expected failure
      }

      expect(errorSpy).toHaveBeenCalledWith(backendError);
    });

    it('suppresses toast when mutation has suppressToast metadata', async () => {
      const errorSpy = vi.spyOn(toast, 'error');

      const backendError = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Custom local error',
      };

      try {
        await queryClient.getMutationCache().build(queryClient, {
          meta: { suppressToast: true },
          mutationFn: async () => {
            throw backendError;
          },
        }).execute();
      } catch {
        // expected failure
      }

      expect(errorSpy).not.toHaveBeenCalledWith(backendError);
    });
  });
});
