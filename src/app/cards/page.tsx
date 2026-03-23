import type { Metadata } from "next";
import Link from "next/link";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem } from "@/components/cards/card-item";
import { CardsBrowseToolbar } from "@/components/shared/cards-browse-toolbar";
import type { FilterDefinition } from "@/components/shared/filter-chips";
import { CardType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

const CARD_TYPE_LABELS: Record<CardType, string> = {
  CHARACTER: "Character",
  EVENT: "Event",
  STAGE: "Stage",
  LEADER: "Leader",
  DON: "DON!!",
};

function one(
  param: string | string[] | undefined
): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}

function csv(param: string | string[] | undefined): string[] {
  return one(param)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const VALID_CARD_TYPES = new Set<string>(Object.values(CardType));

type SearchParams = Record<string, string | string[] | undefined>;

function buildWhere(sp: SearchParams): Prisma.CardWhereInput {
  const search = one(sp.search).trim();
  const setCodes = csv(sp.set);
  const rarities = csv(sp.rarity);
  const types = csv(sp.type).filter((t) =>
    VALID_CARD_TYPES.has(t)
  ) as CardType[];
  const colors = csv(sp.color);
  const minPrice = parseInt(one(sp.minPrice), 10) || 0;
  const maxPrice = parseInt(one(sp.maxPrice), 10) || 0;

  const where: Prisma.CardWhereInput = {};

  if (search) {
    where.OR = [
      { nameJp: { contains: search, mode: "insensitive" } },
      { nameEn: { contains: search, mode: "insensitive" } },
      { cardCode: { contains: search, mode: "insensitive" } },
    ];
  }
  if (setCodes.length) {
    where.set = { code: { in: setCodes } };
  }
  if (rarities.length) {
    where.rarity = { in: rarities };
  }
  if (types.length) {
    where.cardType = { in: types };
  }
  if (colors.length) {
    where.colorEn = { in: colors };
  }
  if (minPrice > 0) {
    where.latestPriceJpy = {
      ...((where.latestPriceJpy as object) || {}),
      gte: minPrice,
    };
  }
  if (maxPrice > 0) {
    where.latestPriceJpy = {
      ...((where.latestPriceJpy as object) || {}),
      lte: maxPrice,
    };
  }

  return where;
}

function orderByFromSort(sortRaw: string): Prisma.CardOrderByWithRelationInput {
  switch (sortRaw) {
    case "price_asc":
      return { latestPriceJpy: "asc" };
    case "price_desc":
      return { latestPriceJpy: "desc" };
    case "change_desc":
      return { priceChange24h: "desc" };
    case "change_7d_desc":
      return { priceChange7d: "desc" };
    case "name":
      return { nameJp: "asc" };
    default:
      return { updatedAt: "desc" };
  }
}

export async function generateMetadata(props: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await props.searchParams;
  const q = one(sp.search).trim();
  if (q) {
    return { title: `ค้นหา: ${q}` };
  }
  return { title: "ค้นหาและเรียกดูการ์ด" };
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

  const where = buildWhere(sp);
  const orderBy = orderByFromSort(sort);
  const skip = (page - 1) * PAGE_SIZE;

  let cards: Awaited<ReturnType<typeof prisma.card.findMany>> = [];
  let total = 0;
  let sets: { code: string; name: string }[] = [];
  let rarityRows: { rarity: string }[] = [];
  let colorRows: { colorEn: string | null }[] = [];
  let dbError = false;

  try {
    [cards, total, sets, rarityRows, colorRows] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy,
        skip,
        take: PAGE_SIZE,
        include: { set: { select: { code: true, name: true, nameEn: true } } },
      }),
      prisma.card.count({ where }),
      prisma.cardSet.findMany({
        select: { code: true, name: true },
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
        label: `${s.code} · ${s.name}`,
      })),
    },
    {
      key: "rarity",
      label: "ความแรร์",
      options: rarityRows.map((r) => ({
        value: r.rarity,
        label: r.rarity,
      })),
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
  ];

  const initialSelected: Record<string, string[]> = {
    set: csv(sp.set),
    rarity: csv(sp.rarity),
    type: csv(sp.type).filter((t) => VALID_CARD_TYPES.has(t)),
    color: csv(sp.color),
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

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
    if (p > 1) params.set("page", String(p));
    const q = params.toString();
    return q ? `/cards?${q}` : "/cards";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          การ์ดทั้งหมด
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ค้นหา กรอง และเรียงตามราคา
        </p>
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

      {dbError ? (
        <div className="rounded-xl border border-dashed border-destructive/50 py-12 text-center">
          <p className="text-destructive text-sm">ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่</p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            พบ{" "}
            <span className="text-foreground font-mono font-medium">
              {total.toLocaleString()}
            </span>{" "}
            ใบ
          </p>

          {cards.length === 0 ? (
            <p className="text-muted-foreground text-sm">ไม่พบการ์ดที่ตรงเงื่อนไข</p>
          ) : (
            <CardGrid>
              {cards.map((c) => (
                <CardItem
                  key={c.id}
                  cardCode={c.cardCode}
                  nameJp={c.nameJp}
                  nameEn={c.nameEn}
                  rarity={c.rarity}
                  imageUrl={c.imageUrl}
                  priceJpy={c.latestPriceJpy ?? undefined}
                  priceThb={c.latestPriceThb ?? undefined}
                  priceChange7d={c.priceChange7d}
                  setCode={c.set.code}
                />
              ))}
            </CardGrid>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {hasPrev ? (
              <Link
                href={pageHref(page - 1)}
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
              >
                ก่อนหน้า
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium opacity-50 shadow-xs">
                ก่อนหน้า
              </span>
            )}
            <span className="text-muted-foreground text-sm">
              หน้า {page} / {totalPages}
            </span>
            {hasNext ? (
              <Link
                href={pageHref(page + 1)}
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
              >
                ถัดไป
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium opacity-50 shadow-xs">
                ถัดไป
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
