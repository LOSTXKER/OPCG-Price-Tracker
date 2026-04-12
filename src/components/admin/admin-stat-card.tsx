import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";

interface AdminStatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function AdminStatCard({ label, value, sub, icon, color, bg }: AdminStatCardProps) {
  return <StatCard label={label} value={value} sub={sub} icon={icon} color={color} bg={bg} />;
}
