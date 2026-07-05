"use client"

import { Clock } from "lucide-react"

import { SearchResultRow, type SearchResult } from "@/components/shared/search-result-row"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

export type { SearchResult }

export function SearchResultsDropdown({
  results,
  filteredRecent,
  loading,
  activeIdx,
  onSelectCard,
  onSelectRecent,
}: {
  results: SearchResult[]
  filteredRecent: string[]
  loading: boolean
  activeIdx: number
  onSelectCard: (code: string) => void
  onSelectRecent: (query: string) => void
}) {
  const lang = useUIStore((s) => s.language)
  return (
    <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-[var(--p-hair)] bg-popover shadow-lg">
      <div className="max-h-80 overflow-y-auto">
        {loading && results.length === 0 && (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            {t(lang, "searching")}
          </div>
        )}

        {results.length > 0 && (
          <div className="p-1">
            {results.map((card, i) => (
              <button
                key={card.cardCode}
                type="button"
                onClick={() => onSelectCard(card.cardCode)}
                className={cn(
                  "ease-chrome flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent",
                  activeIdx === i && "bg-accent"
                )}
              >
                <SearchResultRow card={card} lang={lang} />
              </button>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && filteredRecent.length > 0 && (
          <div className="p-1">
            <p className="px-3 py-1.5 text-eyebrow">
              {t(lang, "recentSearches")}
            </p>
            {filteredRecent.map((item, i) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelectRecent(item)}
                className={cn(
                  "ease-chrome flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  activeIdx === i && "bg-accent"
                )}
              >
                <Clock className="size-3.5 text-muted-foreground" />
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
