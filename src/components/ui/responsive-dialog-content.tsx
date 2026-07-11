"use client"

import type { ComponentProps } from "react"

import { DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/**
 * Full-screen dialog surface on mobile, centered card from the chrome breakpoint.
 * Keep this limited to the shell; callers still own their content and actions.
 */
export function ResponsiveDialogContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "top-0 right-0 bottom-0 left-0 flex max-h-none max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0",
        "md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:h-auto md:max-h-[85dvh] md:w-full md:max-w-[34rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl",
        className,
      )}
      {...props}
    />
  )
}
