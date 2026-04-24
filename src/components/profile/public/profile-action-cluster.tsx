"use client";

import Link from "next/link";
import { Eye, Flag, MoreHorizontal, Pencil, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileShareMenu } from "@/components/profile/profile-share-menu";
import { t, type Language } from "@/lib/i18n";

import { MessageSellerButton } from "./message-seller-button";
import { SaveSellerButton } from "./save-seller-button";
import type { ProfileUser } from "./types";

/**
 * Right-aligned action cluster in the profile hero. Two layouts:
 *
 *   Visitor: Message  [Save]  [Share]  [⋯ Report / Block]
 *   Owner:   [Share]  [Edit profile ▾  ▸ View as visitor]
 *
 * Block / Report are stubbed to a toast for now — actual moderation flow is
 * tracked separately. We intentionally surface them so the affordance is
 * obviously available even before backend support lands.
 */
export function ProfileActionCluster({
  user,
  messageHref,
  isOwner,
  viewerSavedSeller,
  viewerIsSignedIn,
  lang,
}: {
  user: ProfileUser;
  messageHref: string | null;
  isOwner: boolean;
  viewerSavedSeller: boolean;
  viewerIsSignedIn: boolean;
  lang: Language;
}) {
  return (
    <>
      {!isOwner && (
        <>
          <MessageSellerButton href={messageHref} lang={lang} />
          <SaveSellerButton
            sellerId={user.id}
            initialSaved={viewerSavedSeller}
            isOwner={isOwner}
            viewerIsSignedIn={viewerIsSignedIn}
            lang={lang}
            variant="label"
          />
        </>
      )}
      <ProfileShareMenu
        userId={user.id}
        handle={user.handle}
        displayName={user.displayName ?? "User"}
      />
      {isOwner ? (
        <OwnerActions lang={lang} />
      ) : (
        <VisitorOverflowMenu lang={lang} />
      )}
    </>
  );
}

function OwnerActions({ lang }: { lang: Language }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      render={<Link href="/settings/account" />}
    >
      <Pencil className="size-4" />
      <span className="hidden sm:inline">{t(lang, "editProfile")}</span>
    </Button>
  );
}

function VisitorOverflowMenu({ lang }: { lang: Language }) {
  const onReport = () => {
    toast.info(t(lang, "profileReportSent"));
  };
  const onBlock = () => {
    toast.info(t(lang, "profileBlockedSoon"));
  };
  const onViewListings = () => {
    // Placeholder secondary action: visitors can already pick a tab so this
    // exists purely to make the overflow menu feel populated. Wire this to
    // marketplace filter once we have a "by seller" view.
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={t(lang, "moreOptions")}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onViewListings}>
          <Eye className="size-3.5" />
          {t(lang, "profileViewListingsMenu")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReport}>
          <Flag className="size-3.5" />
          {t(lang, "profileReport")}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onBlock}>
          <ShieldOff className="size-3.5" />
          {t(lang, "profileBlock")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
