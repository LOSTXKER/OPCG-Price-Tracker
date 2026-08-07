import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, LineChart, ShieldCheck, Store } from "lucide-react";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { clientEnv } from "@/lib/env";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_AUTHENTICITY_META,
  GUIDE_AUTHENTICITY_PUBLISHED_AT,
  GUIDE_AUTHENTICITY_UPDATED_AT,
  guideAuthBestMethodBody,
  guideAuthBestMethodHeading,
  guideAuthChecks,
  guideAuthChecksHeading,
  guideAuthFaq,
  guideAuthGradingBody,
  guideAuthGradingHeading,
  guideAuthH1,
  guideAuthIntro,
  guideAuthLead,
  guideAuthLightTestBody,
  guideAuthLightTestHeading,
  guideAuthRedFlags,
  guideAuthRedFlagsHeading,
  guideAuthRipBody,
  guideAuthRipHeading,
  guideAuthTerms,
  guideAuthTermsHeading,
  guideAuthUpdatedLabel,
} from "@/lib/seo/copy/guide-authenticity";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: GUIDE_AUTHENTICITY_META.title,
  description: GUIDE_AUTHENTICITY_META.description,
  canonical: "/guide/authenticity",
  ogType: "article",
});

export default async function AuthenticityGuidePage() {
  const lang = await getServerLanguage();
  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "guide"), href: "/guide" },
          { name: guideAuthH1(lang), href: "/guide/authenticity" },
        ])}
      />

      {/* Article schema — this page cites a rule that can go stale (grading
          advice, counterfeit alerts), so dateModified matters for freshness
          signals even though the copy isn't a dated news article. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guideAuthH1(lang),
          description: GUIDE_AUTHENTICITY_META.description,
          url: `${baseUrl}/guide/authenticity`,
          inLanguage: "th-TH",
          datePublished: GUIDE_AUTHENTICITY_PUBLISHED_AT,
          dateModified: GUIDE_AUTHENTICITY_UPDATED_AT,
          author: { "@type": "Organization", name: "Meecard" },
          publisher: { "@type": "Organization", name: "Meecard", url: baseUrl },
        }}
      />

      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "guide"), href: "/guide" },
          { label: guideAuthH1(lang) },
        ]}
      />

      <PageHeader title={guideAuthH1(lang)} description={guideAuthLead(lang)}>
        <p className="text-meta">อัปเดตล่าสุด: {guideAuthUpdatedLabel(lang)}</p>
      </PageHeader>

      <div className="mt-8 space-y-12">
        <section className="max-w-3xl space-y-3">
          {guideAuthIntro(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-h2">{guideAuthBestMethodHeading(lang)}</h2>
          {guideAuthBestMethodBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="max-w-3xl text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthChecksHeading(lang)}</h2>
          <Surface variant="outline" className="divide-y divide-hair overflow-hidden">
            {guideAuthChecks(lang).map((check) => (
              <div key={check.id} id={`check-${check.id}`} className="scroll-mt-24 px-5 py-4">
                <h3 className="text-h5">{check.title}</h3>
                <p className="mt-1.5 text-body-sm leading-relaxed text-muted-foreground">
                  {check.body}
                </p>
              </div>
            ))}
          </Surface>
        </section>

        <section className="space-y-3">
          <h2 className="text-h2">{guideAuthLightTestHeading(lang)}</h2>
          {guideAuthLightTestBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="max-w-3xl text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-h2">{guideAuthRipHeading(lang)}</h2>
          <GuideCallout tone="warning" icon={AlertTriangle}>
            <p className="text-body-sm leading-relaxed">{guideAuthRipBody(lang)}</p>
          </GuideCallout>
        </section>

        <section className="space-y-3">
          <h2 className="text-h2">{guideAuthGradingHeading(lang)}</h2>
          {guideAuthGradingBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="max-w-3xl text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthTermsHeading(lang)}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {guideAuthTerms(lang).map((term) => (
              <Surface key={term.id} variant="outline" className="space-y-1.5 p-4">
                <h3 className="text-h5">{term.title}</h3>
                <p className="text-body-sm leading-relaxed text-muted-foreground">{term.body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthRedFlagsHeading(lang)}</h2>
          <Surface variant="outline" className="divide-y divide-hair overflow-hidden">
            {guideAuthRedFlags(lang).map((flag) => (
              <p key={flag.id} className="px-5 py-3.5 text-body-sm leading-relaxed">
                {flag.before}
                {flag.link && (
                  <>
                    {" "}
                    <Link
                      href={flag.link.href}
                      className="font-medium text-primary hover:underline"
                    >
                      {flag.link.label}
                    </Link>
                    {flag.after && ` ${flag.after}`}
                  </>
                )}
              </p>
            ))}
          </Surface>
        </section>

        <FaqSection items={guideAuthFaq(lang)} />

        <GuideSourceList
          heading={t(lang, "guideRaritySourcesHeading")}
          sources={[
            {
              label: "ONE PIECE CARD GAME — ประกาศเตือนการ์ดปลอม (พ.ย. 2024)",
              desc: "ประกาศทางการของ Bandai เรื่องการ์ดปลอมของ Winner card ฉบับภาษาอังกฤษ",
              url: "https://asia-en.onepiece-cardgame.com/topics/018.php",
            },
            {
              label: "ONE PIECE CARD GAME — เว็บทางการ (ไทย)",
              desc: "ข้อมูลผลิตภัณฑ์ ชุดการ์ด และประกาศจากผู้ผลิต ใช้ตรวจว่าการ์ดที่เห็นมีอยู่จริงไหม",
              url: "https://asia-th.onepiece-cardgame.com/",
            },
            {
              label: "ราคากลางการ์ดวันพีซบน Meecard",
              desc: "เทียบราคาที่คนขายเสนอกับราคาตลาด ก่อนตัดสินใจว่าของถูกผิดปกติหรือเปล่า",
              url: "/opcg/search",
              internal: true,
            },
          ]}
        />

        <GuidePrevNext
          prev={{ href: "/guide/buying", label: t(lang, "guideHomeGuideBuyingTitle") }}
          next={{ href: "/guide", label: t(lang, "guide") }}
        />
      </div>

      <RelatedPages
        items={[
          {
            href: "/guide/buying",
            icon: Store,
            title: "ซื้อการ์ดวันพีซที่ไหนดี",
            description: "ช่องทางซื้อในไทย สั่งจากญี่ปุ่น และวิธีเช็คราคาก่อนโอน",
          },
          {
            href: "/opcg/most-expensive",
            icon: LineChart,
            title: "การ์ดวันพีซที่แพงที่สุด",
            description: "ใบไหนแพงพอที่จะคุ้มค่าให้คนทำปลอม",
          },
          {
            href: "/guide/rarities",
            icon: ShieldCheck,
            title: "ความหายากการ์ดวันพีซ",
            description: "SEC · Parallel · Treasure Rare ต่างกันยังไง",
          },
        ]}
      />
    </>
  );
}
