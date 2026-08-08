import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

export type GuidePoint = {
  id: string;
  /** Short lead-in (2–4 words). Gives the eye a handle so the row isn't prose. */
  title?: string;
  body: ReactNode;
  /** Per-point icon. Ignored when the list is `ordered`. */
  icon?: LucideIcon;
};

export type GuidePointTone = "neutral" | "warning" | "danger" | "positive";

const TONE: Record<GuidePointTone, string> = {
  neutral: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  positive: "bg-success/10 text-success",
};

/**
 * Turns a run of bare `<p>` tags into scannable rows.
 *
 * Most of the "wall of text" on the guide pages is already a list in the
 * author's head — four checks, three cost buckets, five red flags — it just
 * got typed as consecutive paragraphs. This gives each item a marker (a number
 * when the order matters, an icon when it doesn't) and an optional short title,
 * so the reader can skim the shape of the section before committing to reading
 * it.
 *
 * Use `ordered` only when the sequence is real (steps to follow). Red flags and
 * checks are unordered — numbering them implies a ranking that isn't there.
 */
export function GuidePointList({
  points,
  ordered = false,
  tone = "neutral",
  className,
}: {
  points: GuidePoint[];
  ordered?: boolean;
  tone?: GuidePointTone;
  className?: string;
}) {
  if (points.length === 0) return null;

  const ListTag = ordered ? "ol" : "ul";

  return (
    <Surface
      as={ListTag}
      variant="outline"
      className={cn("divide-y divide-hair overflow-hidden", className)}
    >
      {points.map((point, index) => {
        const Icon = point.icon;
        return (
          <li key={point.id} id={point.id} className="flex scroll-mt-24 items-start gap-3 px-5 py-4">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                TONE[tone],
              )}
              aria-hidden
            >
              {ordered ? (
                <span className="text-xs font-semibold tabular-nums">{index + 1}</span>
              ) : Icon ? (
                <Icon className="size-3.5" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              {point.title && <h3 className="text-h5">{point.title}</h3>}
              <div
                className={cn(
                  "text-body-sm leading-relaxed text-muted-foreground",
                  point.title && "mt-1",
                )}
              >
                {point.body}
              </div>
            </div>
          </li>
        );
      })}
    </Surface>
  );
}
