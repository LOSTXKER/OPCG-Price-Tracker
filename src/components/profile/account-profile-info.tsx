"use client";

import { useState } from "react";
import { AtSign, Loader2, Lock, Mail, Pencil, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ApiError, apiPatch } from "@/lib/api/client";
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
      const json = await apiPatch<{ user: DbUser }>("/api/me", body);
      onUserUpdate(json.user);
      return json.user;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t(lang, "addFailed"));
      return null;
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
      const json = await apiPatch<{ user: DbUser }>("/api/me", { handle: trimmed || null });
      onUserUpdate(json.user);
      setHandleInput(json.user.handle ?? "");
      setIsEditingHandle(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setHandleError(t(lang, "profileHandleTaken"));
      } else {
        setHandleError(err instanceof ApiError ? err.message : t(lang, "saveFailed"));
      }
    } finally {
      setSavingHandle(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--p-hair)] bg-card divide-y divide-[var(--p-hair)]">
      {/* Display name */}
      <FieldRow
        label={t(lang, "displayNamePlaceholder")}
        editing={isEditing}
        onEdit={() => setIsEditing(true)}
        onCancel={() => {
          setIsEditing(false);
          setDisplayName(user.displayName ?? "");
          setError(null);
        }}
        editLabel={t(lang, "edit")}
        cancelLabel={t(lang, "cancel")}
      >
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
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
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        ) : (
          <p className={cn("text-sm", !user.displayName && "italic text-muted-foreground/60")}>
            {user.displayName ?? t(lang, "setYourName")}
          </p>
        )}
      </FieldRow>

      {/* Bio */}
      <FieldRow
        label={t(lang, "bio")}
        editing={isEditingBio}
        onEdit={() => setIsEditingBio(true)}
        onCancel={() => {
          setIsEditingBio(false);
          setBio(user.bio ?? "");
          setError(null);
        }}
        editLabel={t(lang, "edit")}
        cancelLabel={t(lang, "cancel")}
        align="start"
      >
        {isEditingBio ? (
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t(lang, "bioPlaceholder")}
              maxLength={500}
              rows={3}
              className="w-full max-w-md resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-meta">{bio.length}/500</span>
              <Button size="sm" onClick={() => void saveBio()} disabled={saving}>
                {t(lang, "save")}
              </Button>
            </div>
          </div>
        ) : (
          <p className={cn("text-sm", !user.bio && "italic text-muted-foreground/60")}>
            {user.bio || t(lang, "bioPlaceholder")}
          </p>
        )}
      </FieldRow>

      {/* Handle */}
      <FieldRow
        label={t(lang, "profileHandle")}
        editing={isEditingHandle}
        onEdit={() => setIsEditingHandle(true)}
        onCancel={() => {
          setIsEditingHandle(false);
          setHandleInput(user.handle ?? "");
          setHandleError(null);
        }}
        editLabel={t(lang, "edit")}
        cancelLabel={t(lang, "cancel")}
        align="start"
      >
        {isEditingHandle ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex max-w-xs flex-1 items-center gap-1 rounded-lg border border-input bg-transparent px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
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
            </div>
            {handleError ? (
              <p className="text-xs text-destructive">{handleError}</p>
            ) : (
              <p className="text-meta text-muted-foreground/60">{t(lang, "profileHandleHint")}</p>
            )}
          </div>
        ) : user.handle ? (
          <div className="flex items-center gap-1.5">
            <AtSign className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{user.handle}</span>
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground/60">
            {t(lang, "profileHandleDesc")}
          </p>
        )}
      </FieldRow>

      {/* Email (read-only) */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow">Email</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Mail className="size-3.5 text-muted-foreground" />
            <span className="truncate text-sm">{user.email}</span>
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 text-meta"
          title={t(lang, "emailReadonly")}
        >
          <Lock className="size-3" />
          {t(lang, "emailReadonly")}
        </span>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  editing,
  onEdit,
  onCancel,
  editLabel,
  cancelLabel,
  align = "center",
  children,
}: {
  label: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  editLabel: string;
  cancelLabel: string;
  align?: "center" | "start";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4 px-5 py-4",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-eyebrow">{label}</p>
        <div className="mt-1.5">{children}</div>
      </div>
      {editing ? (
        <button
          type="button"
          onClick={onCancel}
          aria-label={cancelLabel}
          className="ease-chrome inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="ease-chrome inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      )}
    </div>
  );
}
