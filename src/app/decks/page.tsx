"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  Dices,
  Flame,
  Hammer,
  LayoutGrid,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";

type Tool = {
  href: string;
  icon: LucideIcon;
  key: TranslationKey;
  disabled?: boolean;
};

// Active tools first, then reserved "coming soon" slots (meta / tier / builder).
// Order is stable so future features just flip `disabled` — no layout churn.
const TOOLS: Tool[] = [
  { href: "/opcg/deck-calculator", icon: LayoutGrid, key: "deckCalculatorNav" },
  { href: "/opcg/drop-calculator", icon: Dices, key: "dropCalculator" },
  { href: "/opcg/compare", icon: ArrowRightLeft, key: "compareCards" },
  { href: "/opcg/decks", icon: Hammer, key: "deckBuilder", disabled: true },
  { href: "/opcg/decks", icon: Flame, key: "metaCards", disabled: true },
  { href: "/opcg/decks", icon: Trophy, key: "tierList", disabled: true },
];

function ToolTile({ tool, label, comingSoon }: { tool: Tool; label: string; comingSoon: string }) {
  const Icon = tool.icon;
  const inner = (
    <Surface
      variant="outline"
      className={cn(
        "flex h-full flex-col gap-3 p-4",
        tool.disabled
          ? "opacity-60"
          : "hover:bg-muted/70 active:scale-[0.98]"
      )}
    >
      <div className="flex items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        {tool.disabled && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-micro text-muted-foreground">
            {comingSoon}
          </span>
        )}
      </div>
      <span className="text-h4">{label}</span>
    </Surface>
  );

  if (tool.disabled) {
    return (
      <div aria-disabled className="cursor-default">
        {inner}
      </div>
    );
  }
  return (
    <Link href={tool.href} className="block">
      {inner}
    </Link>
  );
}

export default function DecksHubPage() {
  const lang = useUIStore((s) => s.language);
  const currentGame = useUIStore((s) => s.currentGame);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-h1">{t(lang, "decksAndTools")}</h1>
        <span className="shrink-0 rounded-full border border-transparent dark:border-hair bg-secondary px-3 py-1 text-micro uppercase tracking-wide text-muted-foreground">
          {currentGame}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TOOLS.map((tool, i) => (
          <ToolTile
            key={`${tool.key}-${i}`}
            tool={tool}
            label={t(lang, tool.key)}
            comingSoon={t(lang, "comingSoon")}
          />
        ))}
      </div>

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
