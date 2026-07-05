import Link from "next/link";
import type { Metadata } from "next";
import {
  Crown,
  Heart,
  Layers,
  LineChart,
  RefreshCw,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { RelatedPages } from "@/components/shared/related-pages";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { CardThumbStrip, type ThumbCard } from "@/components/guide/card-thumb-strip";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Getting Started — คู่มือ OPCG",
  description:
    "คู่มือเริ่มต้นเล่น One Piece Card Game (OPCG) ครบจบในหน้าเดียว กฎ วิธีเล่น ระบบ DON!! เทิร์น การโจมตี เงื่อนไขชนะ อ้างอิงกฎจาก Bandai",
  alternates: { canonical: "/guide/getting-started" },
};

/* ------------------------------------------------------------------ */
/*  Turn phases data                                                   */
/* ------------------------------------------------------------------ */

function buildTurnPhases(lang: Language) {
  return [
    {
      name: "Refresh Phase",
      nameTh: t(lang, "guideStartPhaseRefreshLabel"),
      description: t(lang, "guideStartPhaseRefreshDesc"),
      color: "bg-emerald-500",
      icon: RefreshCw,
    },
    {
      name: "Draw Phase",
      nameTh: t(lang, "guideStartPhaseDrawLabel"),
      description: t(lang, "guideStartPhaseDrawDesc"),
      color: "bg-blue-500",
      icon: Layers,
    },
    {
      name: "DON!! Phase",
      nameTh: t(lang, "guideStartPhaseDonLabel"),
      description: t(lang, "guideStartPhaseDonDesc"),
      color: "bg-amber-500",
      icon: Zap,
    },
    {
      name: "Main Phase",
      nameTh: t(lang, "guideStartPhaseMainLabel"),
      description: t(lang, "guideStartPhaseMainDesc"),
      color: "bg-rose-500",
      icon: Swords,
    },
    {
      name: "End Phase",
      nameTh: t(lang, "guideStartPhaseEndLabel"),
      description: t(lang, "guideStartPhaseEndDesc"),
      color: "bg-purple-500",
      icon: Sparkles,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Combat steps data                                                  */
/* ------------------------------------------------------------------ */

function buildCombatSteps(lang: Language) {
  return [
    {
      step: 1,
      name: t(lang, "guideStartCombatStep1Name"),
      description: t(lang, "guideStartCombatStep1Desc"),
      color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    },
    {
      step: 2,
      name: "Block",
      description: t(lang, "guideStartCombatStep2Desc"),
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      step: 3,
      name: "Counter",
      description: t(lang, "guideStartCombatStep3Desc"),
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    {
      step: 4,
      name: t(lang, "guideStartCombatStep4Name"),
      description: t(lang, "guideStartCombatStep4Desc"),
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  DB query                                                           */
/* ------------------------------------------------------------------ */

type ExampleCard = {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  imageUrl: string | null;
};

async function getSetupCards(): Promise<{
  leader: ExampleCard | null;
  don: ExampleCard | null;
}> {
  try {
    const [leader, don] = await Promise.all([
      prisma.card.findFirst({
        where: { cardType: "LEADER", imageUrl: { not: null }, isParallel: false },
        select: { cardCode: true, nameEn: true, nameJp: true, imageUrl: true },
        orderBy: { cardCode: "asc" },
      }),
      prisma.card.findFirst({
        where: { cardType: "DON", imageUrl: { not: null }, isParallel: false },
        select: { cardCode: true, nameEn: true, nameJp: true, imageUrl: true },
        orderBy: { cardCode: "asc" },
      }),
    ]);
    return { leader, don };
  } catch {
    return { leader: null, don: null };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GettingStartedPage() {
  const lang = await getServerLanguage();
  const { leader, don } = await getSetupCards();
  const turnPhases = buildTurnPhases(lang);
  const combatSteps = buildCombatSteps(lang);
  const exampleCards: ThumbCard[] = [
    ...(leader?.imageUrl
      ? [{ cardCode: leader.cardCode, name: leader.nameEn ?? leader.nameJp, imageUrl: leader.imageUrl, label: "Leader" }]
      : []),
    ...(don?.imageUrl
      ? [{ cardCode: don.cardCode, name: don.nameEn ?? don.nameJp, imageUrl: don.imageUrl, label: "DON!!" }]
      : []),
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Getting Started", href: "/guide/getting-started" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Guide", href: "/guide" },
              { label: t(lang, "guideStartBreadcrumb") },
            ]}
            hideMobileBack
          />
        }
        back={{ href: "/guide", label: "Guide" }}
        title={t(lang, "guideStartHeroTitle")}
        description={
          <>
            <strong className="text-foreground">One Piece Card Game (OPCG)</strong>
            {t(lang, "guideStartHeroP1a")}
            <strong className="text-foreground">Bandai</strong>
            {t(lang, "guideStartHeroP1b")}
          </>
        }
      />

      {/* ── 2. สิ่งที่ต้องมี ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideStartNeedsTitle")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Leader", count: t(lang, "guideStartNeedsLeaderCount"), desc: t(lang, "guideStartNeedsLeaderDesc"), color: "border-orange-500/30 bg-orange-500/5" },
            { label: "Deck", count: t(lang, "guideStartNeedsDeckCount"), desc: t(lang, "guideStartNeedsDeckDesc"), color: "border-primary/30 bg-primary/5" },
            { label: "DON!!", count: t(lang, "guideStartNeedsDonCount"), desc: t(lang, "guideStartNeedsDonDesc"), color: "border-amber-500/30 bg-amber-500/5" },
            { label: "Life", count: t(lang, "guideStartNeedsLifeCount"), desc: t(lang, "guideStartNeedsLifeDesc"), color: "border-rose-500/30 bg-rose-500/5" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 text-center ${item.color}`}
            >
              <p className="text-2xl font-bold tabular-nums">{item.count}</p>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 text-meta">{item.desc}</p>
            </div>
          ))}
        </div>
        {/* Leader & DON!! card examples */}
        {(leader || don) && (
          <Surface variant="outline" className="flex items-center gap-6 px-5 py-4">
            <CardThumbStrip cards={exampleCards} size="xl" showCaption className="gap-6" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(lang, "guideStartCardExampleA")}<strong className="text-foreground">Leader</strong>{t(lang, "guideStartCardExampleB")}
              <strong className="text-foreground">DON!!</strong>{t(lang, "guideStartCardExampleC")}
            </p>
          </Surface>
        )}

        <GuideCallout tone="blue">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong>{t(lang, "guideStartTipA")}<strong>Starter Deck</strong>{t(lang, "guideStartTipB")}
          </p>
        </GuideCallout>
      </section>

      {/* ── 3. เซ็ตอัพ (Game Setup) ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideStartSetupTitle")}</h2>
        <ol className="space-y-3">
          {[
            { step: t(lang, "guideStartSetupStep1"), detail: t(lang, "guideStartSetupStep1Detail") },
            { step: t(lang, "guideStartSetupStep2"), detail: t(lang, "guideStartSetupStep2Detail") },
            { step: t(lang, "guideStartSetupStep3"), detail: t(lang, "guideStartSetupStep3Detail") },
            { step: t(lang, "guideStartSetupStep4"), detail: t(lang, "guideStartSetupStep4Detail") },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{item.step}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Game board diagram */}
        <Surface variant="outline" className="overflow-hidden">
          <div className="border-b border-[var(--p-hair)] px-4 py-2 text-eyebrow">
            {t(lang, "guideStartBoardCaption")}
          </div>
          <div className="grid grid-cols-3 gap-2 p-4 text-center text-xs sm:grid-cols-5">
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-amber-500/40 bg-amber-500/5 sm:size-16">
                <span className="font-bold text-amber-600 dark:text-amber-400">DON!!</span>
              </div>
              <span className="text-muted-foreground">{t(lang, "guideStartBoardDonDeck")}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-rose-500/40 bg-rose-500/5 sm:size-16">
                <Heart className="size-4 text-rose-500" />
              </div>
              <span className="text-muted-foreground">Life</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-orange-500/50 bg-orange-500/10 sm:size-16">
                <Crown className="size-5 text-orange-500" />
              </div>
              <span className="font-medium text-foreground">Leader</span>
            </div>
            <div className="col-span-2 flex flex-col items-center gap-1 sm:col-span-2">
              <div className="flex h-14 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 sm:h-16">
                <span className="text-muted-foreground">Character Area</span>
              </div>
              <span className="text-muted-foreground">{t(lang, "guideStartBoardCharacterArea")}</span>
            </div>
            <div className="col-span-2 flex flex-col items-center gap-1 sm:col-span-2">
              <div className="flex h-14 w-full items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 sm:h-16">
                <Zap className="size-4 text-primary" />
              </div>
              <span className="text-muted-foreground">{t(lang, "guideStartBoardCostArea")}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 sm:size-16">
                <span className="text-muted-foreground/60">Trash</span>
              </div>
              <span className="text-muted-foreground">{t(lang, "guideStartBoardTrash")}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 sm:size-16">
                <Layers className="size-4 text-primary" />
              </div>
              <span className="text-muted-foreground">{t(lang, "guideStartBoardDeck")}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 sm:size-16">
                <span className="text-muted-foreground/60">{t(lang, "guideStartBoardHandCount")}</span>
              </div>
              <span className="text-muted-foreground">{t(lang, "guideStartBoardHand")}</span>
            </div>
          </div>
        </Surface>
      </section>

      {/* ── 4. เทิร์นการเล่น (Turn Phases) ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideStartTurnTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideStartTurnIntro")}
        </p>
        <div className="space-y-0">
          {turnPhases.map((phase, i) => (
            <div key={phase.name} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${phase.color} text-white`}>
                  <phase.icon className="size-4" />
                </div>
                {i < turnPhases.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border" />
                )}
              </div>
              {/* Content */}
              <div className={`${i < turnPhases.length - 1 ? "pb-6" : ""}`}>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-h4">{phase.name}</h3>
                  <span className="text-meta">
                    {phase.nameTh}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {phase.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <GuideCallout tone="amber">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{t(lang, "guideStartFirstPlayerLabel")}</strong>{t(lang, "guideStartFirstPlayerDesc")}
          </p>
        </GuideCallout>
      </section>

      {/* ── 5. ระบบ DON!! ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideStartDonSystemTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(lang, "guideStartDonSystemIntro")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Surface variant="outline" className="p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Zap className="size-5 text-amber-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{t(lang, "guideStartDonPayCostTitle")}</h3>
            <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
              {t(lang, "guideStartDonPayCostDesc")}
            </p>
          </Surface>
          <Surface variant="outline" className="p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10">
              <Swords className="size-5 text-rose-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{t(lang, "guideStartDonPowerTitle")}</h3>
            <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
              {t(lang, "guideStartDonPowerA")}<strong className="text-foreground">{t(lang, "guideStartDonPowerStrong")}</strong>{t(lang, "guideStartDonPowerB")}
            </p>
          </Surface>
        </div>
      </section>

      {/* ── 6. การโจมตีและป้องกัน (Combat) ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideStartCombatTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(lang, "guideStartCombatIntro")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {combatSteps.map((step) => (
            <div
              key={step.step}
              className={`rounded-xl border p-4 ${step.color}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
                  {step.step}
                </span>
                <h3 className="text-sm font-semibold">{step.name}</h3>
              </div>
              <p className="mt-2 text-body-sm leading-relaxed opacity-80">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <GuideCallout tone="rose">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Life:</strong>{t(lang, "guideStartCombatLifeA")}<strong>Trigger</strong>{t(lang, "guideStartCombatLifeB")}
            </p>
            <p>
              <strong className="text-foreground">Character:</strong>{t(lang, "guideStartCombatCharacter")}
            </p>
          </div>
        </GuideCallout>
      </section>

      {/* ── 7. เงื่อนไขชนะ ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideStartWinTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Surface variant="outline" className="p-5">
            <div className="flex items-center gap-2">
              <Swords className="size-5 text-rose-500" />
              <h3 className="text-sm font-semibold">{t(lang, "guideStartWinAttackTitle")}</h3>
            </div>
            <p className="mt-2 text-body-sm leading-relaxed text-muted-foreground">
              {t(lang, "guideStartWinAttackA")}<strong className="text-foreground">{t(lang, "guideStartWinYouWin")}</strong>
            </p>
          </Surface>
          <Surface variant="outline" className="p-5">
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-blue-500" />
              <h3 className="text-sm font-semibold">{t(lang, "guideStartWinDeckOutTitle")}</h3>
            </div>
            <p className="mt-2 text-body-sm leading-relaxed text-muted-foreground">
              {t(lang, "guideStartWinDeckOutA")}<strong className="text-foreground">{t(lang, "guideStartWinYouWin")}</strong>{t(lang, "guideStartWinDeckOutB")}
            </p>
          </Surface>
        </div>
      </section>

      {/* ── 8. ราคาการ์ดทำงานยังไง ── */}
      <section className="space-y-4">
        <h2 className="text-h2">{t(lang, "guideStartPricingTitle")}</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            {t(lang, "guideStartPricingP1a")}
            <Link href="/guide/rarities" className="font-medium text-primary hover:underline">{t(lang, "guideStartPricingP1Link")}</Link>
            {t(lang, "guideStartPricingP1b")}
          </p>
          <p>
            {t(lang, "guideStartPricingP2a")}<strong className="text-foreground">Yuyu-tei</strong>{t(lang, "guideStartPricingP2b")}
          </p>
          <p>
            {t(lang, "guideStartPricingP3a")}<strong className="text-foreground">SEC (Secret Rare)</strong>{t(lang, "guideStartPricingP3b")}
            <strong className="text-foreground">SP (Special)</strong>{t(lang, "guideStartPricingP3c")}
            <strong className="text-foreground">C (Common)</strong>{t(lang, "guideStartPricingP3d")}
            <Link href="/guide/rarities" className="font-medium text-primary hover:underline">{t(lang, "guideStartPricingP3Link1")}</Link>
            {t(lang, "guideStartPricingP3e")}
            <Link href="/guide/buying" className="font-medium text-primary hover:underline">{t(lang, "guideStartPricingP3Link2")}</Link>
          </p>
        </div>
      </section>

      {/* ── 9. แหล่งอ้างอิง ── */}
      <GuideSourceList
        heading={t(lang, "guideStartSourcesTitle")}
        sources={[
          {
            label: "Official Rules",
            desc: t(lang, "guideStartSourceOfficialDesc"),
            url: "https://en.onepiece-cardgame.com/rules/",
          },
          {
            label: "Play Guide",
            desc: t(lang, "guideStartSourcePlayGuideDesc"),
            url: "https://en.onepiece-cardgame.com/play-guide/",
          },
          {
            label: "Comprehensive Rules (PDF)",
            desc: t(lang, "guideStartSourceComprehensiveDesc"),
            url: "https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf",
          },
        ]}
      />

      {/* ── Related pages ── */}
      <RelatedPages
        items={[
          {
            href: "/",
            icon: LineChart,
            title: t(lang, "guideStartRelatedPricesTitle"),
            description: t(lang, "guideStartRelatedPricesDesc"),
          },
          {
            href: "/sets",
            icon: Layers,
            title: t(lang, "guideStartRelatedSetsTitle"),
            description: t(lang, "guideStartRelatedSetsDesc"),
          },
        ]}
      />

      {/* ── 10. Navigation ── */}
      <GuidePrevNext
        prev={{ href: "/guide", label: t(lang, "guideStartNavAllGuides") }}
        next={{ href: "/guide/card-types", label: t(lang, "guideStartNavNext") }}
      />
    </div>
  );
}
