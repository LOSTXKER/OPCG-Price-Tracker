"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

import { InstallGlyph } from "./install-glyph";
import { InstallGuideDialog } from "./install-guide-dialog";

/**
 * "เพิ่มไปหน้าจอโฮม" in the phone header's top row (owner request 2026-08-30).
 *
 * It occupies a 44px slot that the row does not really have to spare, so it
 * earns that slot by being *conditional*: it exists only for a visitor whose
 * browser can install, who hasn't installed yet, and who hasn't turned the
 * invitation down in the last 30 days. For everyone else the row is exactly the
 * width it was before.
 *
 * It wears the same 44px circle as watchlist and alerts but in the brand tint,
 * not their quiet surface — deliberately. Those two are permanent tools; this
 * is a temporary invitation that disappears for good once accepted, and a
 * one-time offer that looks identical to the furniture beside it gets read as
 * furniture. Owner, 2026-08-30: "ไม่ค่อยชวนน่ากด".
 *
 * The glyph says both halves of the sentence at once — a phone (this device)
 * with a download arrow inside its screen (put it here). Two earlier tries
 * said only one half and lost: `SquarePlus`, the exact glyph iOS uses, reads as
 * "add something, somewhere" to anyone who hasn't installed a web app before;
 * a bare download arrow reads as "fetch a file". Every candidate sits side by
 * side in `/proto/pwa-install` under "ไอคอนไหนสื่อและชวนกด".
 */
export function InstallHeaderButton() {
  const language = useUIStore((s) => s.language);
  const { canInvite, method, promptInstall } = useInstallPrompt();
  const [guideOpen, setGuideOpen] = useState(false);

  // `canInvite`, not `canInstall`: the header is a PROACTIVE offer, so a
  // dismissal has to silence it. `/more` keeps the way back.
  if (!canInvite) return null;

  return (
    <>
      <Button
        data-mobile-install-trigger
        variant="ghost"
        size="icon-sm"
        aria-label={t(language, "installAppTitle")}
        // Same geometry as `TOOL_BUTTON` in header-mobile.tsx — the row must
        // stay one rhythm — but the brand tint instead of the quiet surface.
        className="min-h-11 min-w-11 rounded-full bg-primary/15 text-primary"
        onClick={() => {
          if (method === "ios") setGuideOpen(true);
          else void promptInstall();
        }}
      >
        <InstallGlyph className="size-[18px]" />
      </Button>
      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        language={language}
      />
    </>
  );
}
