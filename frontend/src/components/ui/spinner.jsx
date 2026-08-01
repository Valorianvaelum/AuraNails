import { cn } from "@/lib/utils";

function Spinner({ className, label = "Cargando" }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} />
  );
}

export { Spinner };
