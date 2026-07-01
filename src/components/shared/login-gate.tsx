"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export function LoginCTAButtons() {
  const lang = useUIStore((s) => s.language);
  const pathname = usePathname();
  const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="flex items-center justify-center gap-3">
      <Link href={redirectUrl}>
        <Button>{t(lang, "login")}</Button>
      </Link>
      <Link href="/register">
        <Button variant="outline">{t(lang, "register")}</Button>
      </Link>
    </div>
  );
}

/**
 * Logged-out state for a gated feature. Instead of blurring the mock behind a
 * wall (which tells a first-time visitor nothing), it shows a CLEAR, readable
 * sample of the feature so people understand what they'd get — with an explicit
 * "this is a sample, sign in for your data" invite on top. The preview is
 * crisp but inert (pointer-events-none); a soft bottom fade hints there's more
 * once you're in.
 */
export function AuthPreviewGate({ preview }: { preview: React.ReactNode }) {
  const lang = useUIStore((s) => s.language);
  const pathname = usePathname();
  const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="space-y-4">
      <Surface
        variant="outline"
        className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h4">{t(lang, "loginRequired")}</h2>
            <p className="text-body-sm text-muted-foreground">{t(lang, "loginRequiredDesc")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={redirectUrl} className="flex-1 sm:flex-initial">
            <Button className="w-full rounded-full">{t(lang, "login")}</Button>
          </Link>
          <Link href="/register" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full rounded-full">
              {t(lang, "register")}
            </Button>
          </Link>
        </div>
      </Surface>

      {/* Sample label so the preview is never mistaken for real data. */}
      <p className="text-eyebrow text-muted-foreground/70">{t(lang, "previewSample")}</p>

      <div className="relative">
        <div className="pointer-events-none select-none" aria-hidden>
          {preview}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
