"use client";

import Image from "next/image";
import { Share } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";

/**
 * iOS Safari exposes no install API whatsoever — the visitor has to walk the
 * Share sheet themselves. So the only useful thing a button can do there is
 * show them where to tap, which is what this dialog is.
 *
 * It is deliberately a separate component from whatever opens it: the header,
 * `/more`, and any future banner all need the same three steps, and three
 * hand-written copies of them would drift.
 */
export function InstallGuideDialog({
  open,
  onOpenChange,
  language,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
}) {
  const steps = [
    {
      key: "share",
      text: t(language, "installAppIosStep1"),
      // The Share glyph is the one thing a screenshot would show better than
      // words — inline so the sentence reads as the button they must find.
      icon: <Share className="size-4 shrink-0 text-primary" />,
    },
    { key: "find", text: t(language, "installAppIosStep2") },
    { key: "add", text: t(language, "installAppIosStep3") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span
            className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[22%]"
            style={{ background: "#73533E" }}
          >
            <Image
              src="/meecard.png"
              alt=""
              width={754}
              height={694}
              className="h-auto w-[82%] select-none"
            />
          </span>
          <div className="min-w-0">
            <DialogTitle>{t(language, "installAppTitle")}</DialogTitle>
            <DialogDescription>
              {t(language, "installAppSubtitle")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <ol className="space-y-2.5 rounded-xl bg-muted/50 p-3.5">
          {steps.map((step, index) => (
            <li key={step.key} className="flex items-center gap-2.5 text-body-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              {/* The glyph sits right after the words, not pushed to the far
                  edge — out there it reads as a button of its own. */}
              <span className="min-w-0">{step.text}</span>
              {step.icon}
            </li>
          ))}
        </ol>

        <p className="text-meta">{t(language, "installAppIosNote")}</p>

        <Button className="w-full" onClick={() => onOpenChange(false)}>
          {t(language, "installAppClose")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
