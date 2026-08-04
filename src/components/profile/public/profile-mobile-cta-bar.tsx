"use client";

import { type Language } from "@/lib/i18n";

import { MessageSellerButton } from "./message-seller-button";
import { SaveSellerButton } from "./save-seller-button";

/**
 * Mobile sticky CTA bar (visitor only). Stays visible while scrolling so
 * buyers can always reach the seller without scrolling back up. Hidden on
 * `md:` and above where the hero already has a Message button.
 *
 * Sits ABOVE the global BottomNav (z-50, 4rem tall) — this route is not
 * chromeless so the nav renders; without the offset the nav would cover the
 * CTA entirely. Same lift pattern as the card-detail sticky buy bar.
 */
export function ProfileMobileCtaBar({
  sellerId,
  messageHref,
  viewerSavedSeller,
  viewerIsSignedIn,
  lang,
}: {
  sellerId: string;
  messageHref: string | null;
  viewerSavedSeller: boolean;
  viewerIsSignedIn: boolean;
  lang: Language;
}) {
  return (
    <div
      className="fixed inset-x-0 z-floating border-t border-border bg-background px-3 py-2 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.18)] md:hidden"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-2">
        <MessageSellerButton href={messageHref} lang={lang} fullWidth />
        <SaveSellerButton
          sellerId={sellerId}
          initialSaved={viewerSavedSeller}
          isOwner={false}
          viewerIsSignedIn={viewerIsSignedIn}
          lang={lang}
          variant="icon"
        />
      </div>
    </div>
  );
}
