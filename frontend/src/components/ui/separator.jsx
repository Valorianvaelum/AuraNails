import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const Separator = forwardRef(function Separator(
  { className, decorative = true, orientation = "horizontal", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
});

export { Separator };
