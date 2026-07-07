"use client";

import { useEffect, useRef } from "react";
import { Award, CheckCircle2, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function HoneyToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!message) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timerRef.current);
  }, [message, onDismiss]);

  if (!message) return null;

  const lc = message.toLowerCase();
  const isMilestone =
    lc.includes("perfect") || lc.includes("level") || lc.includes("onboarding");
  const isEarn =
    lc.includes("check-in") ||
    lc.includes("เช็คอิน") ||
    lc.includes("mission") ||
    lc.includes("ภารกิจ");

  const Icon = isMilestone ? Sparkles : isEarn ? CheckCircle2 : Award;
  const accent = isMilestone
    ? "border-amber-500/30 bg-amber-500/5"
    : isEarn
      ? "border-price-up/30 bg-price-up/5"
      : "border-primary/20 bg-background/95";
  const iconColor = isMilestone
    ? "text-amber-500"
    : isEarn
      ? "text-price-up"
      : "text-primary";

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[env(safe-area-inset-bottom,1rem)] z-50 mx-auto mb-4 flex w-fit max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 items-center gap-2.5 rounded-xl border px-4 py-3 shadow-[var(--elev-raised)] backdrop-blur-sm duration-[var(--dur-base)] sm:max-w-md",
        accent,
      )}
    >
      <Icon className={cn("size-4.5 shrink-0", iconColor)} />
      <span className="min-w-0 flex-1 break-words text-xs font-semibold text-foreground">
        {message}
      </span>
      <button
        onClick={onDismiss}
        className="tap-safe shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
