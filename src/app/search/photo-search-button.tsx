"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  Camera,
  ImageIcon,
  RotateCcw,
  ScanSearch,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { PriceTag } from "@/components/ui/price-tag"
import { Surface } from "@/components/ui/surface"
import { ApiError, apiForm } from "@/lib/api/client"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName, t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { baseCardCode } from "@/lib/cards/card-code"

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

interface PhotoSearchButtonProps {
  className?: string
  trigger?: React.ReactElement | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  finalFocus?: React.RefObject<HTMLElement | null>
}

export function PhotoSearchButton({
  className,
  trigger,
  open: controlledOpen,
  onOpenChange,
  finalFocus,
}: PhotoSearchButtonProps) {
  const lang = useUIStore((s) => s.language)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<IdentifyResponse["data"] | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const takePhotoButtonRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  /** null = still asking · true = live feed · false = fall back to file inputs */
  const [cameraLive, setCameraLive] = useState<boolean | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Live camera while the screen is open. Released the moment it closes — a
  // page that keeps the lens warm after you leave is the fastest way to lose
  // permission for good.
  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function start() {
      const media = navigator.mediaDevices
      if (!media?.getUserMedia) {
        setCameraLive(false)
        return
      }
      try {
        const stream = await media.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraLive(true)
      } catch {
        // Denied, no camera, or an insecure origin — every one of them means
        // the same thing to the visitor: use the buttons instead.
        if (!cancelled) setCameraLive(false)
      }
    }

    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setCameraLive(null)
    }
  }, [open])

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setError(null)
    setResult(null)
    setLoading(false)
  }

  function handleOpenChange(next: boolean) {
    if (controlledOpen === undefined) setInternalOpen(next)
    onOpenChange?.(next)
    if (!next) reset()
  }

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0]
    event.target.value = ""
    if (!picked) return

    setError(null)
    setResult(null)

    // Picking a photo IS the intent, same as pressing the shutter — there is
    // no "now analyse" button on this screen to press afterwards.
    try {
      const compressed = await compressImage(picked)
      if (compressed.size > MAX_BYTES) {
        setError(t(lang, "photoSearchTooLarge"))
        return
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(compressed))
      void runIdentify(compressed)
    } catch {
      if (picked.size > MAX_BYTES) {
        setError(t(lang, "photoSearchTooLarge"))
        return
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(picked))
      void runIdentify(picked)
    }
  }

  /** Shutter: freeze the current video frame and send it straight off. No
   *  "now press analyse" step — pressing the shutter IS the intent. */
  async function handleShutter() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    )
    if (!blob) return

    const shot = new File([blob], "scan.jpg", { type: "image/jpeg" })
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(shot))
    void runIdentify(shot)
  }

  async function runIdentify(target: File) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append("file", target)
      const json = await apiForm<IdentifyResponse>("/api/cards/identify", formData)
      setResult(json.data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t(lang, "photoSearchAuthRequired"))
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t(lang, "photoSearchFailed"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger === null ? null : trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
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
      )}

      {/* Full-screen scanner (owner selection 2026-08-29 from
          /proto/photo-scan, style B). The old surface was a small dialog with
          two buttons that handed the job to the OS camera app; you never saw
          what the model would see until it was too late to move the card.
          Now the lens is ours: a live feed, a card-shaped frame (63:88 — the
          shape itself says what to point at, the way a QR box says "QR"), and
          the upload button parked bottom-left where every Thai banking app
          keeps it. */}
      <DialogContent
        showCloseButton={false}
        finalFocus={finalFocus}
        className="inset-0 top-0 left-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-black p-0"
      >
        <DialogTitle className="sr-only">{t(lang, "photoSearchTitle")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t(lang, "photoSearchDescription")}
        </DialogDescription>

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

        <div className="relative h-full w-full">
          {/* Layer 1 — what the camera sees, or the still we are analysing */}
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt=""
              fill
              unoptimized
              sizes="100vw"
              className={cn(
                "object-cover",
                result ? "opacity-40 blur-[2px]" : "opacity-80",
              )}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "size-full object-cover",
                cameraLive ? "opacity-100" : "opacity-0",
              )}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />

          {/* Layer 2 — the frame. Hidden once results are up: the answer is
              the subject then, not the viewfinder. */}
          {!result && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="relative aspect-[63/88] w-[64%] max-w-xs">
                <div className="absolute inset-0 rounded-2xl ring-1 ring-white/25" />
                {/* Dot grid — reads as an instrument, not just a viewfinder */}
                <div
                  className="absolute inset-2 rounded-xl opacity-40"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,.45) 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                />
                {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                  <span
                    key={corner}
                    className={cn(
                      "absolute size-7 border-primary",
                      loading && "scan-corner",
                      corner === "tl" && "left-0 top-0 rounded-tl-2xl border-l-[3px] border-t-[3px]",
                      corner === "tr" && "right-0 top-0 rounded-tr-2xl border-r-[3px] border-t-[3px]",
                      corner === "bl" && "bottom-0 left-0 rounded-bl-2xl border-b-[3px] border-l-[3px]",
                      corner === "br" && "bottom-0 right-0 rounded-br-2xl border-b-[3px] border-r-[3px]",
                    )}
                  />
                ))}
                {loading && (
                  <div className="absolute inset-x-1 inset-y-2 overflow-hidden rounded-xl">
                    <span className="scan-sweep absolute inset-x-0 h-px bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layer 3 — top bar */}
          {!result && (
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                aria-label={t(lang, "close")}
                className="grid size-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm"
              >
                <X className="size-5" />
              </button>
              <span className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                {loading ? t(lang, "photoSearchAnalyzing") : t(lang, "photoSearchTitle")}
              </span>
              <span className="size-11" aria-hidden />
            </div>
          )}

          {/* Layer 4 — controls, status, or the result sheet */}
          {result ? (
            <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl bg-background px-4 pb-8 pt-3 shadow-[0_-18px_60px_rgba(0,0,0,0.5)]">
              <span
                aria-hidden
                className="mx-auto mb-3 block h-1 w-10 rounded-full bg-muted-foreground/30"
              />
              <ResultBlock
                result={result}
                lang={lang}
                onClose={() => handleOpenChange(false)}
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="hairline ease-chrome flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors hover:bg-muted"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  {t(lang, "photoSearchScanAgain")}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="ease-chrome flex h-12 flex-1 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t(lang, "close")}
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="absolute inset-x-0 bottom-0 pb-10">
              <div className="mx-6 rounded-2xl bg-black/55 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary/25 text-primary">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
                    <ScanSearch className="relative size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      {t(lang, "photoSearchAnalyzing")}
                    </span>
                    <span className="block text-xs text-white/70">
                      {t(lang, "photoSearchComparing")}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 pb-8">
              {error ? (
                <p className="mx-6 mb-4 rounded-xl bg-destructive/90 px-3 py-2 text-center text-sm text-white">
                  {error}
                </p>
              ) : (
                <p className="mb-5 text-center text-sm text-white/85">
                  {cameraLive === false
                    ? t(lang, "photoSearchCameraBlocked")
                    : t(lang, "photoSearchAim")}
                </p>
              )}

              <div className="flex items-center justify-around px-8">
                {/* Bottom-left = pick from the library. Same corner every Thai
                    banking app puts it in, so the thumb already knows. */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm">
                    <ImageIcon className="size-5" aria-hidden />
                  </span>
                  <span className="text-micro text-white/80">
                    {t(lang, "photoSearchUpload")}
                  </span>
                </button>

                {cameraLive ? (
                  <button
                    type="button"
                    onClick={handleShutter}
                    aria-label={t(lang, "photoSearchTakePhoto")}
                    className="grid size-[72px] place-items-center rounded-full bg-white/25 ring-4 ring-white/70 backdrop-blur-sm active:scale-95"
                  >
                    <span className="size-14 rounded-full bg-white" />
                  </button>
                ) : (
                  <button
                    ref={takePhotoButtonRef}
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className="grid size-[72px] place-items-center rounded-full bg-white/25 ring-4 ring-white/70 backdrop-blur-sm">
                      <Camera className="size-7 text-white" aria-hidden />
                    </span>
                    <span className="text-micro text-white/80">
                      {t(lang, "photoSearchTakePhoto")}
                    </span>
                  </button>
                )}

                <span className="size-12" aria-hidden />
              </div>
            </div>
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
              {/* Read off the photo by the vision model, so normally already
                  the printed number — wrapped so a hallucinated `_p1` can never
                  reach the screen either. */}
              {baseCardCode(identification.cardCode)}
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
            <Surface
              as={Link}
              variant="outline"
              key={card.cardCode}
              href={`/opcg/cards/${card.cardCode}`}
              onClick={onClose}
              className="flex items-center gap-3 p-2 ease-chrome hover:bg-muted/70"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                  <span className="tabular-nums">{baseCardCode(card.cardCode)}</span>
                  <span>·</span>
                  <RarityBadge rarity={card.rarity} />
                  {card.isParallel && (
                    <span className="text-primary">· {t(lang, "parallel")}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <PriceTag
                  jpy={card.latestPriceJpy}
                  thb={card.latestPriceThb}
                  size="sm"
                  showChange={false}
                />
              </div>
            </Surface>
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
