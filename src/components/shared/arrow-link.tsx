import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Canonical "next step" text link — one notch louder than a plain in-prose
 * link, one notch quieter than a button. Gold, medium weight, trailing arrow
 * that nudges on hover (the same look as the guide hub's "เริ่มเลย →", which
 * the owner picked as the exemplar, 2026-08-07).
 *
 * Use it for tier-2 links: "ดูทั้งหมด", end-of-section next steps. In-prose
 * reading links (inside a sentence, FAQ read-more) stay plain — they serve
 * readers mid-flow and are NOT this component's job.
 */
export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline",
        className,
      )}
    >
      {children}
      <ArrowRight
        className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
