import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

function FormActions({ cancelTo, disabled = false, submitLabel, submittingLabel = "Guardando...", isSubmitting = false }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
      <Button disabled={disabled || isSubmitting} type="submit">
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
      <Link
        className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-brand-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        to={cancelTo}
      >
        Cancelar
      </Link>
    </div>
  );
}

export default FormActions;
