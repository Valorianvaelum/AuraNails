import { useNavigate } from "react-router-dom";

import AuraButton from "@/components/AuraButton.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges.js";

function FormActions({ cancelTo, disabled = false, isDirty = false, submitLabel, submittingLabel = "Guardando...", isSubmitting = false, onCancel }) {
  const navigate = useNavigate();
  const { confirmOpen, discardAndLeave, requestNavigation, stay } = useUnsavedChanges({ isDirty, isSubmitting });

  const cancel = () => {
    if (typeof onCancel === "function") {
      onCancel();
      return;
    }
    if (!isDirty || isSubmitting) {
      navigate(cancelTo);
      return;
    }
    requestNavigation(cancelTo);
  };

  return (
    <>
      <div className="aura-form-footer">
        <AuraButton disabled={disabled} loading={isSubmitting} type="submit">
          {isSubmitting ? submittingLabel : submitLabel}
        </AuraButton>
        <AuraButton disabled={isSubmitting} type="button" variant="secondary" onClick={cancel}>
          Cancelar
        </AuraButton>
      </div>
      {typeof onCancel !== "function" && (
        <ConfirmDialog
          open={confirmOpen}
          title="¿Descartar los cambios?"
          description="Tenés información modificada que todavía no se guardó. Si salís ahora, se perderá."
          confirmLabel="Descartar y salir"
          destructive
          onClose={stay}
          onConfirm={discardAndLeave}
        />
      )}
    </>
  );
}

export default FormActions;
