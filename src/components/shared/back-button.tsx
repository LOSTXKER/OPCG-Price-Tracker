import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The app's single back-button affordance (mobile). A prominent honey-filled
 * circle so it reads clearly against any page background (the old card-white +
 * hairline version blended into light mode). Meant to sit INLINE, left of a page
 * title — vertically centred with it — the way iOS/most apps place "back".
 *
 * Icon-only; the destination name stays available to screen readers / long-press
 * via `aria-label` + `title`.
 */
export function BackButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm motion-base hover:opacity-90 active:scale-95",
        className,
      )}
    >
      <ChevronLeft className="size-5" />
    </Link>
  );
}
