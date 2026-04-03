import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-surface transition-all duration-200 hover:border-foreground/12 hover:bg-surface-raised/80",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
