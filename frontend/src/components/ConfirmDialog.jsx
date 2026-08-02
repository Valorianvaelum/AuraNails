import { useId, useRef } from "react";

import useDialogAccessibility from "../hooks/useDialogAccessibility.js";

export default function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  isProcessing = false,
  destructive = false,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const detailsId = useId();

  useDialogAccessibility({
    active: open,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onEscape: () => {
      if (!isProcessing) onClose();
    },
  });

  if (!open) return null;

  const describedBy = [description ? descriptionId : null, details ? detailsId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        ref={dialogRef}
        aria-busy={isProcessing || undefined}
        aria-describedby={describedBy}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        role={destructive ? "alertdialog" : "dialog"}
        tabIndex="-1"
      >
        <h2 id={titleId}>{title}</h2>
        {description ? <p id={descriptionId}>{description}</p> : null}
        {details ? <p className="confirm-dialog-details" id={detailsId}>{details}</p> : null}
        <div className="confirm-dialog-actions">
          <button
            ref={cancelRef}
            className="aura-button aura-button-secondary"
            disabled={isProcessing}
            type="button"
            onClick={onClose}
          >
            Volver
          </button>
          <button
            aria-busy={isProcessing || undefined}
            className={`aura-button ${destructive ? "aura-button-danger confirm-dialog-destructive" : "aura-button-primary confirm-dialog-confirm"}`}
            disabled={isProcessing}
            type="button"
            onClick={onConfirm}
          >
            {isProcessing ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
