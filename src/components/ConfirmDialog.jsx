import { useRef } from 'react';
import { useDialogLayer } from '../hooks/useDialogLayer';

export function ConfirmDialog({
  isOpen,
  invoiceId,
  onCancel,
  onConfirm,
  isBusy,
}) {
  const dialogRef = useRef(null);
  useDialogLayer(dialogRef, isOpen, onCancel);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-layer" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-invoice-title"
        aria-describedby="delete-invoice-description"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 id="delete-invoice-title">Confirm Deletion</h2>
        <p id="delete-invoice-description">
          Delete invoice <span className="hash-mark">#</span>{invoiceId}? This
          action removes the record from your workspace and cannot be undone.
        </p>

        <div className="dialog-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
