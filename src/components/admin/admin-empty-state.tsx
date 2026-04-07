import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {Icon && (
        <div className="rounded-xl bg-muted/50 p-4">
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
      <div>
        <p className="font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground/70">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
