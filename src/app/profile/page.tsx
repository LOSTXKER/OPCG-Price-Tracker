"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { PriceDisplay } from "@/components/shared/price-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

const nameSchema = z.string().trim().min(1, "Name is required").max(120);

type DbUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  tier: string;
};

type ListingBrief = {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  card: { cardCode: string; nameJp: string; nameEn?: string | null };
};

export default function ProfilePage() {
  const router = useRouter();
  const lang = useUIStore((s) => s.language);
  const [user, setUser] = useState<DbUser | null>(null);
  const [listings, setListings] = useState<ListingBrief[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/me");
    if (!res.ok) {
      setLoading(false);
      setError(t(lang, "loadFailed"));
      return;
    }
    const data = (await res.json()) as { user: DbUser; listings: ListingBrief[] };
    setUser(data.user);
    setDisplayName(data.user.displayName ?? "");
    setListings(data.listings ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      const data = (await res.json()) as { user: DbUser };
      setUser(data.user);
      setDisplayName(data.user.displayName ?? "");
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

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">{error ?? "User not found"}</p>
        <Link
          href="/login"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
        >
          {t(lang, "login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-20">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-lg">
            {(user.displayName ?? user.email).slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="font-sans text-3xl font-bold tracking-tight">
            {user.displayName ?? "User"}
          </h1>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          <Badge variant="outline" className="mt-2">
            {user.tier}
          </Badge>
        </div>
        <Button type="button" variant="destructive" onClick={() => void logout()}>
          {t(lang, "logout")}
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="font-sans text-lg font-semibold">{t(lang, "profileSettings")}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="display-name" className="text-sm font-medium">
              {t(lang, "profileLabel")}
            </label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t(lang, "displayNamePlaceholder")}
            />
          </div>
          <Button type="button" onClick={() => void saveName()} disabled={saving}>
            {saving ? t(lang, "saving") : t(lang, "save")}
          </Button>
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </section>

      <section className="space-y-4">
        <h2 className="font-sans text-lg font-semibold">{t(lang, "myListings")}</h2>
        {listings.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t(lang, "noListings")}</p>
        ) : (
          <ul className="space-y-2">
            {listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/marketplace/${l.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">{l.card.nameEn ?? l.card.nameJp}</span>
                  <PriceDisplay
                    priceJpy={l.priceJpy}
                    priceThb={l.priceThb ?? undefined}
                    showChange={false}
                    size="sm"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
