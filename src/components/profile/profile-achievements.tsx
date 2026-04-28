"use client";

import { useState } from "react";
import Image from "next/image";
import { Award, Sparkles, Trophy } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatRelativeAgo } from "@/lib/utils/relative-time";
import type {
  ProfileAchievement,
  ProfileBadge,
} from "@/lib/profile/load-public-profile";

const MAX_PREVIEW = 5;

function localizedName(
  lang: Language,
  item: { name: string; nameEn: string | null; nameTh: string | null },
) {
  if (lang === "TH" && item.nameTh) return item.nameTh;
  if (lang === "EN" && item.nameEn) return item.nameEn;
  return item.name;
}

function formatDate(lang: Language, iso: string) {
  // Use relative time everywhere on the public profile to avoid locale
  // surprises (e.g. Thai Buddhist year). See lib/utils/relative-time.
  return formatRelativeAgo(iso, lang);
}

export function ProfileAchievements({
  achievements,
  badges,
}: {
  achievements: ProfileAchievement[];
  badges: ProfileBadge[];
}) {
  const lang = useUIStore((s) => s.language);
  const [open, setOpen] = useState(false);
  const total = achievements.length + badges.length;

  if (total === 0) return null;

  const previewAchievements = achievements.slice(0, MAX_PREVIEW);
  const previewBadges = badges.slice(0, Math.max(0, MAX_PREVIEW - previewAchievements.length));
  const remaining = total - previewAchievements.length - previewBadges.length;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-amber-500" />
          {t(lang, "achievementsTitle")}
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-micro text-amber-700 dark:text-amber-400">
            {total}
          </span>
        </div>
        {total > MAX_PREVIEW && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="text-xs font-medium text-primary hover:underline">
              {t(lang, "viewAllAchievements")}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" />
                  {t(lang, "achievementsTitle")}
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {achievements.map((a) => (
                  <AchievementRow key={`a-${a.code}`} item={a} lang={lang} />
                ))}
                {badges.map((b) => (
                  <AchievementRow
                    key={`b-${b.id}`}
                    item={{
                      name: b.name,
                      nameEn: b.nameEn,
                      nameTh: b.nameTh,
                      description: null,
                      badgeImageUrl: b.imageUrl,
                      earnedAt: b.grantedAt,
                    }}
                    lang={lang}
                    isBadge
                  />
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {previewAchievements.map((a) => (
          <AchievementChip
            key={`a-${a.code}`}
            name={localizedName(lang, a)}
            description={a.description}
            imageUrl={a.badgeImageUrl}
            earnedAt={a.earnedAt}
            lang={lang}
          />
        ))}
        {previewBadges.map((b) => (
          <AchievementChip
            key={`b-${b.id}`}
            name={localizedName(lang, b)}
            description={null}
            imageUrl={b.imageUrl}
            earnedAt={b.grantedAt}
            lang={lang}
            isBadge
          />
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 min-w-[2.5rem] items-center justify-center rounded-full border border-dashed border-border/60 px-3 text-xs font-medium text-muted-foreground hover:border-border hover:text-foreground"
          >
            +{remaining}
          </button>
        )}
      </div>
    </div>
  );
}

function AchievementChip({
  name,
  description,
  imageUrl,
  earnedAt,
  lang,
  isBadge,
}: {
  name: string;
  description: string | null;
  imageUrl: string | null;
  earnedAt: string;
  lang: Language;
  isBadge?: boolean;
}) {
  const tooltip = description
    ? `${name} — ${description}\n${formatDate(lang, earnedAt)}`
    : `${name}\n${formatDate(lang, earnedAt)}`;
  return (
    <div
      title={tooltip}
      className={cn(
        "group flex h-9 items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs font-medium transition-colors hover:border-amber-400/60",
        isBadge ? "border-blue-500/30" : "border-amber-500/30",
      )}
    >
      <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="24px" />
        ) : isBadge ? (
          <Sparkles className="size-3.5 text-blue-500" />
        ) : (
          <Award className="size-3.5 text-amber-500" />
        )}
      </div>
      <span className="max-w-[10rem] truncate">{name}</span>
    </div>
  );
}

function AchievementRow({
  item,
  lang,
  isBadge,
}: {
  item: {
    name: string;
    nameEn: string | null;
    nameTh: string | null;
    description: string | null;
    badgeImageUrl: string | null;
    earnedAt: string;
  };
  lang: Language;
  isBadge?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/50 p-3">
      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {item.badgeImageUrl ? (
          <Image src={item.badgeImageUrl} alt="" fill className="object-cover" sizes="40px" />
        ) : isBadge ? (
          <Sparkles className="size-5 text-blue-500" />
        ) : (
          <Award className="size-5 text-amber-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{localizedName(lang, item)}</p>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-meta">{item.description}</p>
        )}
        <p className="mt-1 text-meta text-muted-foreground/60">
          {formatDate(lang, item.earnedAt)}
        </p>
      </div>
    </div>
  );
}
