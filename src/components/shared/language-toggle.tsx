"use client";

import { useUIStore } from "@/stores/ui-store";

const LANG_LABEL = { TH: "ไทย", EN: "EN", JP: "JP" } as const;

export function LanguageToggle() {
  const language = useUIStore((s) => s.language);
  const cycle = useUIStore((s) => s.cycleLanguage);

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      title={`Language: ${language}`}
    >
      {LANG_LABEL[language]}
    </button>
  );
}
