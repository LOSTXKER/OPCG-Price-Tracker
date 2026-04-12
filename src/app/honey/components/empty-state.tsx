import type { Trophy } from "lucide-react";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";

export function EmptyState({ icon, label }: { icon: typeof Trophy; label: string }) {
  return <KumaEmptyState variant="minimal" icon={icon} title={label} />;
}
