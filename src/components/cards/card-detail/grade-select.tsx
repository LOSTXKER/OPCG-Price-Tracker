"use client"

import { Check, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { GradeValue } from "./grade-value"
import { GradeLogo } from "./grade-logo"

const shortNum = (label: string, graded: boolean) =>
  graded ? label.replace(/^(PSA|BGS|CGC)\s*/i, "") : label

/**
 * Grade selector as a dropdown that sits ABOVE the price — pick a grade and the
 * page re-prices to it. The menu lists every available grade WITH its price, so
 * it doubles as a price table (the cheapest way to see all grades at a glance).
 */
export function GradeSelect({
  gradeData,
  selectedGrade,
  onSelectGrade,
  lang,
}: {
  gradeData: Record<GradeKey, GradeDatum>
  selectedGrade: GradeKey
  onSelectGrade: (key: GradeKey) => void
  lang: Language
}) {
  const datum = gradeData[selectedGrade]
  const tiers = GRADE_TIERS.filter((gt) => gradeData[gt.key].hasData)
  const selectedGraded = datum.tier.family !== "raw"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t(lang, "chooseGrade")}
        className="ease-chrome surface-1 hairline inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {selectedGraded && <GradeLogo family={datum.tier.family} />}
        {shortNum(datum.tier.label, selectedGraded)}
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px]">
        {tiers.map((gt) => {
          const d = gradeData[gt.key]
          const active = gt.key === selectedGrade
          const graded = gt.family !== "raw"
          return (
            <DropdownMenuItem
              key={gt.key}
              onClick={() => onSelectGrade(gt.key)}
              className={cn("flex items-center gap-2", active && "bg-foreground/5")}
            >
              <span className="flex w-12 shrink-0 items-center gap-1 font-semibold">
                {graded && <GradeLogo family={gt.family} />}
                {shortNum(gt.label, graded)}
              </span>
              <GradeValue datum={d} size="stat" className="ml-auto text-foreground" />
              {active && <Check className="size-3.5 shrink-0 text-foreground" aria-hidden />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
