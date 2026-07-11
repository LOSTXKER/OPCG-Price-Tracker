import type { Trophy } from "lucide-react";
import { EmptyState as SharedEmptyState } from "@/components/shared/empty-state";

export function EmptyState({ icon, label }: { icon: typeof Trophy; label: string }) {
  return <SharedEmptyState appearance="minimal" icon={icon} title={label} />;
}
