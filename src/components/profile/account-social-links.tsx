"use client";

import { useCallback, useMemo, useState } from "react";
import { CircleCheck, Loader2, Pencil, X } from "lucide-react";
import { apiPatch, apiTry } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { DbUser } from "./profile-types";

const SOCIAL_FIELDS = [
  { key: "socialLine", label: "socialLineLabel", placeholder: "socialPlaceholderLine", icon: "LINE" },
  { key: "socialIg", label: "socialIgLabel", placeholder: "socialPlaceholderIg", icon: "IG" },
  { key: "socialTwitter", label: "socialTwitterLabel", placeholder: "socialPlaceholderTwitter", icon: "X" },
  { key: "socialFacebook", label: "socialFacebookLabel", placeholder: "socialPlaceholderFacebook", icon: "FB" },
] as const;

type SocialKey = (typeof SOCIAL_FIELDS)[number]["key"];

type AccountSocialLinksProps = {
  user: DbUser;
  lang: Language;
  onUserUpdate: (user: DbUser) => void;
};

function buildState(user: DbUser): Record<SocialKey, string> {
  return {
    socialLine: user.socialLine ?? "",
    socialIg: user.socialIg ?? "",
    socialTwitter: user.socialTwitter ?? "",
    socialFacebook: user.socialFacebook ?? "",
  };
}

export function AccountSocialLinks({ user, lang, onUserUpdate }: AccountSocialLinksProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [socials, setSocials] = useState(() => buildState(user));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const initial = useMemo(() => buildState(user), [user]);

  const dirty = useMemo(
    () => SOCIAL_FIELDS.some((f) => socials[f.key].trim() !== initial[f.key].trim()),
    [socials, initial],
  );

  const hasAnyValue = SOCIAL_FIELDS.some((f) => (user[f.key] as string | null)?.trim());

  const cancel = useCallback(() => {
    setIsEditing(false);
    setSocials(buildState(user));
  }, [user]);

  const save = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const json = await apiTry(
        apiPatch<{ user: DbUser }>("/api/me", {
          socialLine: socials.socialLine.trim() || null,
          socialIg: socials.socialIg.trim() || null,
          socialTwitter: socials.socialTwitter.trim() || null,
          socialFacebook: socials.socialFacebook.trim() || null,
        }),
      );
      if (json) {
        onUserUpdate(json.user);
        setIsEditing(false);
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  }, [saving, socials, onUserUpdate]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-h5">{t(lang, "socialSectionTitle")}</h3>
          <p className="mt-0.5 text-meta">{t(lang, "socialSectionDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && Date.now() - savedAt < 2500 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in-95">
              <CircleCheck className="size-3" />
              {t(lang, "saved")}
            </span>
          )}
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label={t(lang, "edit")}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={cancel}
              aria-label={t(lang, "cancel")}
              disabled={saving}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <>
          <div className="grid grid-cols-1 gap-3 border-t border-border/30 p-5 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-eyebrow" htmlFor={`social-${f.key}`}>
                  {t(lang, f.label)}
                </label>
                <Input
                  id={`social-${f.key}`}
                  value={socials[f.key]}
                  onChange={(e) => setSocials((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={t(lang, f.placeholder)}
                  className="mt-1.5 h-9"
                  maxLength={f.key === "socialFacebook" ? 120 : 60}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border/30 px-5 py-2.5">
            <Button size="sm" onClick={() => void save()} disabled={saving || !dirty}>
              {saving && <Loader2 className="mr-1.5 size-3 animate-spin" />}
              {t(lang, "save")}
            </Button>
          </div>
        </>
      ) : (
        hasAnyValue && (
          <div className="divide-y divide-border/30 border-t border-border/30">
            {SOCIAL_FIELDS.filter((f) => (user[f.key] as string | null)?.trim()).map((f) => (
              <div key={f.key} className="flex items-center gap-3 px-5 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary/60 text-overlay text-muted-foreground">
                  {f.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-eyebrow">{t(lang, f.label)}</p>
                  <p className="mt-0.5 truncate text-sm">{(user[f.key] as string)?.trim()}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
