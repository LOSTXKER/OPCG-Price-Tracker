"use client";

import Link from "next/link";

import { SectionHead } from "@/components/shared/section-head";
import { SetPosterTile } from "@/components/sets/set-poster-tile";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import type { OtherSet } from "@/lib/data/set-detail";

/**
 * "Browse other sets" rail at the bottom of a set-detail page (เบส) — poster
 * tiles linking to each set, matching the sets-index card (shadow + lift hover).
 *
 * Labels come from the client store rather than `getServerLanguage()` so the
 * set-detail route can stay on ISR (client-convert pattern). The links
 * themselves are still in the server HTML.
 */
export function OtherSets({ sets }: { sets: OtherSet[] }) {
  const lang = useUIStore((s) => s.language);
  const title = t(lang, "otherSets");
  const viewAllLabel = t(lang, "viewAll");

  if (sets.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHead
        title={title}
        action={
          <Link
            href="/opcg/sets"
            className="text-sm font-medium text-primary hover:underline"
          >
            {viewAllLabel}
          </Link>
        }
      />
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {sets.map((s) => (
          <SetPosterTile
            key={s.id}
            code={s.code}
            displayName={s.nameEn ?? s.name}
            imageUrl={s.boxImageUrl}
          />
        ))}
      </div>
    </section>
  );
}
