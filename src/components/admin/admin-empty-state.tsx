import type { LucideIcon } from "lucide-react";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";

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
    <KumaEmptyState
      variant="admin"
      icon={icon}
      title={title}
      description={description}
      action={action}
    />
  );
}
