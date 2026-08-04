"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  Dices,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { buildDecksHubCopy } from "@/lib/seo/copy/tools";

const TOOL_ICONS: Record<string, LucideIcon> = {
  "/opcg/deck-calculator": LayoutGrid,
  "/opcg/drop-calculator": Dices,
  "/opcg/compare": ArrowRightLeft,
};

export default function DecksHubPage() {
  const lang = useUIStore((s) => s.language);
  const currentGame = useUIStore((s) => s.currentGame);
  const copy = buildDecksHubCopy(lang);

  return (
    <div>
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "decksAndTools" }]} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-h1">{copy.h1}</h1>
        <span className="shrink-0 rounded-full border border-transparent dark:border-hair bg-secondary px-3 py-1 text-micro uppercase tracking-wide text-muted-foreground">
          {currentGame}
        </span>
      </div>
      <p className="mb-6 text-body-sm text-muted-foreground">{copy.intro}</p>

      {/* Only shipping tools render. The three disabled "เร็ว ๆ นี้" tiles were
          placeholder content in the crawlable HTML — a thin-content signal — so
          they are gone from the document entirely, not just visually hidden. */}
      <section>
        <h2 className="mb-3 text-h3">{copy.toolsTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {copy.tools.map((tool) => {
            const Icon = TOOL_ICONS[tool.href] ?? LayoutGrid;
            return (
              <Surface
                as={Link}
                key={tool.href}
                variant="outline"
                interactive
                href={tool.href}
                className="flex h-full flex-col gap-3 p-4"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="text-h4">{tool.title}</span>
                <span className="text-body-sm text-muted-foreground">{tool.detail}</span>
              </Surface>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-h3">{t(lang, "myDecks")}</h2>
        <Surface
          variant="outline"
          padding="lg"
          className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <p className="text-body-sm min-w-0 flex-1 text-muted-foreground">
            {t(lang, "manageDecksDesc")}
          </p>
          <Button
            size="sm"
            className="min-h-11 shrink-0 gap-1.5 sm:min-h-9"
            render={<Link href="/opcg/deck-calculator" />}
          >
            {t(lang, "openDeckBuilder")}
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        </Surface>
      </section>
    </div>
  );
}
