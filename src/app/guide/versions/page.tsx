import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Layers, LineChart } from "lucide-react";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { clientEnv } from "@/lib/env";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_VERSIONS_META,
  GUIDE_VERSIONS_PUBLISHED_AT,
  GUIDE_VERSIONS_UPDATED_AT,
  guideVersionsChoose,
  guideVersionsChooseHeading,
  guideVersionsCompare,
  guideVersionsCompareHeading,
  guideVersionsCompareLabels,
  guideVersionsFaq,
  guideVersionsH1,
  guideVersionsIntro,
  guideVersionsLead,
  guideVersionsPriceBody,
  guideVersionsPriceHeading,
  guideVersionsRulesBody,
  guideVersionsRulesHeading,
  guideVersionsThaiBody,
  guideVersionsThaiHeading,
  guideVersionsUpdatedLabel,
} from "@/lib/seo/copy/guide-versions";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: GUIDE_VERSIONS_META.title,
  description: GUIDE_VERSIONS_META.description,
  canonical: "/guide/versions",
  ogType: "article",
});

export default async function VersionsGuidePage() {
  const lang = await getServerLanguage();
  const labels = guideVersionsCompareLabels(lang);
  const rows = guideVersionsCompare(lang);
  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "guide"), href: "/guide" },
          { name: guideVersionsH1(lang), href: "/guide/versions" },
        ])}
      />

      {/* Article schema — this page cites a rule that changed 2025-11-28, so
          dateModified matters for freshness signals more than most guides. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guideVersionsH1(lang),
          description: GUIDE_VERSIONS_META.description,
          url: `${baseUrl}/guide/versions`,
          inLanguage: "th-TH",
          datePublished: GUIDE_VERSIONS_PUBLISHED_AT,
          dateModified: GUIDE_VERSIONS_UPDATED_AT,
          author: { "@type": "Organization", name: "Meecard" },
          publisher: { "@type": "Organization", name: "Meecard", url: baseUrl },
        }}
      />

      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "guide"), href: "/guide" },
          { label: guideVersionsH1(lang) },
        ]}
      />

      <PageHeader title={guideVersionsH1(lang)} description={guideVersionsLead(lang)}>
        <p className="text-meta">อัปเดตล่าสุด: {guideVersionsUpdatedLabel(lang)}</p>
      </PageHeader>

      <div className="mt-8 space-y-12">
        <section className="max-w-3xl space-y-3">
          {guideVersionsIntro(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-h2">{guideVersionsRulesHeading(lang)}</h2>
          {guideVersionsRulesBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="max-w-3xl text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideVersionsCompareHeading(lang)}</h2>

          {/* Dense table from sm up; stacked list below it (AGENTS.md breakpoints). */}
          <Surface variant="outline" className="hidden overflow-hidden sm:block">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-hair">
                  <th className="w-44 px-4 py-3 text-left text-eyebrow">{labels.topic}</th>
                  <th className="px-4 py-3 text-left text-eyebrow">{labels.jp}</th>
                  <th className="px-4 py-3 text-left text-eyebrow">{labels.en}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="px-4 py-3 text-left text-h5 font-medium">
                      {row.title}
                    </th>
                    <td className="px-4 py-3 text-body-sm leading-relaxed text-muted-foreground">
                      {row.jp}
                    </td>
                    <td className="px-4 py-3 text-body-sm leading-relaxed text-muted-foreground">
                      {row.en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>

          <Surface variant="outline" className="divide-y divide-hair overflow-hidden sm:hidden">
            {rows.map((row) => (
              <div key={row.id} className="space-y-2 px-5 py-4">
                <h3 className="text-h5">{row.title}</h3>
                <p className="text-body-sm leading-relaxed text-muted-foreground">
                  <span className="text-foreground">{labels.jp}</span> — {row.jp}
                </p>
                <p className="text-body-sm leading-relaxed text-muted-foreground">
                  <span className="text-foreground">{labels.en}</span> — {row.en}
                </p>
              </div>
            ))}
          </Surface>
        </section>

        <section className="space-y-3">
          <h2 className="text-h2">{guideVersionsPriceHeading(lang)}</h2>
          {guideVersionsPriceBody(lang).map((paragraph) => (
            <p key={paragraph.id} className="max-w-3xl text-body leading-relaxed">
              {paragraph.before}
              {paragraph.link && (
                <>
                  {" "}
                  <Link
                    href={paragraph.link.href}
                    className="font-medium text-primary hover:underline"
                  >
                    {paragraph.link.label}
                  </Link>
                  {paragraph.after && ` ${paragraph.after}`}
                </>
              )}
            </p>
          ))}
        </section>

        <section className="max-w-3xl space-y-3">
          <h2 className="text-h2">{guideVersionsThaiHeading(lang)}</h2>
          {guideVersionsThaiBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideVersionsChooseHeading(lang)}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {guideVersionsChoose(lang).map((item) => (
              <Surface key={item.title} variant="outline" className="space-y-1.5 p-4">
                <h3 className="text-h5">{item.title}</h3>
                <p className="text-body-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <FaqSection items={guideVersionsFaq(lang)} />

        <GuideSourceList
          heading={t(lang, "guideRaritySourcesHeading")}
          sources={[
            {
              label: "ONE PIECE CARD GAME — กฎเรื่องภาษาของการ์ดที่ใช้แข่งได้",
              desc: "หน้ากฎทางการของ Bandai ที่ระบุว่าฉบับภาษาอังกฤษใช้ในไทยได้ตั้งแต่ 28 พ.ย. 2025 และผสมกับฉบับญี่ปุ่นได้",
              url: "https://en.onepiece-cardgame.com/rules/announcements/lang_card_rule.php",
            },
            {
              label: "ONE PIECE CARD GAME — เว็บทางการ (ไทย)",
              desc: "ข้อมูลผลิตภัณฑ์ ชุดการ์ด และประกาศสำหรับผู้เล่นในไทย",
              url: "https://asia-th.onepiece-cardgame.com/",
            },
            {
              label: "ชุดการ์ดวันพีซทั้งหมดบน Meecard",
              desc: "ดูว่าแต่ละชุดมีการ์ดกี่ใบ วางขายเมื่อไหร่ และราคาตลาดตอนนี้เท่าไหร่",
              url: "/opcg/sets",
              internal: true,
            },
          ]}
        />

        <GuidePrevNext
          prev={{ href: "/guide/sets", label: t(lang, "guideHomeGuideSetsTitle") }}
          next={{ href: "/guide/buying", label: t(lang, "guideHomeGuideBuyingTitle") }}
        />
      </div>

      <RelatedPages
        items={[
          {
            href: "/guide/getting-started",
            icon: BookOpen,
            title: "วิธีเล่นการ์ดวันพีซ",
            description: "กฎพื้นฐาน ระบบ DON!! และเงื่อนไขชนะ",
          },
          {
            href: "/opcg/sets",
            icon: Layers,
            title: "ชุดการ์ดวันพีซทั้งหมด",
            description: "ราคาการ์ดทุกใบแยกตามชุด อัปเดตทุกวัน",
          },
          {
            href: "/opcg/market-overview",
            icon: LineChart,
            title: "ภาพรวมตลาด",
            description: "มูลค่าตลาดและราคาเฉลี่ยของการ์ดวันพีซ",
          },
        ]}
      />
    </>
  );
}
