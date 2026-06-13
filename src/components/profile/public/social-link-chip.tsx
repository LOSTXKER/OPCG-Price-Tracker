"use client";

import { toast } from "sonner";

import { t, type Language } from "@/lib/i18n";
import type { SocialLinkDescriptor } from "./hero-builders";

const CHIP_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-transparent px-2.5 py-1 text-micro text-muted-foreground transition hover:border-border hover:bg-muted/40 hover:text-foreground";

/**
 * Renders a single social/contact chip in the profile hero. Has two modes:
 *  - With href → external `<a target="_blank">` (IG, X, Facebook)
 *  - Without href → `<button>` that copies a value to the clipboard (LINE ID)
 *
 * Centralising both shapes here removes the awkward branching in
 * `PublicProfileClient` and makes it trivial to add a new platform later.
 */
export function SocialLinkChip({
  link,
  lang,
}: {
  link: SocialLinkDescriptor;
  lang: Language;
}) {
  // Render the platform badge (LINE / IG / X / FB) as a quiet uppercase
  // eyebrow rather than an extrabold shout. When the visible label happens
  // to repeat the platform name (e.g. label === "Line"), the badge prefix
  // is hidden to avoid the "LINE Line" duplicate read.
  const labelDuplicatesBadge =
    link.label.replace(/^@/, "").toLowerCase() === link.badge.toLowerCase();

  const inner = (
    <>
      {!labelDuplicatesBadge && (
        <span className="text-micro uppercase tracking-wider text-muted-foreground/80">
          {link.badge}
        </span>
      )}
      <span className="max-w-[140px] truncate text-foreground/80">
        {link.label}
      </span>
    </>
  );

  if (link.href) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={CHIP_CLASS}
      >
        {inner}
      </a>
    );
  }

  const handleCopy = async () => {
    if (!link.copyText) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link.copyText);
        toast.success(t(lang, "shareLinkCopied"));
        return;
      }
    } catch {
      // fall through to legacy copy
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = link.copyText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success(t(lang, "shareLinkCopied"));
    } catch {
      toast.error(t(lang, "shareCopyLink"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={link.copyText}
      className={CHIP_CLASS}
    >
      {inner}
    </button>
  );
}
