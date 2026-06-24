"use client";

import Link from "next/link";
import { ImagePlus, MessageSquare, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";

import type { ProfileUser } from "./types";

/**
 * Friendly empty-state shown for sellers with literally nothing yet
 * (no listings, collection, achievements, or reviews). We use it both for
 * visitors (encourage a low-friction "say hi") and for the owner (clear
 * "what to do next" call-out).
 */
export function EmptyProfilePanel({
  user,
  messageHref,
  isOwner,
  lang,
}: {
  user: ProfileUser;
  messageHref: string | null;
  isOwner: boolean;
  lang: Language;
}) {
  const name = user.handle ? `@${user.handle}` : user.displayName ?? "User";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-[var(--p-hair)] bg-gradient-to-br from-primary/[0.04] via-background to-background px-6 py-12 text-center">
      {/* Soft sparkle backdrop — purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(40% 60% at 30% 30%, rgba(99,102,241,0.12), transparent 70%), radial-gradient(50% 70% at 70% 70%, rgba(245,158,11,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/40">
        <Sparkles className="size-7 text-primary/70" />
      </div>
      <h3 className="relative mt-4 text-base font-bold tracking-tight">
        {t(lang, "emptyProfileTitle")}
      </h3>
      <p className="relative mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {t(lang, "emptyProfileSubtitle").replace("{name}", name)}
      </p>

      <div className="relative mt-5 flex flex-wrap items-center justify-center gap-2">
        {!isOwner && messageHref && (
          <Button size="sm" className="gap-1.5" render={<Link href={messageHref} />}>
            <MessageSquare className="size-4" />
            {t(lang, "emptyProfileCta")}
          </Button>
        )}
        {isOwner && (
          <>
            <Button size="sm" className="gap-1.5" render={<Link href="/marketplace/create" />}>
              <ImagePlus className="size-4" />
              {t(lang, "emptyProfileOwnerCta")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/portfolio" />}
            >
              {t(lang, "addYourFirstCard")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
