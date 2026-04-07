import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AdminStatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function AdminStatCard({ label, value, sub, icon: Icon, color, bg }: AdminStatCardProps) {
  return (
    <Card size="sm">
      <div className="flex items-center gap-3">
        <div className={`shrink-0 rounded-lg p-2.5 ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {sub && (
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
