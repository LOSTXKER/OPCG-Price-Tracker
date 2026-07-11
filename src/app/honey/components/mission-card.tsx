import { ArrowRight, CheckCircle2, Gift } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { isGameScopedSegment } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { localizedMissionName, localizedMissionDescription } from "../types";
import { RewardChips } from "./_shared/reward-chip";

/**
 * Action area for a mission task. Three visual states:
 *   - claimed       → checkmark, muted
 *   - canClaim      → primary filled with ping (ready to collect)
 *   - in-progress   → outline link "ไปทำภารกิจ" pointing at ctaPath, or disabled chip if no path
 *
 * Manual share tasks (no ctaPath, manual track) render the share button via `customCta`.
 */
export function ClaimAction({
  lang,
  claimed,
  canClaim,
  isClaiming,
  onClaim,
  ctaPath,
  customCta,
}: {
  lang: Language;
  claimed: boolean;
  canClaim: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  ctaPath?: string | null;
  customCta?: React.ReactNode;
}) {
  if (claimed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-meta">
        <CheckCircle2 className="size-3.5 text-price-up" />
        {t(lang, "missionClaimedLabel")}
      </span>
    );
  }
  if (canClaim) {
    return (
      <Button
        size="sm"
        disabled={isClaiming}
        onClick={onClaim}
        className="relative h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
      >
        <span className="absolute -right-1 -top-1 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
        <Gift className="size-3.5" />
        {isClaiming ? "..." : t(lang, "claimTaskReward")}
      </Button>
    );
  }
  if (customCta) return <>{customCta}</>;
  if (ctaPath) {
    const segment = ctaPath.split("/")[1];
    const href = isGameScopedSegment(segment) ? `/opcg${ctaPath}` : ctaPath;
    return (
      <NextLink
        href={href}
        className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold text-foreground ease-chrome transition-colors hover:bg-muted"
      >
        {t(lang, "missionGoLabel")}
        <ArrowRight className="size-3" />
      </NextLink>
    );
  }
  return (
    <Button
      size="sm"
      disabled
      className="h-8 gap-1.5 rounded-lg bg-muted px-3 text-xs font-bold text-muted-foreground"
    >
      {t(lang, "claimTaskReward")}
    </Button>
  );
}

/**
 * Backwards-compatible alias used by bonus rows that don't need a CTA path.
 * Bonuses can only be in two states: claimed or claim-now (when all sub-tasks done).
 */
export function ClaimButton({
  lang,
  claimed,
  canClaim,
  isClaiming,
  onClaim,
}: {
  lang: Language;
  claimed: boolean;
  canClaim: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}) {
  return (
    <ClaimAction
      lang={lang}
      claimed={claimed}
      canClaim={canClaim}
      isClaiming={isClaiming}
      onClaim={onClaim}
    />
  );
}

/**
 * Single row used by both daily and monthly mission grids. Replaces the
 * earlier card variant that wrapped each row's icon in a 40x40 muted box;
 * the icon is now inline so the page reads as a list of intents instead of
 * a deck of tiles.
 */
export function MissionCard({
  lang,
  icon: Icon,
  task,
  labelKey,
  hintText,
  honey,
  ticket,
  claimed,
  canClaim,
  isClaiming,
  onClaim,
  progress,
  target,
  shareButton,
  ctaPath,
}: {
  lang: Language;
  icon: React.ElementType;
  task?: {
    name?: string | null;
    nameEn?: string | null;
    nameTh?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
    descriptionTh?: string | null;
  };
  labelKey: string;
  hintText: string;
  honey: number;
  ticket: number;
  claimed: boolean;
  canClaim: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  progress?: number;
  target?: number;
  shareButton?: React.ReactNode;
  ctaPath?: string | null;
}) {
  const displayName = task ? localizedMissionName(task, lang) : null;
  const labelText = displayName ?? t(lang, labelKey as TranslationKey);
  const displayHint = task ? localizedMissionDescription(task, lang) : null;
  // Use `||` rather than `??` so an empty string from the DB still falls back
  // to the hintKey translation. Previously, daily missions stored with an
  // empty descriptionTh/descriptionEn rendered a blank hint line and looked
  // less detailed than monthly missions.
  const hint = (displayHint && displayHint.trim()) || hintText;

  return (
    <div className="flex items-center gap-3 bg-background p-4">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center text-muted-foreground",
          claimed && "text-price-up",
        )}
      >
        {claimed ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-h5", claimed && "text-muted-foreground line-through")}>
          {labelText}
        </p>
        <p className="mt-0.5 text-meta line-clamp-2">
          {hint}
          {target != null && target > 1 && (
            <span className="ml-1 font-semibold tabular-nums">({progress}/{target})</span>
          )}
        </p>
        <RewardChips honey={honey} ticket={ticket} muted={claimed} />
      </div>

      <div className="shrink-0">
        <ClaimAction
          lang={lang}
          claimed={claimed}
          canClaim={canClaim}
          isClaiming={isClaiming}
          onClaim={onClaim}
          ctaPath={ctaPath}
          customCta={shareButton}
        />
      </div>
    </div>
  );
}
