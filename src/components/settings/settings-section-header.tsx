import type { ReactNode } from "react";

interface SettingsSectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Shared desktop heading for Settings sections. SettingsShell owns the mobile
 * title, while an optional action remains visible at every breakpoint.
 */
export function SettingsSectionHeader({
  title,
  description,
  action,
}: SettingsSectionHeaderProps) {
  if (!action) {
    return (
      <div className="hidden md:block">
        <h2 className="text-h2">{title}</h2>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 hidden md:block">
        <h2 className="text-h2">{title}</h2>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {action}
    </div>
  );
}
