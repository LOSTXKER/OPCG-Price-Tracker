import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem } from "@/components/cards/card-item";
import { CardTable, type CardTableRow } from "@/components/cards/card-table";
import { CardsPagination } from "@/components/cards/cards-pagination";
import { CardsBrowseToolbar } from "@/components/shared/cards-browse-toolbar";
import { ErrorBanner } from "@/components/shared/error-banner";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import type { FilterDefinition } from "@/components/shared/filter-chips";
import { CardType } from "@/generated/prisma/client";
import {
  buildWhere,
  CARD_TYPE_LABELS,
  csv,
  one,
  orderByFromSort,
  type SearchParams,
  validCardTypes,
} from "@/lib/data/cards-browse";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants/ui";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await props.searchParams;
  const q = one(sp.search).trim();
  if (q) return { title: `ค้นหา: ${q}` };
  return { title: "การ์ดเดี่ยว — ค้นหาและกรองการ์ด OPCG" };
}

export default async function CardsBrowsePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const sort = one(sp.sort) || "newest";
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);
  const minPrice = parseInt(one(sp.minPrice), 10) || 0;
  const maxPrice = parseInt(one(sp.maxPrice), 10) || 0;
  const search = one(sp.search).trim();
  const view = one(sp.view) || "table";

  const where = buildWhere(sp);
  const orderBy = orderByFromSort(sort);
  const skip = (page - 1) * PAGE_SIZE_DEFAULT;

  type CardWithSet = Awaited<ReturnType<typeof prisma.card.findMany>>[number] & {
    set: { code: string; name: string; nameEn: string | null };
  };
  let cards: CardWithSet[] = [];
  let total = 0;
  let sets: { code: string; name: string; nameEn: string | null }[] = [];
  let rarityRows: { rarity: string }[] = [];
  let colorRows: { colorEn: string | null }[] = [];
  let dbError = false;

  try {
    [cards, total, sets, rarityRows, colorRows] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy,
        skip,
        take: PAGE_SIZE_DEFAULT,
        include: {
          set: { select: { code: true, name: true, nameEn: true } },
        },
      }),
      prisma.card.count({ where }),
      prisma.cardSet.findMany({
        select: { code: true, name: true, nameEn: true },
        orderBy: { code: "asc" },
      }),
      prisma.card.findMany({
        distinct: ["rarity"],
        select: { rarity: true },
        orderBy: { rarity: "asc" },
      }),
      prisma.card.findMany({
        where: { colorEn: { not: null } },
        distinct: ["colorEn"],
        select: { colorEn: true },
        orderBy: { colorEn: "asc" },
      }),
    ]);
  } catch (error) {
    console.error("Failed to fetch cards:", error);
    dbError = true;
  }

  const filterDefinitions: FilterDefinition[] = [
    {
      key: "set",
      label: "ชุด",
      options: sets.map((s) => ({
        value: s.code,
        label: `${s.code} · ${s.nameEn ?? s.name}`,
      })),
    },
    {
      key: "rarity",
      label: "ความหายาก",
      options: rarityRows.map((r) => ({ value: r.rarity, label: r.rarity })),
    },
    {
      key: "type",
      label: "ประเภท",
      options: (Object.keys(CARD_TYPE_LABELS) as CardType[]).map((t) => ({
        value: t,
        label: CARD_TYPE_LABELS[t],
      })),
    },
    {
      key: "color",
      label: "สี",
      options: colorRows
        .filter((c): c is { colorEn: string } => !!c.colorEn)
        .map((c) => ({ value: c.colorEn, label: c.colorEn })),
    },
    {
      key: "variant",
      label: "เวอร์ชัน",
      options: [
        { value: "regular", label: "ปกติ" },
        { value: "parallel", label: "Parallel" },
      ],
    },
  ];

  const initialSelected: Record<string, string[]> = {
    set: csv(sp.set),
    rarity: csv(sp.rarity),
    type: validCardTypes(csv(sp.type)),
    color: csv(sp.color),
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE_DEFAULT));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const sc = csv(sp.set);
    if (sc.length) params.set("set", sc.join(","));
    const r = csv(sp.rarity);
    if (r.length) params.set("rarity", r.join(","));
    const t = csv(sp.type);
    if (t.length) params.set("type", t.join(","));
    const col = csv(sp.color);
    if (col.length) params.set("color", col.join(","));
    if (sort && sort !== "newest") params.set("sort", sort);
    if (minPrice > 0) params.set("minPrice", String(minPrice));
    if (maxPrice > 0) params.set("maxPrice", String(maxPrice));
    if (view && view !== "table") params.set("view", view);
    if (p > 1) params.set("page", String(p));
    const q = params.toString();
    return q ? `/cards?${q}` : "/cards";
  }

  function viewHref(v: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const sc = csv(sp.set);
    if (sc.length) params.set("set", sc.join(","));
    const r = csv(sp.rarity);
    if (r.length) params.set("rarity", r.join(","));
    const t = csv(sp.type);
    if (t.length) params.set("type", t.join(","));
    const col = csv(sp.color);
    if (col.length) params.set("color", col.join(","));
    if (sort && sort !== "newest") params.set("sort", sort);
    if (minPrice > 0) params.set("minPrice", String(minPrice));
    if (maxPrice > 0) params.set("maxPrice", String(maxPrice));
    if (v !== "table") params.set("view", v);
    const q = params.toString();
    return q ? `/cards?${q}` : "/cards";
  }

  const startItem = skip + 1;
  const endItem = Math.min(skip + PAGE_SIZE_DEFAULT, total);

  const tableRows: CardTableRow[] = cards.map((c) => ({
    cardCode: c.cardCode,
    baseCode: c.baseCode,
    nameJp: c.nameJp,
    nameEn: c.nameEn,
    nameTh: c.nameTh,
    rarity: c.rarity,
    isParallel: c.isParallel,
    cardType: c.cardType,
    colorEn: c.colorEn,
    imageUrl: c.imageUrl,
    latestPriceJpy: c.latestPriceJpy,
    latestPriceThb: c.latestPriceThb,
    priceChange24h: c.priceChange24h,
    priceChange7d: c.priceChange7d,
    setCode: c.set.code,
  }));

  return (
    <div className="flex gap-6">
      {/* Left sidebar filters (desktop) */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-[6rem] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            ตัวกรอง
          </div>
          <CardsBrowseToolbar
            initialSearch={search}
            initialSelected={initialSelected}
            filterDefinitions={filterDefinitions}
            sort={sort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            page={page}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-sans text-xl font-bold tracking-tight">การ์ดเดี่ยว</h1>
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString()} รายการ
              {search && <span> สำหรับ &quot;{search}&quot;</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded border border-border bg-muted/30 p-0.5">
              <Link
                href={viewHref("table")}
                className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === "table"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-3.5" />
                <span className="hidden sm:inline">ตาราง</span>
              </Link>
              <Link
                href={viewHref("grid")}
                className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === "grid"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">กริด</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile filters */}
        <div className="lg:hidden">
          <CardsBrowseToolbar
            initialSearch={search}
            initialSelected={initialSelected}
            filterDefinitions={filterDefinitions}
            sort={sort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            page={page}
          />
        </div>

        {dbError ? (
          <ErrorBanner message="ไม่สามารถเชื่อมต่อฐานข้อมูลได้ ลองอีกครั้ง" />
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">
              แสดง <span className="font-mono font-medium text-foreground">{startItem}–{endItem}</span> จาก{" "}
              <span className="font-mono font-medium text-foreground">{total.toLocaleString()}</span>
            </p>

            {cards.length === 0 ? (
              <KumaEmptyState
                preset="no-results"
                action={
                  <Link href="/cards" className="text-sm text-primary hover:underline">ล้างตัวกรอง</Link>
                }
              />
            ) : view === "table" ? (
              <div className="panel overflow-hidden">
                <CardTable cards={tableRows} />
              </div>
            ) : (
              <CardGrid>
                {cards.map((c) => (
                  <CardItem
                    key={c.id}
                    cardCode={c.cardCode}
                    nameJp={c.nameJp}
                    nameEn={c.nameEn}
                    nameTh={c.nameTh}
                    rarity={c.rarity}
                    isParallel={c.isParallel}
                    imageUrl={c.imageUrl}
                    priceJpy={c.latestPriceJpy ?? undefined}
                    priceThb={c.latestPriceThb ?? undefined}
                    priceChange7d={c.priceChange7d}
                    setCode={c.set.code}
                  />
                ))}
              </CardGrid>
            )}

            <CardsPagination page={page} totalPages={totalPages} pageHref={pageHref} />
          </>
        )}
      </div>
    </div>
  );
}
