"use client";

import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { ADSENSE_CLIENT } from "./placements";

/**
 * Ad/cookie consent banner (GDPR). BLOCKING prerequisite for any ad network —
 * AdSlot only serves network ads once consent === "granted". Dormant until
 * ADSENSE_CLIENT is configured, so users aren't nagged before ads go live.
 * See REDESIGN.md §5.6.
 */
export function ConsentBanner() {
  const consent = useUIStore((s) => s.adConsent);
  const setConsent = useUIStore((s) => s.setAdConsent);
  const lang = useUIStore((s) => s.language);

  // Persisted consent is only known after hydration — avoid SSR mismatch.
  const hydrated = useHydrated();

  if (!hydrated || !ADSENSE_CLIENT || consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-hair bg-background pb-[env(safe-area-inset-bottom)] md:bottom-0">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between">
        <p className="text-body-sm text-muted-foreground">{t(lang, "consentMessage")}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="rounded-lg border border-hair px-4 py-2 text-sm font-medium motion-base hover:bg-muted/70"
          >
            {t(lang, "consentDecline")}
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground motion-base hover:opacity-90"
          >
            {t(lang, "consentAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}
