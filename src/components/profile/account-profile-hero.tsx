"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApiError, apiForm } from "@/lib/api/client";
import { t, getLocale } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { DbUser } from "./profile-types";

type AccountProfileHeroProps = {
  user: DbUser;
  lang: Language;
  onUserUpdate: (user: DbUser) => void;
};

export function AccountProfileHero({ user, lang, onUserUpdate }: AccountProfileHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberSince = new Date(user.createdAt).toLocaleDateString(
    getLocale(lang),
    { year: "numeric", month: "short", day: "numeric" },
  );

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const json = await apiForm<{ user: DbUser }>("/api/me/avatar", form);
      onUserUpdate(json.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4 py-2">
      <button
        type="button"
        className="group relative shrink-0 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadingAvatar}
        aria-label="Change avatar"
      >
        <Avatar className="size-16 ring-2 ring-border/40 ring-offset-2 ring-offset-background sm:size-[72px]">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-xl font-bold">
            {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
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
        <p className="truncate text-h4">{user.displayName ?? user.email}</p>
        <p className="mt-0.5 truncate text-meta">{user.email}</p>
        <p className="mt-0.5 text-meta text-muted-foreground/60">
          {t(lang, "memberSince")} {memberSince}
        </p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
