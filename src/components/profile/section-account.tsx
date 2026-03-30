"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, Pencil, UserCog, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type { DbUser } from "./profile-types";

const nameSchema = z.string().trim().min(1, "Name is required").max(120);

type Props = {
  user: DbUser;
  onUserUpdate: (user: DbUser) => void;
};

export function SectionAccount({ user, onUserUpdate }: Props) {
  const router = useRouter();
  const lang = useUIStore((s) => s.language);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveName = async () => {
    const parsed = nameSchema.safeParse(displayName);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: parsed.data }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? t(lang, "addFailed"));
        return;
      }
      const json = (await res.json()) as { user: DbUser };
      onUserUpdate(json.user);
      setDisplayName(json.user.displayName ?? "");
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <UserCog className="size-5" />
          {t(lang, "profileTabAccount")}
        </h2>
      </div>

      {/* Display name */}
      <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">{t(lang, "displayNamePlaceholder")}</label>
          {isEditing ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t(lang, "displayNamePlaceholder")}
                className="max-w-sm"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={() => void saveName()} disabled={saving}>
                <Check className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(user.displayName ?? "");
                  setError(null);
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">{user.displayName ?? "—"}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
          )}
          {error && <p className="text-destructive mt-1 text-sm">{error}</p>}
        </div>

        <div className="text-muted-foreground text-xs">
          {t(lang, "memberSince")}{" "}
          {new Date(user.createdAt).toLocaleDateString(
            lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US",
            { year: "numeric", month: "long", day: "numeric" },
          )}
        </div>
      </div>

      {/* Logout */}
      <div className="rounded-xl border border-destructive/20 bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-destructive">{t(lang, "dangerZone")}</h3>
        <p className="text-muted-foreground text-xs">{t(lang, "deleteAccountDesc")}</p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => void logout()}
        >
          <LogOut className="mr-1.5 size-4" />
          {t(lang, "logout")}
        </Button>
      </div>
    </div>
  );
}
