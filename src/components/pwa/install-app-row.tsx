"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";

import { GroupedRow } from "@/components/ui/grouped-list";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

import { InstallGuideDialog } from "./install-guide-dialog";

/**
 * "เพิ่มไปหน้าจอโฮม" as a row in `/more` — the ASKED-FOR entry point, and the
 * one that exists no matter which proactive invitation the site ends up
 * carrying. Someone who dismissed a banner, or who never saw one because their
 * browser stayed quiet, can still find the way in here.
 *
 * It renders nothing at all when installing is impossible (already installed,
 * desktop Firefox, Chrome on iOS, an in-app webview) — a row that opens a
 * dialog saying "your browser can't do this" is worse than no row.
 */
export function InstallAppRow() {
  const language = useUIStore((s) => s.language);
  const { canInstall, method, promptInstall } = useInstallPrompt();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!canInstall) return null;

  return (
    <>
      <GroupedRow
        icon={Smartphone}
        iconClassName="bg-primary/12 text-primary"
        title={t(language, "installAppTitle")}
        subtitle={t(language, "installAppSubtitle")}
        onClick={() => {
          if (method === "ios") setGuideOpen(true);
          else void promptInstall();
        }}
      />
      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        language={language}
      />
    </>
  );
}
