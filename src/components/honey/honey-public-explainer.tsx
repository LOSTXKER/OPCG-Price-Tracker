"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

import { Surface } from "@/components/ui/surface";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { buildHoneyExplainer } from "@/lib/seo/copy/site";

/**
 * Logged-out explainer for /honey.
 *
 * Without this the page ships an `<h1>` plus four skeletons to anyone who is
 * not signed in — including every crawler, since auth resolves client-side.
 * The copy renders during SSR (auth state starts as `null`, i.e. "unknown"),
 * so the explainer is part of the first HTML response for every user agent,
 * and it disappears once a real session resolves so the authed dashboard is
 * untouched.
 */
export function HoneyPublicExplainer() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);
  const copy = buildHoneyExplainer(lang);

  if (authed === true) return null;

  return (
    <section className="mt-10 space-y-5">
      <h2 className="text-h3">{copy.title}</h2>

      <div className="max-w-3xl space-y-2">
        {copy.intro.map((paragraph) => (
          <p key={paragraph} className="text-body-sm text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {copy.sections.map((section) => (
          <Surface
            key={section.heading}
            variant="outline"
            padding="none"
            className="h-full p-5"
          >
            <h3 className="text-h5">{section.heading}</h3>
            <p className="mt-1.5 text-body-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </Surface>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/raffle/winners"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Trophy className="size-4" />
          {copy.winnersLinkLabel}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {copy.pricingLinkLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
