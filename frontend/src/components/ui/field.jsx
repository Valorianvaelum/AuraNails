import { cn } from "@/lib/utils";

function Field({ className, ...props }) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

function FieldDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function FieldError({ className, ...props }) {
  return <p role="alert" className={cn("text-sm font-medium text-destructive", className)} {...props} />;
}

export { Field, FieldDescription, FieldError };
