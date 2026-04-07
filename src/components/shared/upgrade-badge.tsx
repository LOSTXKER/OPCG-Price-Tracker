import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpgradeBadge({
  tier = "PRO",
  className,
}: {
  tier?: "PRO" | "PRO_PLUS";
  className?: string;
}) {
  const Icon = tier === "PRO_PLUS" ? Sparkles : Crown;
  const label = tier === "PRO_PLUS" ? "Pro+" : "Pro";

  return (
    <Link
      href="/pricing"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20",
        className,
      )}
    >
      <Icon className="size-2.5" />
      {label}
    </Link>
  );
}

export function LockOverlay({
  children,
  locked,
  className,
}: {
  children: React.ReactNode;
  locked: boolean;
  className?: string;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none opacity-40">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-border/50 backdrop-blur-sm transition-colors hover:bg-background"
        >
          <Lock className="size-3" />
          <Crown className="size-3" />
          Pro
        </Link>
      </div>
    </div>
  );
}
