"use client";

import { useCallback, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  DollarSign,
  Eye,
  EyeOff,
  Globe,
  Hash,
  Layers,
  Lock,
  ShoppingBag,
  Star,
  Swords,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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

const ADVANCED_PRIVACY_TOGGLES = [
  { field: "hidePortfolioPrices" as const, labelKey: "hidePortfolioPrices" as const, descKey: "hidePortfolioPricesDesc" as const, icon: DollarSign },
  { field: "hidePortfolioQty" as const, labelKey: "hidePortfolioQty" as const, descKey: "hidePortfolioQtyDesc" as const, icon: Hash },
  { field: "profileSummaryOnly" as const, labelKey: "profileSummaryOnly" as const, descKey: "profileSummaryOnlyDesc" as const, icon: EyeOff },
] as const;

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
    hidePortfolioPrices: user.hidePortfolioPrices ?? false,
    hidePortfolioQty: user.hidePortfolioQty ?? false,
    profileSummaryOnly: user.profileSummaryOnly ?? false,
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
      try {
        const res = await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        if (res.ok) {
          const json = (await res.json()) as { user: DbUser };
          onUserUpdate(json.user);
        }
        flash(field, res.ok ? "saved" : "error");
      } catch {
        flash(field, "error");
      }
    },
    [flash, onUserUpdate],
  );

  function PrivacyFeedback({ field }: { field: string }) {
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

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{t(lang, "privacy")}</h3>
            <PrivacyFeedback field="profileVisibility" />
          </div>
          <p className="mt-0.5 text-meta">{t(lang, "privacySubtitle")}</p>
        </div>
        <div className="flex items-center rounded-lg border border-border/40 p-0.5">
          {VISIBILITY_OPTIONS.map(({ value, labelKey, icon: Icon }) => {
            const active = profileVisibility === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setProfileVisibility(value);
                  void patchPrivacy("profileVisibility", value);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3" />
                {t(lang, labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border/30">
        <PrivacyGroup label={t(lang, "privacyGroupSections")}>
          {SECTION_TOGGLES.map(({ field, labelKey, descKey, icon: Icon }) => (
            <PrivacyRow
              key={field}
              Icon={Icon}
              label={t(lang, labelKey)}
              desc={t(lang, descKey)}
              feedback={<PrivacyFeedback field={field} />}
              checked={sectionFlags[field]}
              onChange={(v) => {
                setSectionFlags((prev) => ({ ...prev, [field]: v }));
                void patchPrivacy(field, v);
              }}
            />
          ))}
        </PrivacyGroup>
        <PrivacyGroup label={t(lang, "privacyGroupAdvanced")}>
          {ADVANCED_PRIVACY_TOGGLES.map(({ field, labelKey, descKey, icon: Icon }) => (
            <PrivacyRow
              key={field}
              Icon={Icon}
              label={t(lang, labelKey)}
              desc={t(lang, descKey)}
              feedback={<PrivacyFeedback field={field} />}
              checked={sectionFlags[field]}
              onChange={(v) => {
                setSectionFlags((prev) => ({ ...prev, [field]: v }));
                void patchPrivacy(field, v);
              }}
            />
          ))}
        </PrivacyGroup>
      </div>
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

function PrivacyGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-border/30 first:border-t-0">
      <div className="px-5 pt-3 pb-1">
        <p className="text-eyebrow text-muted-foreground/70">
          {label}
        </p>
      </div>
      <div className="divide-y divide-border/30">{children}</div>
    </div>
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
