import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

interface AdminPanelProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Right-side action slot in the panel header. */
  actions?: ReactNode;
  /** Footer slot (rendered below children, with a top border). */
  footer?: ReactNode;
  children: ReactNode;
  /** Tone affects the top accent strip. Default = no accent. */
  tone?: "default" | "primary" | "muted";
  /** Override body padding (default: `p-4 sm:p-5`). */
  padding?: string;
  className?: string;
  bodyClassName?: string;
  /** Whether to render the body wrapper. Disable for tables/lists that own their padding. */
  flushBody?: boolean;
}

/**
 * Standard surface used inside admin pages for bounded content blocks.
 * Replaces the mix of `Surface variant="panel"`, ad-hoc `rounded-xl border …`
 * and `panel` className with a single component that owns borders, header,
 * footer and tonal accents.
 */
export function AdminPanel({
  title,
  description,
  icon: Icon,
  actions,
  footer,
  children,
  tone = "default",
  padding,
  className,
  bodyClassName,
  flushBody = false,
}: AdminPanelProps) {
  const hasHeader = title || description || actions || Icon;
  return (
    <Surface
      variant="outline"
      as="section"
      className={cn(
        "overflow-hidden",
        tone === "primary" && "panel-accent",
        tone === "muted" && "bg-muted/20",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-h4">{title}</h2>}
              {description && <p className="text-meta mt-0.5">{description}</p>}
            </div>
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
      )}
      {flushBody ? (
        children
      ) : (
        <div className={cn(padding ?? "p-4 sm:p-5", bodyClassName)}>{children}</div>
      )}
      {footer && (
        <footer className="border-t border-border/50 px-4 py-3 sm:px-5">
          {footer}
        </footer>
      )}
    </Surface>
  );
}
