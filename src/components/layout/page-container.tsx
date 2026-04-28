import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageWidth = "default" | "narrow" | "reading" | "wide" | "full";

const WIDTH_CLASS: Record<PageWidth, string> = {
  default: "max-w-7xl",
  narrow: "max-w-3xl",
  reading: "max-w-2xl",
  wide: "max-w-[1400px]",
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
 * Use this instead of repeating `mx-auto max-w-7xl px-4 md:px-6 lg:px-8`. It
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
        !inShell && "px-4 md:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
