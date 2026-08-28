"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { ArrowLink } from "@/components/shared/arrow-link";
import { SectionHead } from "@/components/shared/section-head";
import {
  SetDetailContent,
  type RarityGroup,
} from "@/components/sets/set-detail-content";
import { SetHero, type SetHeroProps } from "@/components/sets/set-hero";
import { useUIStore } from "@/stores/ui-store";
import type { GradeKey } from "@/lib/pricing/grade-tiers";

interface SetDetailViewProps {
  hero: Omit<SetHeroProps, "grade" | "rarityGroups" | "lang">;
  groups: RarityGroup[];
  totalCards: number;
  introTitle: string;
  introBody: string;
  introActionLabel: string;
  introActionHref: string;
}

/** Keeps the set hero summary and card wall on one shared grade lens. */
export function SetDetailView({
  hero,
  groups,
  totalCards,
  introTitle,
  introBody,
  introActionLabel,
  introActionHref,
}: SetDetailViewProps) {
  const [grade, setGrade] = useState<GradeKey>("raw");
  const pendingScrollY = useRef<number | null>(null);
  // Language comes from the client store (not a cookie) so the page can stay
  // on ISR — the client-convert pattern used by trending/search.
  const lang = useUIStore((s) => s.language);

  const changeGrade = (nextGrade: GradeKey) => {
    if (nextGrade === grade) return;
    pendingScrollY.current = window.scrollY;
    setGrade(nextGrade);
  };

  // Changing grade can remove whole rarity groups. Browser scroll anchoring
  // used to pull the page upward even when the control was already visible;
  // restore the reader's exact viewport after the new wall commits.
  useLayoutEffect(() => {
    const savedScrollY = pendingScrollY.current;
    if (savedScrollY == null) return;

    const restore = () => {
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      window.scrollTo({
        top: Math.min(savedScrollY, maxScrollY),
        behavior: "auto",
      });
    };

    restore();
    const frame = window.requestAnimationFrame(restore);
    pendingScrollY.current = null;
    return () => window.cancelAnimationFrame(frame);
  }, [grade]);

  return (
    <div className="space-y-5 sm:space-y-8">
      <SetHero {...hero} lang={lang} rarityGroups={groups} grade={grade} />
      {/* Primitive string props keep this boundary serializable and remove the
          keyed-ReactNode warning the old server slot produced in development. */}
      <section>
        <SectionHead
          title={introTitle}
          description={introBody}
          action={
            <ArrowLink
              href={introActionHref}
              className="hidden min-h-11 shrink-0 sm:inline-flex"
            >
              {introActionLabel}
            </ArrowLink>
          }
        />
        <SetDetailContent
          groups={groups}
          totalCards={totalCards}
          grade={grade}
          onGradeChange={changeGrade}
        />
      </section>
    </div>
  );
}
