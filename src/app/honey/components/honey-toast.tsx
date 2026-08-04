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
    ? "border-amber-500/30 bg-background"
    : isEarn
      ? "border-price-up/30 bg-background"
      : "border-primary/20 bg-background";
  const iconColor = isMilestone
    ? "text-amber-500"
    : isEarn
      ? "text-price-up"
      : "text-primary";

  return (
    <div
      className={cn(
        // Clears the mobile tab bar + any floating ad the same way the compare
        // bar and scroll-to-top do. It used to sit at `bottom-0` on `z-50`, i.e.
        // geometrically INSIDE the nav band and on the nav's own layer — the nav
        // is later in the DOM, so the toast was 100% invisible on phones.
        "fixed inset-x-0 bottom-[calc(5rem+var(--floating-ad-clearance))] z-toast mx-auto flex w-fit max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 items-center gap-2.5 rounded-xl border px-4 py-3 shadow-[var(--elev-raised)] duration-[var(--dur-base)] sm:max-w-md md:bottom-[calc(1.5rem+var(--floating-ad-clearance))]",
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
