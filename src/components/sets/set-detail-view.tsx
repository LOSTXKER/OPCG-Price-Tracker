"use client";

import { useState } from "react";

import {
  SetDetailContent,
  type RarityGroup,
} from "@/components/sets/set-detail-content";
import { SetHero, type SetHeroProps } from "@/components/sets/set-hero";
import type { GradeKey } from "@/lib/pricing/grade-tiers";

interface SetDetailViewProps {
  hero: Omit<SetHeroProps, "grade" | "rarityGroups">;
  groups: RarityGroup[];
  totalCards: number;
}

/** Keeps the set hero summary and card wall on one shared grade lens. */
export function SetDetailView({
  hero,
  groups,
  totalCards,
}: SetDetailViewProps) {
  const [grade, setGrade] = useState<GradeKey>("raw");

  return (
    <div className="space-y-8 sm:space-y-10">
      <SetHero {...hero} rarityGroups={groups} grade={grade} />
      <SetDetailContent
        groups={groups}
        totalCards={totalCards}
        grade={grade}
        onGradeChange={setGrade}
      />
    </div>
  );
}
