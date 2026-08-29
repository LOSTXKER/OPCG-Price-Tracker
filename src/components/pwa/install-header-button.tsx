"use client";

import { useState } from "react";
import { Plus, Smartphone } from "lucide-react";

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
 * The same `Smartphone` glyph names this action in `/more` — one icon per
 * concept across the site. The `+` badge is what separates "install this" from
 * a generic device icon at 18px.
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
          "surface-2 hairline relative min-h-11 min-w-11 rounded-full text-foreground",
          className,
        )}
        onClick={() => {
          if (method === "ios") setGuideOpen(true);
          else void promptInstall();
        }}
      >
        <Smartphone className="size-[18px]" />
        <Plus
          aria-hidden
          className="absolute top-1.5 right-1.5 size-3 rounded-full bg-primary text-primary-foreground"
        />
      </Button>
      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        language={language}
      />
    </>
  );
}
