"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
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
 * Renders a blurred mock preview of a page with a centered login CTA overlay.
 * Pass the static mock UI as `preview`; it will be blurred and non-interactive.
 */
export function AuthPreviewGate({ preview }: { preview: React.ReactNode }) {
  const lang = useUIStore((s) => s.language);
  const pathname = usePathname();
  const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="pointer-events-none select-none blur-[6px] opacity-60"
        aria-hidden
      >
        {preview}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
        <div className="mx-auto max-w-xs space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <LogIn className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold">{t(lang, "loginRequired")}</h2>
          <p className="text-sm text-muted-foreground">
            {t(lang, "loginRequiredDesc")}
          </p>
          <div className="flex flex-col gap-2">
            <Link href={redirectUrl}>
              <Button className="w-full">{t(lang, "login")}</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                {t(lang, "register")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
