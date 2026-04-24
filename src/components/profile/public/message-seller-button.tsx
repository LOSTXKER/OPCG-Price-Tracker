"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Reusable "Message seller" CTA. The href is computed in the parent (it
 * normally points at the seller's most recent listing because messages are
 * scoped to a listing in our schema). When `href` is null we render a
 * disabled button with an explanatory tooltip — this is what visitors see
 * when a seller has zero active listings.
 */
export function MessageSellerButton({
  href,
  lang,
  className,
  fullWidth = false,
}: {
  href: string | null;
  lang: Language;
  className?: string;
  /** Mobile sticky bar wants a flex-1 button; desktop hero doesn't. */
  fullWidth?: boolean;
}) {
  const widthClass = fullWidth ? "flex-1" : "";

  if (href) {
    return (
      <Button
        size="sm"
        className={cn("gap-1.5", widthClass, className)}
        render={<Link href={href} />}
      >
        <MessageSquare className="size-4" />
        {t(lang, "profileMessage")}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled
      title={t(lang, "profileMessageNoListing")}
      className={cn("gap-1.5", widthClass, className)}
    >
      <MessageSquare className="size-4" />
      {t(lang, "profileMessage")}
    </Button>
  );
}
