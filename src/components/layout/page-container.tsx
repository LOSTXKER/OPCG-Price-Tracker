import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageWidth =
  | "default"
  | "narrow"
  | "reading"
  | "article"
  | "wide"
  | "full";

const WIDTH_CLASS: Record<PageWidth, string> = {
  // Market-style data canvas: wider than Tailwind's 7xl (1280px) without
  // going near-fluid like the reference exchanges. At 1400px the current
  // tables and card grids gain useful breathing room while their column count
  // and scan path stay unchanged.
  default: "max-w-[1400px]",
  narrow: "max-w-3xl",
  reading: "max-w-2xl",
  // Illustrated long-form (the /guide pages): comparison tables, card strips
  // and tier grids need more room than a pure reading column, while running
  // prose is held to a comfortable measure by `.guide-article` in globals.css
  // (owner call เบส 2026-08-07: at `reading` the pages felt cramped and
  // visibly narrower than the rest of the site).
  article: "max-w-5xl",
  // Reserved for genuinely dense canvases that opt in explicitly.
  wide: "max-w-[1600px]",
  full: "max-w-none",
};

export interface PageContainerProps {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
  /** Set to true when this container is rendered *inside* a route shell that
   *  already provides horizontal padding/top spacing (admin/seller/settings
   *  shells). Defaults to false (i.e. apply default page padding). */
  inShell?: boolean;
}

/**
 * Single source of truth for page-content max width + horizontal padding.
 *
 * Use this instead of repeating `mx-auto max-w-* px-5 md:px-6 lg:px-8`. It
 * pairs with `PageContent` from [src/components/layout/main-chrome.tsx]; this
 * primitive is what shells (admin/seller/settings) and special routes
 * (pricing, marketplace listing, profile public) compose on top of.
 */
export function PageContainer({
  children,
  width = "default",
  className,
  inShell = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        WIDTH_CLASS[width],
        // Mobile gutter bumped 16px -> 20px (px-4 -> px-5) — 16px read as
        // content hugging the screen edge. md/lg unchanged. Anything that
        // breaks out full-bleed via `-mx-4` to cancel this padding needs the
        // matching `-mx-5` (see trending-tabs, settings, sets, set-detail,
        // market-overview).
        !inShell && "px-5 md:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
