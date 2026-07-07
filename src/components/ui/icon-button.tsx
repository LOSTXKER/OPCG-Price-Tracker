"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

const SIZES = { sm: "size-9", md: "size-10", lg: "size-11" } as const
const VARIANTS = {
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  solid:
    "border border-hair bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
} as const

/**
 * The one icon-only button (PORTFOLIO-06). Square target with a REQUIRED
 * accessible name. `ghost` = bare icon (no chrome), `solid` = hairline + card
 * surface. Replaces the per-file IconButton copies. Pass the icon as children;
 * onClick / disabled / etc. pass straight through.
 */
export function IconButton({
  children,
  "aria-label": ariaLabel,
  size = "sm",
  variant = "ghost",
  className,
  type = "button",
  title,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  children: ReactNode
  "aria-label": string
  size?: keyof typeof SIZES
  variant?: keyof typeof VARIANTS
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={cn(
        "ease-chrome inline-flex shrink-0 items-center justify-center rounded-lg transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-40",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
