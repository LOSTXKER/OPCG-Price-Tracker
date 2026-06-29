"use client";

import { useCallback, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Globe,
  Info,
  Layers,
  Lock,
  ShoppingBag,
  Star,
  Swords,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { apiPatch, apiTry } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/surface";
import type { DbUser } from "./profile-types";

const VISIBILITY_OPTIONS = [
  { value: "public", labelKey: "visibilityPublic" as const, descKey: "visibilityPublicDesc" as const, icon: Globe },
  { value: "private", labelKey: "visibilityPrivate" as const, descKey: "visibilityPrivateDesc" as const, icon: Lock },
] as const;

const SECTION_TOGGLES = [
  { field: "showCollection" as const, labelKey: "showCollection" as const, descKey: "showCollectionDesc" as const, icon: Layers },
  { field: "showListings" as const, labelKey: "showListings" as const, descKey: "showListingsDesc" as const, icon: ShoppingBag },
  { field: "showDecks" as const, labelKey: "showDecks" as const, descKey: "showDecksDesc" as const, icon: Swords },
  { field: "showStats" as const, labelKey: "showStats" as const, descKey: "showStatsDesc" as const, icon: Star },
] as const;

// The "Advanced" privacy section was removed because every toggle in it
// behaved confusingly or invisibly:
//   - hidePortfolioPrices / hidePortfolioQty: the public collection card is
//     image-only and never rendered prices or qty, so the flags had no
//     observable effect.
//   - profileSummaryOnly: only applied when `!isOwner`, so toggling and then
//     refreshing your own profile showed no change. Owners reasonably
//     concluded the toggle was broken.
// DB columns and API schema are kept for back-compat / no migration churn,
// but the UI no longer exposes any of them.

type AccountPrivacySectionProps = {
  user: DbUser;
  lang: Language;
  onUserUpdate: (user: DbUser) => void;
};

export function AccountPrivacySection({ user, lang, onUserUpdate }: AccountPrivacySectionProps) {
  const [profileVisibility, setProfileVisibility] = useState(user.profileVisibility ?? "public");
  const [sectionFlags, setSectionFlags] = useState({
    showCollection: user.showCollection ?? true,
    showListings: user.showListings ?? true,
    showDecks: user.showDecks ?? true,
    showStats: user.showStats ?? true,
  });
  const [savedField, setSavedField] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const privacyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const flash = useCallback((field: string, kind: "saved" | "error") => {
    if (privacyTimers.current[field]) clearTimeout(privacyTimers.current[field]);
    if (kind === "saved") {
      setSavedField(field);
      setErrorField(null);
    } else {
      setErrorField(field);
      setSavedField(null);
    }
    privacyTimers.current[field] = setTimeout(() => {
      setSavedField((p) => (p === field ? null : p));
      setErrorField((p) => (p === field ? null : p));
    }, 2000);
  }, []);

  const patchPrivacy = useCallback(
    async (field: string, value: unknown) => {
      const json = await apiTry(apiPatch<{ user: DbUser }>("/api/me", { [field]: value }));
      if (json) {
        onUserUpdate(json.user);
        flash(field, "saved");
      } else {
        flash(field, "error");
      }
    },
    [flash, onUserUpdate],
  );

  const activeVisibility = VISIBILITY_OPTIONS.find((o) => o.value === profileVisibility);

  return (
    <div id="privacy" className="space-y-5 scroll-mt-24">
      <div className="flex items-start gap-2 rounded-lg border border-transparent dark:border-[var(--p-hair)] bg-muted/30 px-3.5 py-2.5 text-meta">
        <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
        <p>{t(lang, "privacyAppliesAllPortfolios")}</p>
      </div>

      {/* ── Card 1: Profile visibility ─────────────────────────────────── */}
      <Card>
        <CardHeader
          eyebrow={t(lang, "privacyVisibilityEyebrow")}
          title={t(lang, "privacyVisibilityTitle")}
          subtitle={t(lang, "privacyVisibilitySubtitle")}
          feedback={<PrivacyFeedback field="profileVisibility" errorField={errorField} savedField={savedField} lang={lang} />}
        />
        <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2">
          {VISIBILITY_OPTIONS.map(({ value, labelKey, descKey, icon: Icon }) => {
            const active = profileVisibility === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setProfileVisibility(value);
                  void patchPrivacy("profileVisibility", value);
                }}
                aria-pressed={active}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                  active
                    ? "border-primary/60 bg-primary/[0.06] ring-1 ring-primary/20"
                    : "border-[var(--p-hair)] hover:border-border hover:bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    active ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t(lang, labelKey)}</span>
                  <span className="mt-0.5 block text-meta">{t(lang, descKey)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {activeVisibility ? (
          <div className="border-t border-[var(--p-hair)] bg-secondary/20 px-5 py-2.5 text-meta">
            {t(lang, activeVisibility.descKey)}
          </div>
        ) : null}
      </Card>

      {/* ── Card 2: What people can see ────────────────────────────────── */}
      <Card>
        <CardHeader
          eyebrow={t(lang, "privacyGroupSections")}
          title={t(lang, "privacySectionsTitle")}
          subtitle={t(lang, "privacySectionsSubtitle")}
        />
        <div className="divide-y divide-[var(--p-hair)] border-t border-[var(--p-hair)]">
          {SECTION_TOGGLES.map(({ field, labelKey, descKey, icon: Icon }) => (
            <PrivacyRow
              key={field}
              Icon={Icon}
              label={t(lang, labelKey)}
              desc={t(lang, descKey)}
              feedback={<PrivacyFeedback field={field} errorField={errorField} savedField={savedField} lang={lang} />}
              checked={sectionFlags[field]}
              onChange={(v) => {
                setSectionFlags((prev) => ({ ...prev, [field]: v }));
                void patchPrivacy(field, v);
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Building blocks ────────────────────────────────────────────────── */

function PrivacyFeedback({
  field,
  errorField,
  savedField,
  lang,
}: {
  field: string;
  errorField: string | null;
  savedField: string | null;
  lang: Language;
}) {
  if (errorField === field) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive animate-in fade-in zoom-in-95">
        <CircleAlert className="size-3" />
        {t(lang, "saveFailed")}
      </span>
    );
  }
  if (savedField === field) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in-95">
        <CircleCheck className="size-3" />
        {t(lang, "saved")}
      </span>
    );
  }
  return null;
}

function Card({ children }: { children: ReactNode }) {
  return (
    <Surface variant="outline" className="overflow-hidden">
      {children}
    </Surface>
  );
}

function CardHeader({
  eyebrow,
  title,
  subtitle,
  feedback,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  feedback?: ReactNode;
}) {
  return (
    <div className="px-5 pb-3 pt-4">
      {eyebrow ? <p className="text-eyebrow text-muted-foreground/70">{eyebrow}</p> : null}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h3 className="text-h5">{title}</h3>
        {feedback}
      </div>
      {subtitle ? <p className="mt-1 text-meta">{subtitle}</p> : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-input",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

function PrivacyRow({
  Icon,
  label,
  desc,
  feedback,
  checked,
  onChange,
}: {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  feedback: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{label}</p>
            {feedback}
          </div>
          <p className="text-meta">{desc}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
