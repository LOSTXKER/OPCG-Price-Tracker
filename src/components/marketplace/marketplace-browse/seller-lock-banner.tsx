"use client"

import Link from "next/link"
import { Store, X } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { LockedSeller } from "./types"

export function SellerLockBanner({ seller }: { seller: NonNullable<LockedSeller> }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Store className="size-4 shrink-0 text-primary" />
        <span className="truncate text-foreground">
          รายการขายของ{" "}
          <Link
            href={seller.handle ? `/u/${seller.handle}` : `/profile/${seller.id}`}
            className="font-semibold text-primary hover:underline"
          >
            {seller.displayName ?? seller.handle ?? "ผู้ขาย"}
          </Link>
        </span>
      </div>
      <Link
        href="/marketplace"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 gap-1 px-2 text-xs")}
      >
        <X className="size-3" />
        ดูทั้งหมด
      </Link>
    </div>
  )
}
