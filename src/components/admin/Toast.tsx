import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
};

type ToastApi = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const noop = () => undefined;
const ToastContext = createContext<ToastApi>({ success: noop, error: noop, info: noop });

/** Show success / error / info pop-ups from anywhere inside a ToastProvider. */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

/** Turns any thrown value into a readable reason for an error toast. */
export function errorReason(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

const DURATION: Record<ToastKind, number> = { success: 3500, info: 4000, error: 7000 };

function ToastIcon({ kind }: { kind: ToastKind }) {
  const paths: Record<ToastKind, string[]> = {
    success: ['M5 12l5 5L20 7'],
    error: ['M12 8v5', 'M12 16.5v.5', 'M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'],
    info: ['M12 11v5', 'M12 7.5v.5', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'],
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[kind].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: number) => void }) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onClose(toast.id), 200);
  }, [onClose, toast.id]);

  const start = useCallback(() => {
    timer.current = setTimeout(close, DURATION[toast.kind]);
  }, [close, toast.kind]);

  useEffect(() => {
    start();
    return () => clearTimeout(timer.current);
  }, [start]);

  return (
    <div
      className={`admin-toast admin-toast-${toast.kind}${leaving ? ' admin-toast-leaving' : ''}`}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={start}
    >
      <span className="admin-toast-icon">
        <ToastIcon kind={toast.kind} />
      </span>
      <div className="admin-toast-body">
        <strong>{toast.title}</strong>
        {toast.message ? <span>{toast.message}</span> : null}
      </div>
      <button type="button" className="admin-toast-close" onClick={close} aria-label="Dismiss">
        ×
      </button>
      <span
        className="admin-toast-timer"
        style={{ animationDuration: `${DURATION[toast.kind]}ms` }}
        aria-hidden="true"
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-3), { id, kind, title, message }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="admin-toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Small inline spinner for buttons. */
export function Spinner() {
  return <span className="admin-spinner" aria-hidden="true" />;
}
