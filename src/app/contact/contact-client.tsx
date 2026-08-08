"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Bug, MessageCircle } from "lucide-react";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { FaqSection } from "@/components/shared/faq-section";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import {
  CONTACT_FACEBOOK_URL,
  buildContactFaq,
  buildContactHeading,
} from "@/lib/seo/copy/site";

export default function ContactClient() {
  const lang = useUIStore((s) => s.language);
  const heading = buildContactHeading(lang);
  const faqItems = buildContactFaq(lang);

  return (
    <div className="space-y-10">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "contactUs") },
            ]}
          />
        }
        title={heading.title}
        description={t(lang, "contactTagline")}
      />

      <section className="space-y-5">
        <h2 className="text-h3">{t(lang, "contactChannelsTitle")}</h2>
        {/* Facebook is the only channel the team actually monitors — there is
            no support mailbox, so no other card is offered here. */}
        <div className="grid gap-3">
          <Surface
            variant="outline"
            padding="none"
            className="flex h-full flex-col gap-3 p-5"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageCircle className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-h5">Facebook</h3>
              <p className="mt-1 text-meta">{t(lang, "contactFacebookDesc")}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              render={
                <a
                  href={CONTACT_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              {t(lang, "contactFacebookButton")}
              <ArrowRight className="size-4" />
            </Button>
          </Surface>
        </div>
      </section>

      <section>
        <Surface variant="outline" padding="none" className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Bug className="size-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-h4">{t(lang, "contactReportTitle")}</h2>
              <p className="mt-2 max-w-2xl text-body-sm text-muted-foreground">
                {t(lang, "contactReportDesc")}
              </p>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <a
                      href={CONTACT_FACEBOOK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  {t(lang, "contactReportButton")}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </Surface>
      </section>

      <section>
        <Surface
          variant="hero"
          padding="none"
          className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-h3">{t(lang, "contactHelpTitle")}</h2>
              <p className="mt-2 max-w-xl text-body-sm text-muted-foreground">
                {t(lang, "contactHelpDesc")}
              </p>
            </div>
          </div>
          <Button render={<Link href="/guide" />}>
            {t(lang, "contactHelpButton")}
            <ArrowRight className="size-4" />
          </Button>
        </Surface>
      </section>

      <FaqSection items={faqItems} />
    </div>
  );
}
