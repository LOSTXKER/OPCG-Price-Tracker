"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { PortfolioCreateDialog } from "@/components/portfolio/portfolio-create-dialog"
import { getPortfolioCreateCopy } from "@/components/portfolio/portfolio-create-copy"
import { PortfolioDetailSkeleton } from "@/components/portfolio/portfolio-detail-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { AuthPreviewGate } from "@/components/shared/login-gate"
import { Button } from "@/components/ui/button"
import { usePortfolioApi } from "@/hooks/use-portfolio-api"
import { t } from "@/lib/i18n"
import {
  readLastActivePortfolioId,
  setLastActivePortfolioId,
} from "@/lib/portfolio/last-active"
import { useUIStore } from "@/stores/ui-store"

import { PortfolioMockPreview } from "./portfolio-mock-preview"

export type PortfolioGatewayMode = "guest" | "empty"

export default function PortfolioClient({ mode }: { mode: PortfolioGatewayMode }) {
  const lang = useUIStore((state) => state.language)

  if (mode === "guest") {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="sr-only">{t(lang, "portfolioManagerSection")}</h1>
        <AuthPreviewGate preview={<PortfolioMockPreview lang={lang} />} />
      </div>
    )
  }

  return <EmptyPortfolioGateway />
}

function EmptyPortfolioGateway() {
  const router = useRouter()
  const lang = useUIStore((state) => state.language)
  const [createOpen, setCreateOpen] = useState(false)
  const navigatingRef = useRef(false)
  const creatingRef = useRef(false)
  const {
    loading,
    error,
    portfolioMetas,
    createPortfolio,
    reload,
  } = usePortfolioApi()

  useEffect(() => {
    if (
      loading ||
      error ||
      portfolioMetas.length === 0 ||
      navigatingRef.current ||
      creatingRef.current
    ) {
      return
    }

    const rememberedId = readLastActivePortfolioId()
    const destination =
      portfolioMetas.find((portfolio) => portfolio.id === rememberedId) ??
      portfolioMetas[0]

    navigatingRef.current = true
    setLastActivePortfolioId(destination.id)
    router.replace(`/portfolio/${destination.id}`)
  }, [error, loading, portfolioMetas, router])

  const createFromGateway = async (name: string, isPublic: boolean) => {
    creatingRef.current = true
    try {
      const result = await createPortfolio(name, isPublic)
      if (!result.ok) creatingRef.current = false
      return result
    } catch (error) {
      creatingRef.current = false
      throw error
    }
  }

  let content
  if (loading || portfolioMetas.length > 0) {
    content = <PortfolioDetailSkeleton />
  } else if (error) {
    content = (
      <EmptyState
        preset="error"
        variant="error"
        lang={lang}
        action={<Button onClick={() => void reload()}>{t(lang, "retry")}</Button>}
      />
    )
  } else {
    content = (
      <EmptyState
        title={t(lang, "noPortfolioYet")}
        lang={lang}
        action={
          <Button
            onClick={() => setCreateOpen(true)}
            className="min-h-11 gap-1.5 sm:min-h-11 md:min-h-0"
          >
            <Plus className="size-4" aria-hidden />
            {t(lang, "createPortfolio")}
          </Button>
        }
      />
    )
  }

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <h1 className="sr-only">{t(lang, "portfolioManagerSection")}</h1>
        {content}
      </div>

      <PortfolioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={createFromGateway}
        onCreated={(result, input) => {
          const id = result.data.id
          navigatingRef.current = true
          setLastActivePortfolioId(id)
          toast.success(t(lang, "portfolioCreated"), { description: input.name })
          router.replace(`/portfolio/${id}?add=1`)
        }}
        title={t(lang, "createPortfolioTitle")}
        description={t(lang, "createPortfolioDesc")}
        copy={getPortfolioCreateCopy(lang, t(lang, "createAndAddCards"))}
      />
    </>
  )
}
