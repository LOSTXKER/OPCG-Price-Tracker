"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiDelete, apiPost } from "@/lib/api/client";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Owns its own optimistic + persistence state for the "Save seller" toggle.
 * Reused in two layouts: the desktop hero (icon+label) and the mobile
 * sticky CTA bar (icon-only). Failures surface as a toast — the previous
 * `alert()` call was both ugly and easy to miss.
 */
export function SaveSellerButton({
  sellerId,
  initialSaved,
  isOwner,
  viewerIsSignedIn,
  lang,
  variant = "label",
  className,
}: {
  sellerId: string;
  initialSaved: boolean;
  isOwner: boolean;
  viewerIsSignedIn: boolean;
  lang: Language;
  /** "label" shows text on ≥sm screens; "icon" only ever shows the icon. */
  variant?: "label" | "icon";
  className?: string;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  if (isOwner) return null;

  async function toggle() {
    if (pending) return;
    if (!viewerIsSignedIn) {
      router.push(`/login?redirect=/profile/${sellerId}`);
      return;
    }
    setPending(true);
    const next = !isSaved;
    setIsSaved(next);
    try {
      const url = `/api/saved-sellers/${sellerId}`;
      if (next) {
        await apiPost(url);
      } else {
        await apiDelete(url);
      }
    } catch {
      setIsSaved(!next);
      toast.error(t(lang, "profileSaveFailed"));
    } finally {
      setPending(false);
    }
  }

  const label = isSaved ? t(lang, "profileSaved") : t(lang, "profileSave");

  return (
    <Button
      size="sm"
      variant={isSaved ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
      className={cn("gap-1.5", className)}
      aria-label={label}
    >
      <Bookmark className={cn("size-4", isSaved && "fill-current")} />
      {variant === "label" && (
        <span className="hidden sm:inline">{label}</span>
      )}
    </Button>
  );
}
