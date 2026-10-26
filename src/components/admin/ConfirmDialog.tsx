import { ReactNode, useEffect, useRef } from 'react';
import { Spinner } from './Toast';
import '../../styles/admin.css';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

/** Modal "are you sure?" step with a summary of what is about to happen. */
function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  busy = false,
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus "Go back" first so a stray Enter never confirms by accident.
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="admin-confirm-backdrop" role="presentation" onMouseDown={() => !busy && onCancel()}>
      <div
        className="admin-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id="admin-confirm-title">{title}</h3>
        {children ? <div className="admin-confirm-body">{children}</div> : null}
        <div className="admin-confirm-actions">
          <button ref={cancelRef} type="button" className="admin-btn" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`admin-btn ${tone === 'danger' ? 'admin-btn-danger-solid' : 'admin-btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
