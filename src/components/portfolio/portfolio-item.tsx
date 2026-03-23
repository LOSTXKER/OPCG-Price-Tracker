import Image from "next/image"
import Link from "next/link"
import { Trash2 } from "lucide-react"

import { PriceDisplay } from "@/components/shared/price-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PortfolioItemProps {
  cardCode: string
  nameJp: string
  imageUrl?: string | null
  quantity: number
  purchasePrice?: number | null
  currentPrice?: number | null
  condition: string
  onRemove?: () => void
}

function conditionBadgeVariant(condition: string) {
  const c = condition.toUpperCase()
  if (c === "NM") return "default" as const
  if (c === "LP") return "secondary" as const
  if (c === "MP") return "outline" as const
  if (c === "HP" || c === "DMG") return "destructive" as const
  return "outline" as const
}

export function PortfolioItem({
  cardCode,
  nameJp,
  imageUrl,
  quantity,
  purchasePrice,
  currentPrice,
  condition,
  onRemove,
}: PortfolioItemProps) {
  const lineCost =
    purchasePrice != null && currentPrice != null
      ? (currentPrice - purchasePrice) * quantity
      : null
  const linePct =
    purchasePrice != null && purchasePrice > 0 && currentPrice != null
      ? ((currentPrice - purchasePrice) / purchasePrice) * 100
      : null
  const pnlPositive = lineCost != null ? lineCost >= 0 : null
  const detailHref = `/cards/${encodeURIComponent(cardCode)}`

  return (
    <div className="bg-card flex gap-3 rounded-xl border p-3 ring-1 ring-foreground/10">
      <Link
        href={detailHref}
        className="bg-muted relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-md"
        aria-label={`View ${nameJp}`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${nameJp} (${cardCode})`}
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
            —
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="hover:text-primary line-clamp-2 font-medium leading-snug underline-offset-4 hover:underline"
            >
              {nameJp}
            </Link>
            <p className="text-muted-foreground font-mono text-xs">{cardCode}</p>
          </div>
          {onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={onRemove}
              aria-label="Remove from portfolio"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            ×{quantity}
          </Badge>
          <Badge variant={conditionBadgeVariant(condition)}>{condition}</Badge>
        </div>

        <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Cost</p>
            <p className="font-mono">
              {purchasePrice != null ? (
                <PriceDisplay
                  priceJpy={purchasePrice * quantity}
                  showChange={false}
                  size="sm"
                />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Current</p>
            <p className="font-mono">
              {currentPrice != null ? (
                <PriceDisplay
                  priceJpy={currentPrice * quantity}
                  showChange={false}
                  size="sm"
                />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </p>
          </div>
        </div>

        {lineCost != null && linePct != null ? (
          <p
            className={cn(
              "mt-2 font-mono text-sm font-medium",
              pnlPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            P&amp;L {lineCost >= 0 ? "+" : ""}
            {lineCost.toLocaleString()} ¥ ({linePct >= 0 ? "+" : ""}
            {linePct.toFixed(1)}%)
          </p>
        ) : (
          <p className="text-muted-foreground mt-2 text-xs">P&amp;L unavailable</p>
        )}
      </div>
    </div>
  )
}
