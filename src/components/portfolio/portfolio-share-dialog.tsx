"use client"

import { useRef, useState } from "react"
import { Copy, Download, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import type { AssetRow, PortfolioStats } from "@/lib/types/portfolio"

import { PortfolioShareCard } from "./portfolio-share-card"

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350

interface PortfolioShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioName: string
  stats: PortfolioStats
  history: { label: string; value: number }[]
  assets: AssetRow[]
}

type Action = "download" | "copy" | "share" | null

export function PortfolioShareDialog({
  open,
  onOpenChange,
  portfolioName,
  stats,
  history,
  assets,
}: PortfolioShareDialogProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const cardRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState<Action>(null)

  const canCopy =
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof window !== "undefined" &&
    typeof window.ClipboardItem !== "undefined"

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function"

  const filename = `${slugify(portfolioName || "portfolio")}-${new Date()
    .toISOString()
    .slice(0, 10)}.png`

  async function generateBlob(): Promise<Blob | null> {
    if (!cardRef.current) return null
    const { toBlob } = await import("html-to-image")
    return await toBlob(cardRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: getComputedBackground(cardRef.current),
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    })
  }

  async function handleDownload() {
    if (pending) return
    setPending("download")
    try {
      const { toPng } = await import("html-to-image")
      if (!cardRef.current) return
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: getComputedBackground(cardRef.current),
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(t(lang, "imageReady"))
    } catch (err) {
      console.error("[share] download failed", err)
      toast.error(t(lang, "shareCopyLink"))
    } finally {
      setPending(null)
    }
  }

  async function handleCopy() {
    if (pending) return
    setPending("copy")
    try {
      const blob = await generateBlob()
      if (!blob) throw new Error("blob failed")
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
      toast.success(t(lang, "imageCopied"))
    } catch (err) {
      console.error("[share] copy failed", err)
      toast.error(t(lang, "shareCopyLink"))
    } finally {
      setPending(null)
    }
  }

  async function handleNativeShare() {
    if (pending) return
    setPending("share")
    try {
      const blob = await generateBlob()
      if (!blob) throw new Error("blob failed")
      const file = new File([blob], filename, { type: "image/png" })
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: portfolioName,
          text: t(lang, "sharePortfolioTitle"),
          files: [file],
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("[share] native share failed", err)
      toast.error(t(lang, "shareCopyLink"))
    } finally {
      setPending(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid max-w-[calc(100%-1.5rem)] gap-4 p-4 sm:max-w-md sm:p-5"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {t(lang, "sharePortfolioTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t(lang, "sharePortfolioDesc")}
          </DialogDescription>
        </DialogHeader>

        {/* Preview frame — scales the 1080x1350 card to fit the dialog */}
        <div className="relative mx-auto w-full overflow-hidden rounded-xl border border-hair bg-muted/20">
          <PreviewScaler width={CARD_WIDTH} height={CARD_HEIGHT}>
            <PortfolioShareCard
              ref={cardRef}
              portfolioName={portfolioName}
              totalValueJpy={stats.totalValueJpy}
              totalCostJpy={stats.totalCostJpy}
              unrealizedPnl={stats.unrealizedPnl}
              unrealizedPnlPercent={stats.unrealizedPnlPercent}
              history={history}
              assets={assets}
              lang={lang}
              currency={currency}
            />
          </PreviewScaler>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleDownload}
            disabled={pending !== null}
            className="flex-1 gap-1.5"
          >
            {pending === "download" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {t(lang, "downloadPng")}
          </Button>
          {canCopy && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              disabled={pending !== null}
              className="gap-1.5"
              aria-label={t(lang, "copyImage")}
              title={t(lang, "copyImage")}
            >
              {pending === "copy" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
              <span className="hidden sm:inline">{t(lang, "copyImage")}</span>
            </Button>
          )}
          {canNativeShare && (
            <Button
              type="button"
              variant="outline"
              onClick={handleNativeShare}
              disabled={pending !== null}
              className="gap-1.5"
              aria-label={t(lang, "sharePortfolio")}
              title={t(lang, "sharePortfolio")}
            >
              {pending === "share" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Share2 className="size-4" />
              )}
              <span className="hidden sm:inline">
                {t(lang, "sharePortfolio")}
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Renders children at their fixed `width`/`height` and visually scales them
 * down to fit the available container width using CSS transform. The DOM stays
 * at full resolution so html-to-image can capture a sharp image.
 */
function PreviewScaler({
  width,
  height,
  children,
}: {
  width: number
  height: number
  children: React.ReactNode
}) {
  return (
    <div
      className="relative w-full"
      style={{
        // Visual aspect-ratio box for the scaled-down preview.
        aspectRatio: `${width} / ${height}`,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width,
          height,
          // We use a CSS variable + transform that scales based on container.
          // Container is 100% wide, child is `width`px wide → ratio = 100% / width.
          transform: "scale(var(--share-scale))",
          // The variable is set per-frame via a tiny container query:
        }}
        ref={(el) => {
          if (!el) return
          const parent = el.parentElement
          if (!parent) return
          const update = () => {
            const w = parent.clientWidth
            if (w > 0) el.style.setProperty("--share-scale", String(w / width))
          }
          update()
          // Resize observer, attached only once per node mount.
          if (!(el as unknown as { __ro?: ResizeObserver }).__ro) {
            const ro = new ResizeObserver(update)
            ro.observe(parent)
            ;(el as unknown as { __ro?: ResizeObserver }).__ro = ro
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}

function getComputedBackground(el: HTMLElement): string {
  try {
    const bg = getComputedStyle(el).backgroundColor
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg
  } catch {
    // ignore
  }
  return "#ffffff"
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "portfolio"
  )
}
