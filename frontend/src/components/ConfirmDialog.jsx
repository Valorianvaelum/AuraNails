import { useEffect, useRef } from "react";

function focusables(container) {
  return [...container.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

export default function ConfirmDialog({ open, title, description, details, confirmLabel, isProcessing = false, destructive = false, onConfirm, onClose }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isProcessing) { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const items = focusables(dialogRef.current);
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocus.current?.focus?.(); };
  }, [isProcessing, onClose, open]);

  if (!open) return null;
  return <div className="confirm-backdrop" role="presentation"><section aria-describedby="confirm-dialog-description" aria-labelledby="confirm-dialog-title" aria-modal="true" className="confirm-dialog" ref={dialogRef} role="dialog"><h2 id="confirm-dialog-title">{title}</h2><p id="confirm-dialog-description">{description}</p>{details && <p className="confirm-dialog-details">{details}</p>}<div className="confirm-dialog-actions"><button ref={cancelRef} disabled={isProcessing} type="button" onClick={onClose}>Volver</button><button className={destructive ? "confirm-dialog-destructive" : "confirm-dialog-confirm"} disabled={isProcessing} type="button" onClick={onConfirm}>{isProcessing ? "Procesando…" : confirmLabel}</button></div></section></div>;
}
