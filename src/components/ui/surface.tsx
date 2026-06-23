import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const surfaceVariants = cva("ease-chrome", {
  variants: {
    variant: {
      panel: "panel",
      outline: "rounded-xl border border-[var(--p-hair)] bg-card",
      subtle: "rounded-xl bg-muted/30",
      hero: "surface-1 hairline rounded-xl",
      ghost: "",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
      xl: "p-6",
    },
    interactive: {
      true: "hover:bg-muted/70 hover:border-[var(--p-hair)] focus-within:border-[var(--p-hair)]",
      false: "",
    },
  },
  defaultVariants: {
    variant: "panel",
    padding: "none",
    interactive: false,
  },
});

export interface SurfaceProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof surfaceVariants> {
  /**
   * Render a different element (e.g. `as="article"`, `as="section"`).
   */
  as?: ElementType;
  /**
   * Slotted header rendered above children with bottom-divider spacing.
   * Pair with `padding="none"` if you need flush borders.
   */
  header?: ReactNode;
  /**
   * Slotted footer rendered below children. Mirrors `header`.
   */
  footer?: ReactNode;
}

/**
 * Unified surface primitive (card / panel / banner).
 *
 * Replaces ad-hoc `rounded-xl border border-border/40 bg-card` blocks, raw
 * `<div className="panel">` usage, and one-off shadcn `<Card>` wrappers so that
 * radius, shadow, border, and hover states only live in one place.
 *
 * Variants:
 *   - `panel`   — primary card (`.panel` token; bg + soft shadow + radius)
 *   - `outline` — secondary card (border + bg-card, no shadow)
 *   - `subtle`  — informational/banner surface (muted bg, no border)
 *   - `hero`    — `.panel-hero` (gradient + accent top border) — reserve for
 *                 ONE hero per page only
 *   - `ghost`   — no surface chrome (use only when composing)
 *
 * `interactive` adds `hover:bg-muted/30 hover:border-border` (no translate, no
 * shadow lift) — minimal feedback for clickable surfaces.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { className, variant, padding, interactive, as, header, footer, children, ...props },
  ref,
) {
  const Component = (as ?? "div") as ElementType;

  if (header || footer) {
    return (
      <Component
        ref={ref}
        className={cn(surfaceVariants({ variant, padding: "none", interactive }), className)}
        {...props}
      >
        {header && <div className="border-b border-[var(--p-hair)] px-5 py-4">{header}</div>}
        <div className={cn(surfaceVariants({ padding }))}>{children}</div>
        {footer && <div className="border-t border-[var(--p-hair)] px-5 py-3">{footer}</div>}
      </Component>
    );
  }

  return (
    <Component
      ref={ref}
      className={cn(surfaceVariants({ variant, padding, interactive }), className)}
      {...props}
    >
      {children}
    </Component>
  );
});

export { surfaceVariants };
