import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const variants = {
  default: "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-[var(--color-brand-hover)]",
  destructive: "border-destructive bg-destructive text-destructive-foreground hover:bg-[#60303d]",
  outline: "border-border bg-card text-foreground hover:border-[var(--color-border-strong)] hover:bg-secondary",
  secondary: "border-border bg-secondary text-secondary-foreground hover:border-[var(--color-border-strong)] hover:bg-[var(--color-brand-soft)]",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-secondary",
  link: "border-transparent bg-transparent p-0 text-primary underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-11 px-4 py-2",
  sm: "h-9 rounded-sm px-3 text-sm",
  lg: "h-12 rounded-lg px-6",
  icon: "h-11 w-11 p-0",
};

const Button = forwardRef(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className,
      )}
      {...props}
    />
  );
});

export { Button, sizes as buttonSizes, variants as buttonVariants };
