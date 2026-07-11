"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getHtmlLang, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

/**
 * Rehydrates the persisted UI store once, after mount. The store is created with
 * `skipHydration: true` so the first client render matches the server-prerendered
 * HTML (default TH/THB) and avoids a hydration mismatch; this then pulls the user's
 * saved language / currency / view from localStorage and swaps them in.
 */
export function StoreHydrator() {
  const router = useRouter();

  useEffect(() => {
    const syncDocumentLanguage = (language: Language) => {
      document.documentElement.lang = getHtmlLang(language);
    };

    syncDocumentLanguage(useUIStore.getState().language);
    const unsubscribe = useUIStore.subscribe((state, previousState) => {
      if (state.language !== previousState.language) {
        syncDocumentLanguage(state.language);
        // Language-aware Server Components (FAQ/JSON-LD/content pages) read
        // the mirrored cookie, so merge a fresh RSC payload after every switch.
        queueMicrotask(() => router.refresh());
      }
    });
    void useUIStore.persist.rehydrate();

    return unsubscribe;
  }, [router]);

  return null;
}
