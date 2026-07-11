import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({
  icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <EmptyState
      appearance="admin"
      icon={icon}
      title={title}
      description={description}
      action={action}
    />
  );
}
