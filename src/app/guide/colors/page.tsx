import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Info,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สี (Colors) — คู่มือ OPCG",
  description:
    "คู่มือระบบสีของ One Piece Card Game: Red, Blue, Green, Purple, Black, Yellow รวม Multicolor และกฎสร้างเด็ค อ้างอิงจาก Bandai",
  alternates: { canonical: "/guide/colors" },
};

/* ------------------------------------------------------------------ */
/*  Color data                                                         */
/* ------------------------------------------------------------------ */

interface ColorInfo {
  name: string;
  nameTh: string;
  hex: string;
  tagline: string;
  description: string;
}

const COLORS: ColorInfo[] = [
  {
    name: "Red",
    nameTh: "แดง",
    hex: "#DC2626",
    tagline: "Rush + Power — บุกเร็ว ตีแรง",
    description:
      "สีของการโจมตีรุนแรง เน้นคีย์เวิร์ด [Rush] ที่ทำให้การ์ดโจมตีได้ทันทีที่ลงสนาม เร่ง Power สูงลิ่ว เคลียร์สนามฝ่ายตรงข้ามอย่างรวดเร็ว เหมาะกับคนชอบเล่นเชิงรุก",
  },
  {
    name: "Green",
    nameTh: "เขียว",
    hex: "#22C55E",
    tagline: "DON!! Ramp + ตั้งรับแล้วบุก",
    description:
      "สีของการสร้างทรัพยากร เร่ง DON!! ให้มีมากกว่าฝ่ายตรงข้าม แล้ว Active (ตั้ง) Character ที่ Rest อยู่ให้พร้อมรบอีกครั้ง ค่อยๆ สร้าง Board แล้วบุกเด็ดขาด",
  },
  {
    name: "Blue",
    nameTh: "น้ำเงิน",
    hex: "#3B82F6",
    tagline: "ควบคุมมือ + ดึงเกมยาว",
    description:
      "สีของการควบคุม สลับการ์ดกลับมือ/กลับเด็คฝ่ายตรงข้าม ดึงเกมให้ยาวออก เน้นสร้างความได้เปรียบด้านจำนวนการ์ดในมือ แล้วจบในจังหวะที่พร้อม",
  },
  {
    name: "Purple",
    nameTh: "ม่วง",
    hex: "#8B5CF6",
    tagline: "Cost Reduction + DON!! manipulation",
    description:
      "สีของการลด Cost ลง Character ตัวใหญ่ได้เร็วกว่าปกติ มีความสามารถจัดการ DON!! พิเศษ เช่น คืน DON!! กลับเด็ค หรือเพิ่ม DON!! จาก trash area เพื่อ tempo ที่แข็งแกร่ง",
  },
  {
    name: "Black",
    nameTh: "ดำ",
    hex: "#374151",
    tagline: "Removal + ทำลายการ์ดฝ่ายตรงข้าม",
    description:
      "สีของการทำลายล้าง ลด Cost การ์ดฝ่ายตรงข้ามแล้ว KO ทิ้ง เน้นคุม Board ไม่ให้ฝ่ายตรงข้ามสะสมกำลังได้ ถือเป็นหนึ่งในสีที่แข็งแกร่งที่สุดในเมตาหลายยุค",
  },
  {
    name: "Yellow",
    nameTh: "เหลือง",
    hex: "#EAB308",
    tagline: "Life Manipulation + Trigger",
    description:
      "สีที่ซับซ้อนที่สุด ใช้ Life เป็นทรัพยากร กระตุ้น Trigger effect จาก Life area เพิ่ม/ลด Life ได้ เล่นยากแต่ถ้าเชี่ยวชาญจะควบคุมเกมได้ดีมาก เปิดตัวครั้งแรกในชุดที่ 3",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type LeaderCard = {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  imageUrl: string | null;
  colorEn: string | null;
};

async function getLeadersByColor(): Promise<Record<string, LeaderCard[]>> {
  try {
    const leaders = await prisma.card.findMany({
      where: {
        cardType: "LEADER",
        isParallel: false,
        imageUrl: { not: null },
      },
      select: {
        cardCode: true,
        nameEn: true,
        nameJp: true,
        imageUrl: true,
        colorEn: true,
      },
      orderBy: { cardCode: "asc" },
    });

    const map: Record<string, LeaderCard[]> = {};
    for (const leader of leaders) {
      const colors = (leader.colorEn ?? "").split("/");
      for (const c of colors) {
        const key = c.trim();
        if (!key) continue;
        if (!map[key]) map[key] = [];
        if (map[key].length < 6) {
          map[key].push(leader);
        }
      }
    }
    return map;
  } catch {
    return {};
  }
}

export default async function ColorsPage() {
  const leadersByColor = await getLeadersByColor();

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Colors", href: "/guide/colors" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide", href: "/guide" },
            { label: "สี" },
          ]}
        />
        <h1 className="text-h1">สี (Colors)</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          ใน OPCG การ์ด <strong className="text-foreground">Leader</strong>{" "}
          กำหนดสีของเด็ค — แต่ละสีมี playstyle ที่ต่างกัน
          ตั้งแต่บุกเร็วไปจนถึงควบคุมเกม
        </p>
      </div>

      {/* ── 2. Six Colors ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">6 สีในเกม</h2>
        <div className="space-y-5">
          {COLORS.map((color) => {
            const leaders = leadersByColor[color.name] ?? [];
            return (
              <div
                key={color.name}
                className="overflow-hidden rounded-xl border bg-card"
                style={{ borderColor: `${color.hex}25` }}
              >
                <div className="flex">
                  <div
                    className="w-1.5 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: color.hex }}
                      >
                        {color.name.charAt(0)}
                      </div>
                      <h3 className="text-base font-bold">
                        {color.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({color.nameTh})
                        </span>
                      </h3>
                    </div>
                    <p
                      className="mt-2 text-sm font-medium"
                      style={{ color: color.hex }}
                    >
                      {color.tagline}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {color.description}
                    </p>

                    {/* Leader card images */}
                    {leaders.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          ตัวอย่าง Leader
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {leaders.map((leader) => (
                            <Link
                              key={leader.cardCode}
                              href={`/cards/${leader.cardCode}`}
                              className="group shrink-0"
                            >
                              <div className="relative aspect-[63/88] w-16 overflow-hidden rounded-lg bg-muted">
                                {leader.imageUrl && (
                                  <Image
                                    src={leader.imageUrl}
                                    alt={leader.nameEn ?? leader.nameJp}
                                    fill
                                    className="object-contain"
                                    sizes="64px"
                                  />
                                )}
                              </div>
                              <p className="mt-1 max-w-16 truncate text-center text-meta">
                                {leader.nameEn ?? leader.nameJp}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Multicolor ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Multicolor (การ์ด 2 สี)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Leader บางตัวมี{" "}
          <strong className="text-foreground">2 สี</strong> เช่น Red/Green —
          ทำให้สามารถใส่การ์ดจากทั้งสองสีในเด็คเดียวกันได้ แลกกับ Life ที่น้อยลง
        </p>

        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="border-b border-border/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            เปรียบเทียบ Leader สีเดียว vs 2 สี
          </div>
          <div className="grid grid-cols-2 divide-x divide-border/40">
            <div className="p-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-red-500">
                <span className="text-sm font-bold text-white">R</span>
              </div>
              <p className="mt-2 text-sm font-semibold">Leader สีเดียว</p>
              <p className="mt-1 text-2xl font-bold">5 Life</p>
              <p className="mt-0.5 text-meta">
                ใช้การ์ดได้แค่สีเดียว
              </p>
            </div>
            <div className="p-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center overflow-hidden rounded-full">
                <span className="inline-block h-full w-1/2 bg-red-500" />
                <span className="inline-block h-full w-1/2 bg-green-500" />
              </div>
              <p className="mt-2 text-sm font-semibold">Leader 2 สี</p>
              <p className="mt-1 text-2xl font-bold">4 Life</p>
              <p className="mt-0.5 text-meta">
                ใช้การ์ดจากทั้ง 2 สีได้
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">ตัวอย่าง</p>
          <p className="mt-2">
            ถ้าใช้ Leader{" "}
            <strong className="text-foreground">Red/Green</strong>{" "}
            จะใส่การ์ดในเด็คได้ 3 แบบ:
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: "#DC2626" }}
              />
              <span>การ์ดสี Red</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: "#22C55E" }}
              />
              <span>การ์ดสี Green</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-3 overflow-hidden rounded-full">
                <span className="w-1/2 bg-red-500" />
                <span className="w-1/2 bg-green-500" />
              </div>
              <span>การ์ด Red/Green (multicolor)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Deck Building Rule ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">สีกับการสร้างเด็ค</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Leader กำหนดทุกอย่าง</strong> —
            การ์ดทุกใบในเด็ค 50 ใบต้องตรงกับสีของ Leader ถ้า Leader เป็นสีแดง
            ก็ใส่ได้เฉพาะการ์ดสีแดง
          </p>
          <p>
            นอกจากนี้ ใส่การ์ดที่มี card number เดียวกันได้{" "}
            <strong className="text-foreground">สูงสุด 4 ใบ</strong> ต่อเด็ค
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">ใส่ผิดสีไม่ได้</strong> — ถ้า
            Leader เป็นสีแดง จะเอาการ์ดสีน้ำเงินมาใส่ในเด็คไม่ได้
            ยกเว้นจะใช้ Leader 2 สีที่มีน้ำเงินรวมอยู่ด้วย
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-sm font-semibold">สรุปองค์ประกอบเด็ค</p>
          <div className="mt-3 space-y-2">
            {[
              { label: "Leader", value: "1 ใบ", note: "กำหนดสีเด็ค" },
              {
                label: "การ์ดในเด็ค",
                value: "50 ใบ",
                note: "ต้องตรงสี Leader",
              },
              { label: "DON!!", value: "10 ใบ", note: "แยกกองต่างหาก" },
              { label: "การ์ดซ้ำ", value: "สูงสุด 4", note: "ต่อ card number" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm font-medium">
                  {item.label}
                </span>
                <span className="text-sm font-semibold">{item.value}</span>
                <span className="text-meta">
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Sources ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">แหล่งอ้างอิง</h2>
        <div className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card text-sm">
          {[
            {
              label: "Official Rules",
              desc: "กฎเกมอย่างเป็นทางการจาก Bandai",
              url: "https://en.onepiece-cardgame.com/rules/",
            },
            {
              label: "Play Guide",
              desc: "คู่มือการเล่นเบื้องต้นจาก Bandai",
              url: "https://en.onepiece-cardgame.com/play-guide/",
            },
          ].map((src) => (
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
          ))}
        </div>
      </section>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/rarities"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          ความหายาก
        </Link>
        <Link
          href="/guide/sets"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: ชุดการ์ด
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
