"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Camera, Loader2, Sparkles, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

const MAX_BYTES = 8 * 1024 * 1024
const MAX_DIMENSION = 1600

interface IdentifiedCard {
  isCardImage: boolean
  cardCode: string | null
  setHint: string | null
  nameJp: string | null
  nameEn: string | null
  rarity: string | null
  color: string | null
  notes: string | null
}

interface MatchedCard {
  id: number
  cardCode: string
  baseCode: string | null
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  latestPriceThb: number | null
  priceChange24h: number | null
  priceChange7d: number | null
  priceChange30d: number | null
  set: { code: string; name?: string; nameEn: string | null } | null
}

interface IdentifyResponse {
  data: { identification: IdentifiedCard; cards: MatchedCard[] }
}

export function PhotoSearchButton({ className }: { className?: string }) {
  const lang = useUIStore((s) => s.language)
  const [open, setOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IdentifyResponse["data"] | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setFile(null)
    setError(null)
    setResult(null)
    setLoading(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ""
    if (!picked) return

    setError(null)
    setResult(null)

    try {
      const compressed = await compressImage(picked)
      if (compressed.size > MAX_BYTES) {
        setError(t(lang, "photoSearchTooLarge"))
        return
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFile(compressed)
      setPreviewUrl(URL.createObjectURL(compressed))
    } catch {
      if (picked.size > MAX_BYTES) {
        setError(t(lang, "photoSearchTooLarge"))
        return
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFile(picked)
      setPreviewUrl(URL.createObjectURL(picked))
    }
  }

  async function handleSubmit() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/cards/identify", {
        method: "POST",
        body: formData,
      })
      if (res.status === 401) {
        setError(t(lang, "photoSearchAuthRequired"))
        return
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error || t(lang, "photoSearchFailed"))
        return
      }
      const json = (await res.json()) as IdentifyResponse
      setResult(json.data)
    } catch {
      setError(t(lang, "photoSearchFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={t(lang, "photoSearchTitle")}
            className={className}
          />
        }
      >
        <Camera />
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            {t(lang, "photoSearchTitle")}
          </DialogTitle>
          <DialogDescription>{t(lang, "photoSearchDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePick}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePick}
          />

          {!previewUrl ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera />
                {t(lang, "photoSearchTakePhoto")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload />
                {t(lang, "photoSearchUpload")}
              </Button>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              <Image
                src={previewUrl}
                alt="preview"
                width={800}
                height={600}
                unoptimized
                className="h-auto max-h-[40vh] w-full object-contain"
              />
              <button
                type="button"
                onClick={reset}
                className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow-sm hover:bg-background"
                aria-label={t(lang, "remove")}
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {previewUrl && !result && (
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading
                ? t(lang, "photoSearchAnalyzing")
                : t(lang, "photoSearchAnalyze")}
            </Button>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {loading && !result && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          )}

          {result && (
            <ResultBlock
              result={result}
              lang={lang}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResultBlock({
  result,
  lang,
  onClose,
}: {
  result: IdentifyResponse["data"]
  lang: ReturnType<typeof useUIStore.getState>["language"]
  onClose: () => void
}) {
  const { identification, cards } = result

  if (!identification.isCardImage) {
    return (
      <EmptyState
        variant="panel"
        icon={Camera}
        title={t(lang, "photoSearchNotCard")}
        description={t(lang, "photoSearchNotCardDesc")}
      />
    )
  }

  return (
    <div className="space-y-3">
      <Surface variant="panel" padding="md" className="space-y-1">
        <p className="text-eyebrow">{t(lang, "photoSearchIdentified")}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {identification.cardCode && (
            <span className="text-h5 font-semibold tabular-nums">
              {identification.cardCode}
            </span>
          )}
          {identification.rarity && (
            <RarityBadge rarity={identification.rarity} />
          )}
          {identification.color && (
            <span className="text-meta">· {identification.color}</span>
          )}
        </div>
        {(identification.nameEn || identification.nameJp) && (
          <p className="text-body-sm">
            {identification.nameEn ?? identification.nameJp}
            {identification.nameEn && identification.nameJp && (
              <span className="text-meta"> · {identification.nameJp}</span>
            )}
          </p>
        )}
        {identification.notes && (
          <p className="text-meta">{identification.notes}</p>
        )}
      </Surface>

      {cards.length === 0 ? (
        <EmptyState
          variant="panel"
          title={t(lang, "photoSearchNoMatch")}
          description={t(lang, "photoSearchNoMatchDesc")}
        />
      ) : (
        <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
          {cards.map((card) => (
            <Link
              key={card.cardCode}
              href={`/cards/${card.cardCode}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-2 transition-colors hover:border-primary/40 hover:bg-muted/50"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.nameJp}
                    fill
                    sizes="56px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium">
                  {getCardName(lang, card)}
                </p>
                <div className="flex items-center gap-1.5 text-meta">
                  <span className="tabular-nums">{card.cardCode}</span>
                  <span>·</span>
                  <RarityBadge rarity={card.rarity} />
                  {card.isParallel && (
                    <span className="text-primary">· {t(lang, "parallel")}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <PriceDisplay
                  priceJpy={card.latestPriceJpy}
                  priceThb={card.latestPriceThb}
                  size="sm"
                  showChange={false}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file
  if (!file.type.startsWith("image/")) return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const targetW = Math.round(bitmap.width * scale)
  const targetH = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close?.()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  )
  if (!blob) return file

  return new File([blob], replaceExtension(file.name, "jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  })
}

function replaceExtension(name: string, ext: string): string {
  const dot = name.lastIndexOf(".")
  if (dot < 0) return `${name}.${ext}`
  return `${name.slice(0, dot)}.${ext}`
}
