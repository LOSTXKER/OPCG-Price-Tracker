import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/page-header";

interface AdminPageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Inline badge rendered next to the title (e.g. "BETA", small status). */
  badge?: ReactNode;
  /**
   * Meta row rendered between description and any custom children. Use this
   * for record counts, "last updated …", filter chips — anything that wants
   * to live with the title block instead of fighting the actions slot.
   */
  meta?: ReactNode;
  actions?: ReactNode;
  /** Optional breadcrumb above the header row. */
  breadcrumb?: ReactNode;
  /** Additional content rendered inside the title column below `meta`. */
  children?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  icon,
  badge,
  meta,
  actions,
  breadcrumb,
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      icon={icon}
      badge={badge}
      actions={actions}
      breadcrumb={breadcrumb}
      className={className}
    >
      {meta && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-meta">
          {meta}
        </div>
      )}
      {children}
    </PageHeader>
  );
}
