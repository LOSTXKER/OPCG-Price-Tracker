import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getGameConfig, getGameAccentTint } from "@/lib/game-config";
import { getServerLanguage } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coming Soon",
  robots: { index: false, follow: false },
};

/**
 * Teaser landing for a registered-but-not-live game (`comingSoon` in the config,
 * e.g. Pokémon). The game-switcher routes here with `?game=<slug>` instead of
 * navigating into that game's empty catalog — so the switch actually *does*
 * something. Deliberately does NOT change the active game (no cookie/store
 * write), so the rest of the app stays on the live game and nothing breaks.
 */
export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const [{ game }, lang] = await Promise.all([searchParams, getServerLanguage()]);
  const config = game ? getGameConfig(game) : undefined;
  const name = config?.nameEn ?? config?.name ?? "Meecard";
  // Thin per-game tint over the honey baseline — a whisper of the game's skin.
  const tint = getGameAccentTint(game ?? "");

  return (
    <div className="relative mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-4 left-1/2 -z-10 h-40 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)` }}
      />
      <span
        className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl ring-1 ring-hair"
        style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
      >
        <Sparkles className="size-8" aria-hidden />
      </span>
      <span
        className="mb-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-micro font-medium"
        style={{ background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint }}
      >
        {t(lang, "comingSoon")}
      </span>
      <h1 className="text-h1">{name}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{t(lang, "comingSoonSubtitle")}</p>
      <p className="mt-4 text-body text-muted-foreground">{t(lang, "comingSoonBody")}</p>
      <Link href="/" className="mt-8">
        <Button size="lg" className="gap-2 rounded-full">
          <ArrowLeft className="size-4" aria-hidden />
          {t(lang, "comingSoonBack")}
        </Button>
      </Link>
    </div>
  );
}
