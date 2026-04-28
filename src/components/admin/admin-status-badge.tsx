import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminStatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

interface AdminStatusBadgeProps {
  tone?: AdminStatusTone;
  children: ReactNode;
  /** Optional small icon (rendered before children). */
  icon?: ReactNode;
  /** Show a leading colored dot. Useful for compact status indicators. */
  dot?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const TONE_BG: Record<AdminStatusTone, string> = {
  success: "status-success",
  warning: "status-warning",
  danger: "status-danger",
  info: "status-info",
  neutral: "status-neutral",
  primary: "bg-primary/10 text-primary",
};

const TONE_DOT: Record<AdminStatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
};

/**
 * Single source of truth for admin status pills. Uses semantic status tokens
 * so light/dark mode just works. Replaces the ad-hoc green/amber/red Tailwind
 * mixes scattered around `matching-ui`, blog, missions, raffle, etc.
 *
 * Examples:
 *   <AdminStatusBadge tone="success">เผยแพร่แล้ว</AdminStatusBadge>
 *   <AdminStatusBadge tone="warning" dot>กำลังดำเนินการ</AdminStatusBadge>
 */
export function AdminStatusBadge({
  tone = "neutral",
  children,
  icon,
  dot = false,
  className,
  size = "sm",
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium leading-none whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        TONE_BG[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            TONE_DOT[tone],
          )}
          aria-hidden="true"
        />
      )}
      {icon}
      {children}
    </span>
  );
}
