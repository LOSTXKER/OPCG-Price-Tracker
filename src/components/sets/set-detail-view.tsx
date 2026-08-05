"use client";

import { useState, type ReactNode } from "react";

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
  /** Server-rendered Thai intro block, slotted between the hero and the wall.
   *  Passed as a node so it stays in the first HTML response (this view is a
   *  client component only because of the shared grade lens). */
  intro?: ReactNode;
}

/** Keeps the set hero summary and card wall on one shared grade lens. */
export function SetDetailView({
  hero,
  groups,
  totalCards,
  intro,
}: SetDetailViewProps) {
  const [grade, setGrade] = useState<GradeKey>("raw");
  // Language comes from the client store (not a cookie) so the page can stay
  // on ISR — the client-convert pattern used by trending/search.
  const lang = useUIStore((s) => s.language);

  return (
    <div className="space-y-8 sm:space-y-10">
      <SetHero {...hero} lang={lang} rarityGroups={groups} grade={grade} />
      {intro}
      <SetDetailContent
        groups={groups}
        totalCards={totalCards}
        grade={grade}
        onGradeChange={setGrade}
      />
    </div>
  );
}
