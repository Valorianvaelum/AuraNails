import { useNavigate } from "react-router-dom";

import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import { Button } from "@/components/ui";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges.js";

function FormActions({ cancelTo, disabled = false, isDirty = false, submitLabel, submittingLabel = "Guardando...", isSubmitting = false }) {
  const navigate = useNavigate();
  const { confirmOpen, discardAndLeave, requestNavigation, stay } = useUnsavedChanges({ isDirty, isSubmitting });

  const cancel = () => {
    if (!isDirty || isSubmitting) {
      navigate(cancelTo);
      return;
    }
    requestNavigation(cancelTo);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Button disabled={disabled || isSubmitting} type="submit">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        <Button disabled={isSubmitting} type="button" variant="secondary" onClick={cancel}>
          Cancelar
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="¿Descartar los cambios?"
        description="Tenés información modificada que todavía no se guardó. Si salís ahora, se perderá."
        confirmLabel="Descartar y salir"
        destructive
        onClose={stay}
        onConfirm={discardAndLeave}
      />
    </>
  );
}

export default FormActions;
