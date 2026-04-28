import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  icon,
  badge,
  actions,
}: AdminPageHeaderProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      icon={icon}
      badge={badge}
      actions={actions}
    />
  );
}
