import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminPageProps {
  /** AdminPageHeader (or compatible) — rendered at top. */
  header?: ReactNode;
  /** Optional secondary tab nav (AdminSubNav) under the header. */
  subNav?: ReactNode;
  /** Optional sticky footer slot (e.g. AdminSaveBar). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Vertical spacing between body slots. Defaults to `space-y-6`. */
  bodyClassName?: string;
}

/**
 * Top-level wrapper for admin routes. Standardises spacing/layout so every
 * admin page renders header → optional subnav → body → optional sticky footer
 * with the same rhythm. The `<main>` container, breadcrumb and sidebar live
 * in `AdminShell` — this component owns only the per-page composition.
 */
export function AdminPage({
  header,
  subNav,
  footer,
  children,
  className,
  bodyClassName,
}: AdminPageProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {header}
      {subNav && <div className="mb-4">{subNav}</div>}
      <div className={cn("space-y-6", bodyClassName)}>{children}</div>
      {footer}
    </div>
  );
}
