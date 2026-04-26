import { CheckCircle2, Gift, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
      <span className="text-xs text-muted-foreground">{t(lang, "rewardPrefix")}</span>
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
  if (claimed) {
    return <CheckCircle2 className="size-4 text-muted-foreground" />;
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

export function MissionCard({
  lang,
  icon: Icon,
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
}: {
  lang: Language;
  icon: React.ElementType;
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
}) {
  return (
    <div className="flex items-center gap-3.5 bg-background p-4 transition-all">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {claimed ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4.5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-xs font-semibold", claimed && "text-muted-foreground line-through")}>
          {t(lang, labelKey as TranslationKey)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
          {hintText}
          {target != null && target > 1 && (
            <span className="ml-1 font-semibold tabular-nums">({progress}/{target})</span>
          )}
        </p>
        <RewardBadges lang={lang} honey={honey} ticket={ticket} muted={claimed} />
        {shareButton}
      </div>

      <div className="shrink-0">
        <ClaimButton
          lang={lang}
          claimed={claimed}
          canClaim={canClaim}
          isClaiming={isClaiming}
          onClaim={onClaim}
        />
      </div>
    </div>
  );
}
