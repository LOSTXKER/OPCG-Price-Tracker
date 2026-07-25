"use client"

import { useCallback, useId, useRef, useState } from "react"
import {
  ChevronDown,
  Copy,
  Download,
  Loader2,
  Share2,
  SlidersHorizontal,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Surface } from "@/components/ui/surface"
import { Switch } from "@/components/ui/switch"
import {
  t,
  type Language,
  type TranslationKey,
} from "@/lib/i18n"
import { MASKED } from "@/lib/constants/ui"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUIStore } from "@/stores/ui-store"
import type { AssetRow, PortfolioStats } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"

import {
  PORTFOLIO_SHARE_PRESETS,
  PORTFOLIO_SHARE_SIZE,
  PortfolioShareCard,
  type PortfolioSharePreset,
  type PortfolioShareSections,
} from "./portfolio-share-card"

interface PortfolioShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioName: string
  stats: PortfolioStats
  history: { label: string; value: number }[]
  assets: AssetRow[]
  hideBalance?: boolean
}

type Action = "download" | "copy" | "share" | null
type ShareMode = PortfolioSharePreset | "custom"

const SHARE_SECTION_OPTIONS = [
  { key: "monetaryValues", labelKey: "shareShowMoney" },
  { key: "performance", labelKey: "shareShowPerformance" },
  { key: "costBasis", labelKey: "shareShowCostBasis" },
  { key: "allocation", labelKey: "shareShowAllocation" },
  { key: "holdings", labelKey: "shareShowHoldings" },
  { key: "holdingPrices", labelKey: "shareShowHoldingPrices" },
  { key: "counts", labelKey: "shareShowCounts" },
  { key: "date", labelKey: "shareShowDate" },
] as const satisfies ReadonlyArray<{
  key: keyof PortfolioShareSections
  labelKey: TranslationKey
}>

export function PortfolioShareDialog({
  open,
  onOpenChange,
  portfolioName,
  stats,
  history,
  assets,
  hideBalance = false,
}: PortfolioShareDialogProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)
  const cardRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState<Action>(null)
  const [preset, setPreset] = useState<ShareMode>("full")
  const [sections, setSections] = useState<PortfolioShareSections>(() => ({
    ...PORTFOLIO_SHARE_PRESETS.full,
  }))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsId = useId()
  const hydrated = useHydrated()

  const canCopy =
    hydrated &&
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof window !== "undefined" &&
    typeof window.ClipboardItem !== "undefined"

  const canNativeShare = hydrated && supportsNativeFileShare()

  const filename = getPortfolioImageFilename(portfolioName)

  function handlePresetChange(nextPreset: ShareMode) {
    if (nextPreset === "custom" || pending) return
    setPreset(nextPreset)
    setSections({ ...PORTFOLIO_SHARE_PRESETS[nextPreset] })
  }

  function handleSectionChange(
    key: keyof PortfolioShareSections,
    checked: boolean,
  ) {
    if (pending) return
    setPreset("custom")
    setSections((current) => {
      const next = { ...current, [key]: checked }

      if (key === "monetaryValues" && !checked) {
        next.costBasis = false
        next.holdingPrices = false
      }
      if (key === "holdings" && !checked) {
        next.holdingPrices = false
      }

      return next
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setSettingsOpen(false)
    onOpenChange(nextOpen)
  }

  async function generateBlob(): Promise<Blob> {
    if (!cardRef.current) throw new Error("Share card is not mounted")
    await prepareShareCard(cardRef.current)
    const { toBlob } = await import("html-to-image")
    const blob = await toBlob(cardRef.current, {
      pixelRatio: 1,
      cacheBust: true,
      // Next's image optimizer differentiates every card through query params.
      // Without this, html-to-image can reuse the first card for every slot.
      includeQueryParams: true,
      backgroundColor: getComputedBackground(cardRef.current),
      width: PORTFOLIO_SHARE_SIZE.width,
      height: PORTFOLIO_SHARE_SIZE.height,
    })
    if (!blob) throw new Error("Portfolio image generation returned no data")
    return blob
  }

  async function runImageAction(action: Exclude<Action, null>, work: () => Promise<void>) {
    if (pending) return
    setPending(action)
    try {
      await work()
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error(`[share] ${action} failed`, err)
      toast.error(t(lang, "imageGenerateFailed"))
    } finally {
      setPending(null)
    }
  }

  async function handleDownload() {
    await runImageAction("download", async () => {
      const blob = await generateBlob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
      toast.success(t(lang, "imageReady"))
    })
  }

  async function handleCopy() {
    await runImageAction("copy", async () => {
      const blob = await generateBlob()
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ])
      toast.success(t(lang, "imageCopied"))
    })
  }

  async function handleNativeShare() {
    await runImageAction("share", async () => {
      const blob = await generateBlob()
      const file = new File([blob], filename, { type: "image/png" })
      if (!navigator.canShare({ files: [file] })) {
        throw new Error("This browser cannot share PNG files")
      }
      await navigator.share({
        title: portfolioName,
        text: t(lang, "sharePortfolioTitle"),
        files: [file],
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="grid max-h-[calc(100dvh-1.5rem)] max-w-[calc(100%-1.5rem)] grid-cols-1 grid-rows-[auto_auto_auto_auto_auto] gap-0 overflow-y-auto p-0 sm:max-w-lg md:max-w-5xl md:grid-cols-[minmax(0,1fr)_20rem] md:grid-rows-[auto_minmax(0,1fr)_auto] md:overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="px-4 pt-4 pr-12 sm:px-5 sm:pt-5 md:col-start-2 md:row-start-1 md:border-b md:border-l md:border-hair md:px-5 md:pb-4 md:pt-6">
          <DialogTitle>{t(lang, "sharePortfolioTitle")}</DialogTitle>
          <DialogDescription className="text-body-sm">
            {t(lang, "sharePortfolioDesc")}
          </DialogDescription>
          <p className="text-meta hidden pt-3 md:block">
            <span className="text-code text-foreground">
              {PORTFOLIO_SHARE_SIZE.width} × {PORTFOLIO_SHARE_SIZE.height}
            </span>{" "}
            PNG
          </p>
        </DialogHeader>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setSettingsOpen((current) => !current)}
          disabled={pending !== null}
          aria-expanded={settingsOpen}
          aria-controls={settingsId}
          className="mx-4 mt-3 h-auto min-h-11 justify-between gap-3 rounded-lg border border-hair px-3 py-2 text-left sm:mx-5 md:hidden"
        >
          <span className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal
              className="size-4 shrink-0 text-primary"
              aria-hidden
            />
            <span className="min-w-0">
              <span className="text-label block text-foreground">
                {t(lang, "shareCustomizeImage")}
              </span>
              <span className="text-meta block truncate">
                {t(lang, "shareCustomizeHint")}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 motion-base",
              settingsOpen && "rotate-180",
            )}
            aria-hidden
          />
        </Button>

        <div
          id={settingsId}
          role="region"
          aria-label={t(lang, "shareCustomizeImage")}
          className={cn(
            "px-4 pb-1 pt-3 sm:px-5",
            settingsOpen ? "block" : "hidden",
            "md:col-start-2 md:row-start-2 md:block md:min-h-0 md:overflow-y-auto md:overscroll-contain md:border-l md:border-hair md:px-5 md:py-4",
          )}
        >
          <ShareCustomizationPanel
            lang={lang}
            preset={preset}
            sections={sections}
            disabled={pending !== null}
            idPrefix={settingsId}
            onPresetChange={handlePresetChange}
            onSectionChange={handleSectionChange}
          />
        </div>

        <figure className="relative mx-4 my-4 w-auto overflow-hidden rounded-xl border border-hair bg-muted/20 shadow-[var(--elev-flat)] sm:mx-5 md:col-start-1 md:row-span-3 md:row-start-1 md:mx-5 md:w-[calc(100%-2.5rem)] md:max-w-[calc(80dvh-3.2rem)] md:justify-self-center md:self-center">
          <PreviewScaler
            width={PORTFOLIO_SHARE_SIZE.width}
            height={PORTFOLIO_SHARE_SIZE.height}
          >
            <PortfolioShareCard
              ref={cardRef}
              portfolioName={portfolioName}
              totalValueJpy={stats.totalValueJpy}
              totalCostJpy={stats.totalCostJpy}
              unrealizedPnl={stats.unrealizedPnl}
              unrealizedPnlPercent={stats.unrealizedPnlPercent}
              valuedCopyCount={stats.valuedCopyCount}
              valuationComplete={stats.valuationComplete}
              performanceComplete={stats.performanceComplete}
              history={history}
              assets={assets}
              lang={lang}
              currency={currency}
              hideBalance={hideBalance}
              maskText={MASKED}
              sections={sections}
            />
          </PreviewScaler>
          <figcaption className="sr-only">
            {t(lang, "sharePortfolioDesc")}
          </figcaption>
        </figure>

        <div
          data-slot="portfolio-share-actions"
          aria-busy={pending !== null}
          className="grid grid-cols-2 gap-2 px-4 pb-4 sm:px-5 sm:pb-5 md:col-start-2 md:row-start-3 md:grid-cols-1 md:border-l md:border-t md:border-hair md:px-5 md:pb-6 md:pt-4"
        >
          <span className="sr-only" role="status" aria-live="polite">
            {pending ? t(lang, "imageGenerating") : ""}
          </span>
          {canNativeShare && (
            <Button
              type="button"
              onClick={handleNativeShare}
              disabled={pending !== null}
              aria-busy={pending === "share"}
              className="col-span-2 w-full justify-center gap-2 md:col-span-1"
            >
              {pending === "share" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Share2 className="size-4" aria-hidden />
              )}
              {t(lang, "sharePortfolio")}
            </Button>
          )}
          <Button
            type="button"
            variant={canNativeShare ? "outline" : "default"}
            onClick={handleDownload}
            disabled={pending !== null}
            aria-busy={pending === "download"}
            className={
              canNativeShare && canCopy
                ? "w-full justify-center gap-2"
                : "col-span-2 w-full justify-center gap-2 md:col-span-1"
            }
          >
            {pending === "download" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {t(lang, "downloadPng")}
          </Button>
          {canCopy && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              disabled={pending !== null}
              aria-busy={pending === "copy"}
              className={
                canNativeShare
                  ? "w-full justify-center gap-2"
                  : "col-span-2 w-full justify-center gap-2 md:col-span-1"
              }
              aria-label={t(lang, "copyImage")}
              title={t(lang, "copyImage")}
            >
              {pending === "copy" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {t(lang, "copyImage")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShareCustomizationPanel({
  lang,
  preset,
  sections,
  disabled,
  idPrefix,
  onPresetChange,
  onSectionChange,
}: {
  lang: Language
  preset: ShareMode
  sections: PortfolioShareSections
  disabled: boolean
  idPrefix: string
  onPresetChange: (preset: ShareMode) => void
  onSectionChange: (
    key: keyof PortfolioShareSections,
    checked: boolean,
  ) => void
}) {
  const presetHint =
    preset === "full"
      ? t(lang, "sharePresetFullHint")
      : preset === "percent"
        ? t(lang, "sharePresetPercentHint")
        : preset === "collection"
          ? t(lang, "sharePresetCollectionHint")
          : t(lang, "shareCustomizeHint")

  const presetOptions = [
    {
      value: "full" as const,
      label: t(lang, "sharePresetFull"),
      disabled,
    },
    {
      value: "percent" as const,
      label: t(lang, "sharePresetPercent"),
      disabled,
    },
    {
      value: "collection" as const,
      label: t(lang, "sharePresetCollection"),
      disabled,
    },
  ]

  return (
    <div className="space-y-3" aria-busy={disabled}>
      <div className="hidden md:block">
        <p className="text-h5">{t(lang, "shareCustomizeImage")}</p>
        <p className="text-meta mt-1">{t(lang, "shareCustomizeHint")}</p>
      </div>

      <Surface variant="subtle" padding="sm" className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-label">{t(lang, "sharePresetLabel")}</p>
          <span
            className="text-meta text-primary"
            aria-live="polite"
          >
            {preset === "custom" ? t(lang, "sharePresetCustom") : ""}
          </span>
        </div>
        <SegmentedControl<ShareMode>
          options={presetOptions}
          value={preset}
          onChange={onPresetChange}
          ariaLabel={
            preset === "custom"
              ? `${t(lang, "sharePresetLabel")}: ${t(
                  lang,
                  "sharePresetCustom",
                )}`
              : t(lang, "sharePresetLabel")
          }
          size="sm"
          fullWidth
          compactVisual
        />
        <p className="text-meta min-h-8">{presetHint}</p>
      </Surface>

      <Surface variant="outline" padding="none" className="overflow-hidden">
        <p className="text-eyebrow px-3 pb-2 pt-3">
          {t(lang, "shareShowInImage")}
        </p>
        <div className="divide-y divide-hair">
          {SHARE_SECTION_OPTIONS.map(({ key, labelKey }) => {
            const dependencyDisabled =
              (key === "costBasis" && !sections.monetaryValues) ||
              (key === "holdingPrices" &&
                (!sections.monetaryValues || !sections.holdings))
            const controlDisabled = disabled || dependencyDisabled
            const label = t(lang, labelKey)
            const switchId = `${idPrefix}-${key}`

            return (
              <div
                key={key}
                className="flex min-h-11 items-center justify-between gap-3 px-3 py-1"
              >
                <label
                  htmlFor={switchId}
                  className={cn(
                    "text-body-sm flex-1 text-foreground",
                    dependencyDisabled && "text-muted-foreground",
                  )}
                >
                  {label}
                </label>
                <Switch
                  id={switchId}
                  checked={sections[key]}
                  onCheckedChange={(checked) =>
                    onSectionChange(key, checked)
                  }
                  disabled={controlDisabled}
                  ariaLabel={label}
                />
              </div>
            )
          })}
        </div>
      </Surface>
    </div>
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
  const observeScaledElement = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return
      const parent = el.parentElement
      if (!parent) return

      const update = () => {
        const availableWidth = parent.clientWidth
        if (availableWidth > 0) {
          el.style.setProperty(
            "--share-scale",
            String(availableWidth / width),
          )
        }
      }

      update()
      if (typeof ResizeObserver === "undefined") return
      const observer = new ResizeObserver(update)
      observer.observe(parent)
      return () => observer.disconnect()
    },
    [width],
  )

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
          transform: "scale(var(--share-scale, 0.35))",
        }}
        ref={observeScaledElement}
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

async function prepareShareCard(el: HTMLElement): Promise<void> {
  await document.fonts?.ready
  const images = Array.from(el.querySelectorAll("img"))
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise<void>((resolve) => {
          let settled = false
          let timeout = 0
          const finish = () => {
            if (settled) return
            settled = true
            window.clearTimeout(timeout)
            image.removeEventListener("load", finish)
            image.removeEventListener("error", finish)
            resolve()
          }
          timeout = window.setTimeout(finish, 4_000)
          image.addEventListener("load", finish, { once: true })
          image.addEventListener("error", finish, { once: true })
        })
      }
      if (image.naturalWidth === 0) image.hidden = true
    }),
  )
}

function supportsNativeFileShare(): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function" ||
    typeof File === "undefined"
  ) {
    return false
  }

  try {
    const probe = new File([""], "meecard-portfolio.png", {
      type: "image/png",
    })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

export function getPortfolioImageFilename(
  portfolioName: string,
  date = new Date(),
): string {
  const safeName =
    portfolioName
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/gu, "")
      .slice(0, 48) || "portfolio"
  return `${safeName}-meecard-${date.toISOString().slice(0, 10)}.png`
}
