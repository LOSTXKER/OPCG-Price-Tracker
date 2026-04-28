import { ArrowRight, CheckCircle2, Gift, Ticket } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { localizedMissionName, localizedMissionDescription } from "../types";

export function RewardBadges({
  lang,
  honey,
  ticket,
  muted,
}: {
  lang: Language;
  honey: number;
  ticket: number;
  muted?: boolean;
}) {
  return (
    <div className={cn("mt-1.5 flex items-center gap-1.5", muted && "opacity-40")}>
      <span className="text-meta">{t(lang, "rewardPrefix")}</span>
      {honey > 0 && (
        <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
          <span className="text-xs leading-none">🍯</span>
          <span className="tabular-nums">x{honey}</span>
        </span>
      )}
      {ticket > 0 && (
        <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          <Ticket className="size-3 text-primary" />
          <span className="tabular-nums">x{ticket}</span>
        </span>
      )}
    </div>
  );
}

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
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-meta">
        <CheckCircle2 className="size-3.5 text-price-up" />
        {lang === "TH" ? "รับแล้ว" : lang === "JP" ? "受取済" : "Claimed"}
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
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
        </span>
        <Gift className="size-3.5" />
        {isClaiming ? "..." : t(lang, "claimTaskReward")}
      </Button>
    );
  }
  if (customCta) return <>{customCta}</>;
  if (ctaPath) {
    return (
      <NextLink
        href={ctaPath}
        className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
      >
        {lang === "TH" ? "ไปทำ" : lang === "JP" ? "進む" : "Go"}
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
  /**
   * Optional task object for resolving template-driven name/description.
   * When provided, takes priority over the static labelKey/hintText.
   */
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
  const hint = displayHint ?? hintText;

  return (
    <div className="flex items-center gap-3.5 bg-background p-4 transition-all">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {claimed ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4.5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-xs font-semibold", claimed && "text-muted-foreground line-through")}>
          {labelText}
        </p>
        <p className="mt-0.5 text-meta line-clamp-1">
          {hint}
          {target != null && target > 1 && (
            <span className="ml-1 font-semibold tabular-nums">({progress}/{target})</span>
          )}
        </p>
        <RewardBadges lang={lang} honey={honey} ticket={ticket} muted={claimed} />
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
