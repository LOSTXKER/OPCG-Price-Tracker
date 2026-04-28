import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  ExternalLink,
  Info,
  Layers,
  Package,
  Star,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ชุดการ์ด (Sets) — คู่มือ OPCG",
  description:
    "คู่มือระบบชุดการ์ด One Piece Card Game: Booster Pack, Starter Deck, Extra Booster, Premium Booster รูปแบบ Card Code และรายชื่อชุดทั้งหมด",
  alternates: { canonical: "/guide/sets" },
};

/* ------------------------------------------------------------------ */
/*  Set type config                                                    */
/* ------------------------------------------------------------------ */

const SET_TYPE_INFO: Record<
  string,
  { label: string; icon: typeof Layers; color: string; description: string }
> = {
  BOOSTER: {
    label: "Booster Pack (OP-xx)",
    icon: Package,
    color: "#3B82F6",
    description:
      "ชุดหลักของเกม ออกทุก 2-3 เดือน มีประมาณ 119 ใบ + Parallel ซองสุ่มการ์ด ขายเป็นซอง กล่อง หรือลัง",
  },
  STARTER: {
    label: "Starter Deck (ST-xx)",
    icon: Star,
    color: "#22C55E",
    description:
      "เด็คสำเร็จรูปพร้อมเล่น มีประมาณ 17 แบบ (รวม Leader + DON!!) การ์ด fixed ไม่สุ่ม เหมาะมือใหม่",
  },
  EXTRA_BOOSTER: {
    label: "Extra Booster (EB-xx)",
    icon: Trophy,
    color: "#F59E0B",
    description:
      "ชุดพิเศษที่ออกเป็นครั้งคราว จำนวนใบแตกต่างกัน มักมีธีมเฉพาะ เช่น Memorial Collection",
  },
  PROMO: {
    label: "Promo / Premium (PRB-xx)",
    icon: Layers,
    color: "#8B5CF6",
    description:
      "ชุด reprint compilation หรือการ์ดโปรโมชันพิเศษ มักแจกในงานอีเวนต์หรือมาพร้อมสินค้า",
  },
  OTHER: {
    label: "อื่นๆ",
    icon: Box,
    color: "#6B7280",
    description: "ชุดอื่นๆ ที่ไม่จัดอยู่ในหมวดข้างต้น",
  },
};

const TYPE_ORDER = ["BOOSTER", "STARTER", "EXTRA_BOOSTER", "PROMO", "OTHER"];

/* ------------------------------------------------------------------ */
/*  DB query                                                           */
/* ------------------------------------------------------------------ */

type SetRow = {
  code: string;
  name: string;
  nameEn: string | null;
  type: string;
  cardCount: number;
  releaseDate: Date | null;
  boxImageUrl: string | null;
};

async function getSetsGrouped(): Promise<Record<string, SetRow[]>> {
  try {
    const sets = await prisma.cardSet.findMany({
      select: {
        code: true,
        name: true,
        nameEn: true,
        type: true,
        cardCount: true,
        releaseDate: true,
        boxImageUrl: true,
      },
      orderBy: { code: "asc" },
    });

    const grouped: Record<string, SetRow[]> = {};
    for (const s of sets) {
      const key = s.type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    }
    return grouped;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GuideSetsPage() {
  const grouped = await getSetsGrouped();

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Sets", href: "/guide/sets" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide", href: "/guide" },
            { label: "ชุดการ์ด" },
          ]}
        />
        <h1 className="text-h1">
          ชุดการ์ด (Sets)
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          OPCG ออกชุดใหม่ทุก 2-3 เดือน มีหลายประเภทตั้งแต่ Booster Pack
          สำหรับสะสม ไปจนถึง Starter Deck สำหรับมือใหม่
        </p>
      </div>

      {/* ── 2. Set Types ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">ประเภทชุดการ์ด</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {["BOOSTER", "STARTER", "EXTRA_BOOSTER", "PROMO"].map((type) => {
            const info = SET_TYPE_INFO[type];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <div
                key={type}
                className="rounded-xl border border-border/50 bg-card p-4"
              >
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${info.color}15` }}
                >
                  <Icon
                    className="size-4.5"
                    style={{ color: info.color }}
                  />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{info.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {info.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Pack Structure ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          โครงสร้าง Booster (เวอร์ชัน JP)
        </h2>
        <p className="text-sm text-muted-foreground">
          Booster Pack ญี่ปุ่นแบ่งเป็น 3 ขนาด:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "1 ซอง", value: "6 ใบ", color: "#3B82F6" },
            { label: "1 กล่อง", value: "24 ซอง", color: "#8B5CF6" },
            { label: "1 ลัง", value: "12 กล่อง", color: "#F59E0B" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/50 bg-card p-4 text-center"
            >
              <p
                className="text-xl font-bold"
                style={{ color: item.color }}
              >
                {item.value}
              </p>
              <p className="mt-1 text-meta">
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
          <p className="text-sm text-muted-foreground">
            เวอร์ชัน EN (ภาษาอังกฤษ) มี{" "}
            <strong className="text-foreground">12 ใบต่อซอง</strong>{" "}
            แทนที่จะเป็น 6 ใบแบบ JP โครงสร้างกล่อง/ลังเหมือนกัน
          </p>
        </div>
      </section>

      {/* ── 4. Card Code Format ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">รูปแบบ Card Code</h2>
        <p className="text-sm text-muted-foreground">
          การ์ดทุกใบมี code เฉพาะตัวที่บอกว่ามาจากชุดไหน ใบที่เท่าไหร่
        </p>
        <div className="space-y-2">
          {[
            {
              code: "OP09-001",
              desc: "Booster ชุดที่ 9, ใบที่ 001",
              color: "#3B82F6",
            },
            {
              code: "OP09-001_p1",
              desc: "Parallel (ภาพพิเศษ) ลำดับที่ 1",
              color: "#8B5CF6",
            },
            {
              code: "ST01-001",
              desc: "Starter Deck ชุดที่ 1, ใบที่ 001",
              color: "#22C55E",
            },
            {
              code: "EB01-001",
              desc: "Extra Booster ชุดที่ 1, ใบที่ 001",
              color: "#F59E0B",
            },
          ].map((item) => (
            <div
              key={item.code}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3"
            >
              <code
                className="shrink-0 rounded-md px-2 py-1 font-mono text-sm font-bold"
                style={{
                  color: item.color,
                  backgroundColor: `${item.color}10`,
                }}
              >
                {item.code}
              </code>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Set List from DB ── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">รายชื่อชุดทั้งหมด</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ดูราคาและข้อมูลเพิ่มเติมได้ที่{" "}
            <Link
              href="/sets"
              className="font-medium text-primary hover:underline"
            >
              หน้าชุดการ์ด
            </Link>
          </p>
        </div>

        {TYPE_ORDER.map((type) => {
          const sets = grouped[type];
          if (!sets || sets.length === 0) return null;
          const info = SET_TYPE_INFO[type] ?? SET_TYPE_INFO.OTHER!;

          return (
            <div key={type} className="space-y-2">
              <h3
                className="text-sm font-semibold"
                style={{ color: info.color }}
              >
                {info.label} ({sets.length})
              </h3>
              <div className="divide-y divide-border/30 rounded-xl border border-border/50 bg-card">
                {sets.map((set) => (
                  <Link
                    key={set.code}
                    href={`/sets/${set.code}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                  >
                    {set.boxImageUrl ? (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={set.boxImageUrl}
                          alt={set.code}
                          fill
                          className="object-contain"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: info.color }}
                      >
                        {set.code.split("-")[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {set.nameEn ?? set.name}
                      </p>
                      <p className="text-meta">
                        {set.code}
                        {set.releaseDate && (
                          <>
                            {" · "}
                            {new Date(set.releaseDate).toLocaleDateString(
                              "th-TH",
                              { year: "numeric", month: "short" }
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {set.cardCount} ใบ
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีข้อมูลชุดในระบบ
            </p>
          </div>
        )}
      </section>

      {/* ── 6. Sources ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">แหล่งอ้างอิง</h2>
        <div className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card text-sm">
          {[
            {
              label: "Official Products",
              desc: "รายชื่อชุดการ์ดทั้งหมดจาก Bandai",
              url: "https://en.onepiece-cardgame.com/products/",
            },
            {
              label: "ดูราคาชุดการ์ด",
              desc: "ราคาและข้อมูล real-time บน Meecard",
              url: "/sets",
              internal: true,
            },
          ].map((src) =>
            "internal" in src && src.internal ? (
              <Link
                key={src.url}
                href={src.url}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{src.label}</p>
                  <p className="text-meta">{src.desc}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/40" />
              </Link>
            ) : (
              <a
                key={src.url}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{src.label}</p>
                  <p className="text-meta">{src.desc}</p>
                </div>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground/40" />
              </a>
            )
          )}
        </div>
      </section>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/colors"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          สี
        </Link>
        <Link
          href="/guide/buying"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: ซื้อการ์ด
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
