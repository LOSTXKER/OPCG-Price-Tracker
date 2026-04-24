"use client";

import { useCallback, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  AtSign,
  Camera,
  CircleAlert,
  CircleCheck,
  DollarSign,
  Eye,
  EyeOff,
  Globe,
  Hash,
  Layers,
  Loader2,
  Lock,
  Mail,
  Pencil,
  ShoppingBag,
  Star,
  Swords,
  UserCog,
} from "lucide-react";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DbUser } from "./profile-types";

const nameSchema = z.string().trim().min(1, "Name is required").max(120);

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

const HANDLE_REGEX = /^[a-z0-9_]{3,24}$/;

type Props = {
  user: DbUser;
  onUserUpdate: (user: DbUser) => void;
};

export function SectionAccount({ user, onUserUpdate }: Props) {
  const lang = useUIStore((s) => s.language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [handleInput, setHandleInput] = useState(user.handle ?? "");
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [savingHandle, setSavingHandle] = useState(false);
  const [socials, setSocials] = useState({
    socialLine: user.socialLine ?? "",
    socialIg: user.socialIg ?? "",
    socialTwitter: user.socialTwitter ?? "",
    socialFacebook: user.socialFacebook ?? "",
  });
  const [savingSocials, setSavingSocials] = useState(false);
  const [socialsSavedAt, setSocialsSavedAt] = useState<number | null>(null);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/me/avatar", { method: "POST", body: form });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? "Upload failed");
        return;
      }
      const json = (await res.json()) as { user: DbUser };
      onUserUpdate(json.user);
    } catch {
      setError("Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveField = async (body: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? t(lang, "addFailed"));
        return null;
      }
      const json = (await res.json()) as { user: DbUser };
      onUserUpdate(json.user);
      return json.user;
    } finally {
      setSaving(false);
    }
  };

  const saveName = async () => {
    const parsed = nameSchema.safeParse(displayName);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }
    const updated = await saveField({ displayName: parsed.data });
    if (updated) {
      setDisplayName(updated.displayName ?? "");
      setIsEditing(false);
    }
  };

  const saveBio = async () => {
    const updated = await saveField({ bio: bio.trim() || null });
    if (updated) {
      setBio(updated.bio ?? "");
      setIsEditingBio(false);
    }
  };

  const saveHandle = async () => {
    const trimmed = handleInput.trim().toLowerCase().replace(/^@/, "");
    if (trimmed && !HANDLE_REGEX.test(trimmed)) {
      setHandleError(t(lang, "profileHandleHint"));
      return;
    }
    setSavingHandle(true);
    setHandleError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: trimmed || null }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        if (res.status === 409) setHandleError(t(lang, "profileHandleTaken"));
        else setHandleError(j.error ?? t(lang, "saveFailed"));
        return;
      }
      const json = (await res.json()) as { user: DbUser };
      onUserUpdate(json.user);
      setHandleInput(json.user.handle ?? "");
      setIsEditingHandle(false);
    } finally {
      setSavingHandle(false);
    }
  };

  const saveSocials = async () => {
    if (savingSocials) return;
    setSavingSocials(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialLine: socials.socialLine.trim() || null,
          socialIg: socials.socialIg.trim() || null,
          socialTwitter: socials.socialTwitter.trim() || null,
          socialFacebook: socials.socialFacebook.trim() || null,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { user: DbUser };
        onUserUpdate(json.user);
        setSocialsSavedAt(Date.now());
      }
    } finally {
      setSavingSocials(false);
    }
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString(
    lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <UserCog className="size-5" />
        {t(lang, "profileTabAccount")}
      </h2>

      {/* ═══════ Section 1: Profile hero (avatar + identity) ═══════ */}
      <div className="rounded-xl border border-border/40 bg-card p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="group relative shrink-0 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            aria-label="Change avatar"
          >
            <Avatar className="size-16 ring-2 ring-border/40 ring-offset-2 ring-offset-card sm:size-20">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-xl font-bold">
                {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
              {uploadingAvatar ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Camera className="size-3" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e)}
            />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{user.displayName ?? user.email}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {t(lang, "memberSince")} {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════ Section 2: Profile info ═══════ */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-card divide-y divide-border/30">
        {/* Display name */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{t(lang, "displayNamePlaceholder")}</p>
            {isEditing ? (
              <div className="mt-1.5 flex items-center gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t(lang, "displayNamePlaceholder")}
                  className="max-w-xs"
                  autoFocus
                />
                <Button size="sm" onClick={() => void saveName()} disabled={saving}>
                  {t(lang, "save")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setIsEditing(false); setDisplayName(user.displayName ?? ""); setError(null); }}
                >
                  {t(lang, "cancel")}
                </Button>
              </div>
            ) : (
              <p className={user.displayName ? "mt-0.5 text-sm" : "mt-0.5 text-sm italic text-muted-foreground/50"}>
                {user.displayName ?? t(lang, "setYourName")}
              </p>
            )}
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="shrink-0">
              <Pencil className="mr-1.5 size-3" />
              {t(lang, "edit")}
            </Button>
          )}
        </div>

        {/* Bio */}
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{t(lang, "bio")}</p>
            {isEditingBio ? (
              <div className="mt-1.5 space-y-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t(lang, "bioPlaceholder")}
                  maxLength={500}
                  rows={3}
                  className="w-full max-w-sm resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{bio.length}/500</span>
                  <Button size="sm" onClick={() => void saveBio()} disabled={saving}>
                    {t(lang, "save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setIsEditingBio(false); setBio(user.bio ?? ""); setError(null); }}
                  >
                    {t(lang, "cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className={user.bio ? "mt-0.5 text-sm" : "mt-0.5 text-sm italic text-muted-foreground/50"}>
                {user.bio || t(lang, "bioPlaceholder")}
              </p>
            )}
          </div>
          {!isEditingBio && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingBio(true)} className="shrink-0">
              <Pencil className="mr-1.5 size-3" />
              {t(lang, "edit")}
            </Button>
          )}
        </div>

        {/* Handle */}
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{t(lang, "profileHandle")}</p>
            {isEditingHandle ? (
              <div className="mt-1.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 max-w-xs items-center gap-1 rounded-md border border-input bg-transparent px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <AtSign className="size-3.5 text-muted-foreground" />
                    <input
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value)}
                      placeholder={t(lang, "profileHandlePlaceholder")}
                      maxLength={24}
                      className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>
                  <Button size="sm" onClick={() => void saveHandle()} disabled={savingHandle}>
                    {savingHandle ? <Loader2 className="size-3 animate-spin" /> : t(lang, "save")}
                  </Button>
                  {user.handle && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setHandleInput("");
                        void saveHandle();
                      }}
                      disabled={savingHandle}
                    >
                      {t(lang, "profileHandleClear")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingHandle(false);
                      setHandleInput(user.handle ?? "");
                      setHandleError(null);
                    }}
                  >
                    {t(lang, "cancel")}
                  </Button>
                </div>
                {handleError ? (
                  <p className="text-xs text-destructive">{handleError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/60">{t(lang, "profileHandleHint")}</p>
                )}
              </div>
            ) : (
              <div className="mt-0.5 flex items-center gap-2">
                {user.handle ? (
                  <>
                    <AtSign className="size-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{user.handle}</span>
                  </>
                ) : (
                  <span className="text-sm italic text-muted-foreground/50">
                    {t(lang, "profileHandleDesc")}
                  </span>
                )}
              </div>
            )}
          </div>
          {!isEditingHandle && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingHandle(true)} className="shrink-0">
              <Pencil className="mr-1.5 size-3" />
              {t(lang, "edit")}
            </Button>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">Email</p>
          <div className="mt-0.5 flex items-center gap-2">
            <Mail className="size-3.5 text-muted-foreground" />
            <span className="text-sm">{user.email}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground/60">{t(lang, "emailReadonly")}</p>
        </div>
      </div>

      {/* ═══════ Section 2.5: Contact links (optional) ═══════ */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border/40 px-5 py-3.5">
          <div>
            <h3 className="text-sm font-semibold">{t(lang, "socialSectionTitle")}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(lang, "socialSectionDesc")}
            </p>
          </div>
          {socialsSavedAt && Date.now() - socialsSavedAt < 2500 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CircleCheck className="size-3" />
              {t(lang, "saved")}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {([
            { key: "socialLine", label: "socialLineLabel", placeholder: "socialPlaceholderLine" },
            { key: "socialIg", label: "socialIgLabel", placeholder: "socialPlaceholderIg" },
            { key: "socialTwitter", label: "socialTwitterLabel", placeholder: "socialPlaceholderTwitter" },
            { key: "socialFacebook", label: "socialFacebookLabel", placeholder: "socialPlaceholderFacebook" },
          ] as const).map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-muted-foreground" htmlFor={`social-${f.key}`}>
                {t(lang, f.label)}
              </label>
              <Input
                id={`social-${f.key}`}
                value={socials[f.key]}
                onChange={(e) => setSocials((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={t(lang, f.placeholder)}
                className="mt-1 h-9"
                maxLength={f.key === "socialFacebook" ? 120 : 60}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-border/40 bg-muted/20 px-5 py-2.5">
          <Button size="sm" onClick={() => void saveSocials()} disabled={savingSocials}>
            {savingSocials && <Loader2 className="mr-1.5 size-3 animate-spin" />}
            {t(lang, "save")}
          </Button>
        </div>
      </div>

      {/* ═══════ Section 3: Privacy (unified) ═══════ */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
        {/* Visibility toggle + header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{t(lang, "privacy")}</h3>
              <PrivacyFeedback field="profileVisibility" />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t(lang, "privacySubtitle")}</p>
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

        {/* Section toggles grouped by intent */}
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
    </div>
  );
}

function PrivacyGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-border/30 first:border-t-0">
      <div className="px-5 pt-3 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
