import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { parseApiError } from '@/lib/error-parser';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  createdAt: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  showError: (error: unknown, title?: string, duration?: number) => string;
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
  hideToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Imperative toast dispatcher for non-React contexts (e.g. TanStack Query callbacks, Axios interceptors)
type ToastListener = (action: {
  type: 'SHOW' | 'HIDE' | 'CLEAR';
  payload?: any;
}) => void;

let imperativeListener: ToastListener | null = null;

export const toast = {
  show: (options: ToastOptions): string => {
    const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    imperativeListener?.({
      type: 'SHOW',
      payload: { ...options, id },
    });
    return id;
  },

  error: (error: unknown, title?: string, duration = 4500): string => {
    const parsed = parseApiError(error);
    return toast.show({
      type: 'error',
      title: title || parsed.title,
      message: parsed.message,
      duration,
    });
  },

  success: (message: string, title = 'Sucesso', duration = 3000): string => {
    return toast.show({
      type: 'success',
      title,
      message,
      duration,
    });
  },

  warning: (message: string, title = 'Atenção', duration = 4000): string => {
    return toast.show({
      type: 'warning',
      title,
      message,
      duration,
    });
  },

  info: (message: string, title = 'Informação', duration = 3500): string => {
    return toast.show({
      type: 'info',
      title,
      message,
      duration,
    });
  },

  hide: (id: string) => {
    imperativeListener?.({ type: 'HIDE', payload: id });
  },

  clearAll: () => {
    imperativeListener?.({ type: 'CLEAR' });
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const hideToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const type = options.type || 'info';
      const duration = options.duration ?? (type === 'error' ? 4500 : 3000);
      const title =
        options.title ||
        (type === 'error'
          ? 'Erro'
          : type === 'success'
          ? 'Sucesso'
          : type === 'warning'
          ? 'Atenção'
          : 'Informação');

      const newItem: ToastItem = {
        id,
        type,
        title,
        message: options.message,
        duration,
        createdAt: Date.now(),
      };

      // Keep maximum 3 toasts visible at a time to prevent screen clutter
      setToasts((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        return [...filtered.slice(-2), newItem];
      });

      if (duration > 0) {
        const existingTimer = timersRef.current.get(id);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
          hideToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [hideToast],
  );

  const showError = useCallback(
    (error: unknown, title?: string, duration?: number) => {
      const parsed = parseApiError(error);
      return showToast({
        type: 'error',
        title: title || parsed.title,
        message: parsed.message,
        duration: duration ?? 4500,
      });
    },
    [showToast],
  );

  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast({
        type: 'success',
        title: title || 'Sucesso',
        message,
        duration: duration ?? 3000,
      });
    },
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast({
        type: 'warning',
        title: title || 'Atenção',
        message,
        duration: duration ?? 4000,
      });
    },
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast({
        type: 'info',
        title: title || 'Informação',
        message,
        duration: duration ?? 3500,
      });
    },
    [showToast],
  );

  // Bind imperative toast singleton to this provider instance
  useEffect(() => {
    imperativeListener = (action) => {
      if (action.type === 'SHOW') {
        showToast(action.payload);
      } else if (action.type === 'HIDE') {
        hideToast(action.payload);
      } else if (action.type === 'CLEAR') {
        clearAll();
      }
    };

    return () => {
      imperativeListener = null;
    };
  }, [showToast, hideToast, clearAll]);

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showError,
        showSuccess,
        showWarning,
        showInfo,
        hideToast,
        clearAll,
      }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
