"use client";

import { useState } from "react";
import { SquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
 * The glyph is `SquarePlus` — the same square-with-a-plus iOS itself puts next
 * to "Add to Home Screen" in the Share sheet, so anyone who has done this once
 * recognises it. It also names the action in `/more`: one icon per concept
 * across the site. A device icon with a `+` badge was tried first and dropped —
 * at 18px the badge hangs off the pill's rounded edge and the button stops
 * matching its neighbours (owner, 2026-08-30).
 */
export function InstallHeaderButton({ className }: { className?: string }) {
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
        className={cn(
          "surface-2 hairline min-h-11 min-w-11 rounded-full text-foreground",
          className,
        )}
        onClick={() => {
          if (method === "ios") setGuideOpen(true);
          else void promptInstall();
        }}
      >
        <SquarePlus className="size-[18px]" />
      </Button>
      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        language={language}
      />
    </>
  );
}
