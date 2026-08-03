import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const variants = {
  primary: "aura-button-primary",
  secondary: "aura-button-secondary",
  ghost: "aura-button-ghost",
  danger: "aura-button-danger",
  warning: "aura-button-warning",
};

const sizes = {
  sm: "aura-button-sm",
  default: "",
  lg: "aura-button-lg",
};

const AuraButton = forwardRef(function AuraButton(
  {
    as: Component = "button",
    variant = "primary",
    size = "default",
    block = false,
    loading = false,
    disabled = false,
    className,
    type = "button",
    children,
    ...props
  },
  ref,
) {
  const isNativeButton = Component === "button";
  const isDisabled = disabled || loading;

  const componentProps = isNativeButton
    ? { disabled: isDisabled, type }
    : {
        "aria-disabled": isDisabled || undefined,
        tabIndex: isDisabled ? -1 : props.tabIndex,
        onClick: isDisabled
          ? (event) => {
              event.preventDefault();
            }
          : props.onClick,
        onKeyDown: isDisabled
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") event.preventDefault();
            }
          : props.onKeyDown,
      };

  return (
    <Component
      ref={ref}
      className={cn(
        "aura-button",
        variants[variant] || variants.primary,
        sizes[size] || sizes.default,
        block && "aura-button-block",
        className,
      )}
      aria-busy={loading || undefined}
      {...props}
      {...componentProps}
    >
      {children}
    </Component>
  );
});

export default AuraButton;
export { sizes as auraButtonSizes, variants as auraButtonVariants };
