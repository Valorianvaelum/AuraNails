import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const variants = {
  default: "border-primary/30 bg-primary text-primary-foreground",
  secondary: "border-border bg-secondary text-secondary-foreground",
  destructive: "border-destructive/30 bg-destructive text-destructive-foreground",
  outline: "border-border bg-transparent text-foreground",
  success: "border-[#c9ddce] bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warning: "border-[#e3d2b7] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
};

const Badge = forwardRef(function Badge({ className, variant = "default", ...props }, ref) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    />
  );
});

export { Badge, variants as badgeVariants };
