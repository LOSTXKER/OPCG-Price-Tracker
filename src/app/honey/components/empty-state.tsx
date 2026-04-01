import type { Trophy } from "lucide-react";

export function EmptyState({ icon: Icon, label }: { icon: typeof Trophy; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <Icon className="size-8 text-muted-foreground/20" />
      <p className="text-xs text-muted-foreground/60">{label}</p>
    </div>
  );
}
