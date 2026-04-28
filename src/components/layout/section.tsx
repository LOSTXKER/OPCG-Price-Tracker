import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Optional icon-only or button row rendered to the right of the title. */
  actions?: ReactNode;
  /** Heading element (`h2` by default; pick `h3`/`h4` to nest visually). */
  as?: "h2" | "h3" | "h4";
  /** Typography token for the heading. Defaults to match `as`. */
  titleClass?: string;
  /** Add the `.section-heading` left-border accent. */
  accent?: boolean;
  className?: string;
  headerClassName?: string;
  children: ReactNode;
}

const HEADING_CLASS: Record<NonNullable<SectionProps["as"]>, string> = {
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
};

/**
 * Section heading + body wrapper.
 *
 * Use to replace the recurring `<div class="flex items-center
 * justify-between"><h2 class="text-h2">…</h2><Link>…</Link></div>` pattern
 * across home/portfolio/admin so spacing and typography stay aligned.
 */
export function Section({
  title,
  description,
  actions,
  as: Heading = "h2",
  titleClass,
  accent = false,
  className,
  headerClassName,
  children,
}: SectionProps) {
  const showHeader = Boolean(title || description || actions);
  const headingClassName = titleClass ?? HEADING_CLASS[Heading];

  return (
    <section className={cn("space-y-3", className)}>
      {showHeader && (
        <div
          className={cn(
            "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {title && (
              <Heading className={cn(headingClassName, accent && "section-heading")}>
                {title}
              </Heading>
            )}
            {description && (
              <p className="page-subtitle">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
