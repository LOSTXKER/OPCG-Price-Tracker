"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { clientEnv } from "@/lib/env";

/**
 * One-tap profile share. We deliberately keep this as a single button rather
 * than a dropdown menu of platform-specific options:
 *
 *   - On mobile / supported browsers we hand off to `navigator.share()` so
 *     the OS's native share sheet handles routing (LINE, IG, Messenger,
 *     Discord, Mail, …). That's strictly better than maintaining bespoke
 *     intent URLs per platform — we get every app the user has installed
 *     for free, without any code maintenance.
 *
 *   - When `navigator.share` isn't available (most desktop browsers), we
 *     copy the URL to the clipboard and flash a check-mark for feedback.
 *     The user can then paste it anywhere — including Discord, where the
 *     URL auto-unfurls into our OG card.
 */
export function ProfileShareMenu({
  userId,
  handle,
  displayName,
}: {
  userId: string;
  handle: string | null;
  displayName: string;
}) {
  const lang = useUIStore((s) => s.language);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}${handle ? `/@${handle}` : `/profile/${userId}`}`
      : handle
        ? `${clientEnv().NEXT_PUBLIC_APP_URL}/@${handle}`
        : `${clientEnv().NEXT_PUBLIC_APP_URL}/profile/${userId}`;

  const shareText = `${displayName} on Meecard`;

  const fallbackCopy = (value: string) => {
    // Last-ditch copy for browsers without `navigator.clipboard` (typically
    // older browsers or HTTP origins). execCommand is deprecated but is the
    // only path that doesn't require a secure context.
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    // Try the native share sheet first — gives us every installed app for
    // free on mobile, and on supported desktop browsers (Edge / Safari).
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareText, text: shareText, url });
        return;
      } catch (err) {
        // User cancelled the share sheet → don't fall back to copy, that
        // would be unexpected. Only fall back on a real failure.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Fallback: copy the URL. Pasting into Discord/Messenger/etc. still
    // unfurls our OG card, so this covers the long tail. We surface a toast
    // so the action is obviously visible — the inline ✓ swap was too quiet
    // and users were assuming the button did nothing.
    let copied = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        copied = fallbackCopy(url);
      }
    } else {
      copied = fallbackCopy(url);
    }

    if (copied) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t(lang, "shareLinkCopied"), { description: url });
    } else {
      toast.error(t(lang, "shareCopyLink"));
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleShare}
      className="relative rounded-full"
      aria-label={t(lang, "shareCopyLink")}
      title={copied ? t(lang, "shareLinkCopied") : t(lang, "shareCopyLink")}
    >
      {copied ? (
        <Check className="size-4 text-success" />
      ) : (
        <Share2 className="size-4" />
      )}
    </Button>
  );
}
