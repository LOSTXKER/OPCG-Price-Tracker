"use client"

import Image from "next/image"
import Link from "next/link"

import { PriceDisplay } from "@/components/shared/price-display"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Sparkline } from "@/components/shared/sparkline"
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+M9QDwADggGAgxkG+QAAAABJRU5ErkJggg=="

export interface CardItemProps {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  rarity: string
  imageUrl?: string | null
  priceJpy?: number | null
  priceThb?: number | null
  priceChange7d?: number | null
  setCode?: string
  sparklineData?: { time: string; value: number }[]
}

export function CardItem({
  cardCode,
  nameJp,
  rarity,
  imageUrl,
  priceJpy,
  priceThb,
  priceChange7d,
  setCode,
  sparklineData,
}: CardItemProps) {
  const codeLabel = setCode ? `${setCode}-${cardCode}` : cardCode

  return (
    <Link
      href={`/cards/${cardCode}`}
      className="group/card-link block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        size="sm"
        className={cn(
          "h-full transition-[transform,box-shadow] duration-200",
          "hover:scale-[1.02] hover:shadow-lg"
        )}
      >
        <CardContent className="flex flex-col gap-2 pb-2">
          <div className="bg-muted/40 relative aspect-[63/88] w-full overflow-hidden rounded-md">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={nameJp}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                unoptimized={
                  imageUrl.startsWith("http://") ||
                  imageUrl.startsWith("https://")
                }
              />
            ) : (
              <Skeleton className="absolute inset-0 size-full rounded-md" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium leading-tight" title={nameJp}>
              {nameJp}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground font-mono text-xs">
                {codeLabel}
              </span>
              <RarityBadge rarity={rarity} size="sm" />
            </div>
          </div>
          <PriceDisplay
            priceJpy={priceJpy}
            priceThb={priceThb ?? undefined}
            change={priceChange7d ?? undefined}
            size="lg"
            className="pt-0.5"
          />
        </CardContent>
        <CardFooter className="flex w-full justify-center border-t pt-2 pb-3">
          <Sparkline
            data={sparklineData ?? []}
            width={148}
            height={36}
            className="text-primary w-full max-w-[148px]"
          />
        </CardFooter>
      </Card>
    </Link>
  )
}
