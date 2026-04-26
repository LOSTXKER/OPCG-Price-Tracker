"use client";

import { useState } from "react";
import { AtSign, Loader2, Mail, Pencil } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { DbUser } from "./profile-types";

const nameSchema = z.string().trim().min(1, "Name is required").max(120);
const HANDLE_REGEX = /^[a-z0-9_]{3,24}$/;

type AccountProfileInfoProps = {
  user: DbUser;
  lang: Language;
  onUserUpdate: (user: DbUser) => void;
};

export function AccountProfileInfo({ user, lang, onUserUpdate }: AccountProfileInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleInput, setHandleInput] = useState(user.handle ?? "");
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [savingHandle, setSavingHandle] = useState(false);

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

  return (
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
  );
}
