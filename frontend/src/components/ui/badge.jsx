import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const variants = {
  default: "is-brand",
  secondary: "is-neutral",
  destructive: "is-danger",
  outline: "is-outline",
  success: "is-success",
  warning: "is-warning",
};

const Badge = forwardRef(function Badge({ className, variant = "default", ...props }, ref) {
  return (
    <span
      ref={ref}
      className={cn("aura-badge", variants[variant] || variants.default, className)}
      {...props}
    />
  );
});

export { Badge, variants as badgeVariants };
