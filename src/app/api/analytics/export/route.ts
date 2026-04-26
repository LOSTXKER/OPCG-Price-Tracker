import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { effectiveTier, getLimits } from "@/lib/tier";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const tier = effectiveTier(user.tier, user.tierExpiresAt);
  const limits = getLimits(tier);
  if (!limits.csvExport) {
    return NextResponse.json({ error: "Upgrade to Pro for CSV export" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "portfolio";

  if (type === "portfolio") {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            card: {
              select: {
                cardCode: true,
                nameJp: true,
                nameEn: true,
                rarity: true,
                latestPriceJpy: true,
                set: { select: { code: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json({ error: "No portfolio found" }, { status: 404 });
    }

    const header = "Card Code,Name,Set,Rarity,Quantity,Purchase Price (JPY),Current Price (JPY),Condition\n";
    const rows = portfolio.items
      .map((item) => {
        const c = item.card;
        return [
          c.cardCode,
          `"${(c.nameEn ?? c.nameJp).replace(/"/g, '""')}"`,
          c.set.code,
          c.rarity,
          item.quantity,
          item.purchasePrice ?? "",
          c.latestPriceJpy ?? "",
          item.condition,
        ].join(",");
      })
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="portfolio-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === "watchlist") {
    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      include: {
        card: {
          select: {
            cardCode: true,
            nameJp: true,
            nameEn: true,
            rarity: true,
            latestPriceJpy: true,
            priceChange7d: true,
            set: { select: { code: true } },
          },
        },
      },
    });

    const header = "Card Code,Name,Set,Rarity,Price (JPY),7d Change %\n";
    const rows = items
      .map((item) => {
        const c = item.card;
        return [
          c.cardCode,
          `"${(c.nameEn ?? c.nameJp).replace(/"/g, '""')}"`,
          c.set.code,
          c.rarity,
          c.latestPriceJpy ?? "",
          c.priceChange7d != null ? c.priceChange7d.toFixed(1) : "",
        ].join(",");
      })
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="watchlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === "listings") {
    const listings = await prisma.listing.findMany({
      where: { userId: user.id },
      include: {
        card: {
          select: {
            cardCode: true,
            nameJp: true,
            nameEn: true,
            rarity: true,
            latestPriceJpy: true,
            set: { select: { code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = "Card Code,Name,Set,Rarity,Price (JPY),Price (THB),Condition,Quantity,Status,Created\n";
    const rows = listings
      .map((l) => {
        const c = l.card;
        return [
          c.cardCode,
          `"${(c.nameEn ?? c.nameJp).replace(/"/g, '""')}"`,
          c.set.code,
          c.rarity,
          l.priceJpy,
          l.priceThb ?? "",
          l.condition,
          l.quantity,
          l.status,
          l.createdAt.toISOString().slice(0, 10),
        ].join(",");
      })
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="listings-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === "decks") {
    const decks = await prisma.deck.findMany({
      where: { userId: user.id },
      include: {
        cards: {
          include: {
            card: {
              select: {
                cardCode: true,
                nameJp: true,
                nameEn: true,
                rarity: true,
              },
            },
          },
        },
        leader: {
          select: { cardCode: true, nameJp: true, nameEn: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = "Deck Name,Leader,Card Code,Card Name,Rarity,Quantity\n";
    const rows = decks
      .flatMap((d) =>
        d.cards.map((dc) => {
          const c = dc.card;
          return [
            `"${d.name.replace(/"/g, '""')}"`,
            d.leader ? `"${(d.leader.nameEn ?? d.leader.nameJp).replace(/"/g, '""')}"` : "",
            c.cardCode,
            `"${(c.nameEn ?? c.nameJp).replace(/"/g, '""')}"`,
            c.rarity,
            dc.quantity,
          ].join(",");
        }),
      )
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="decks-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
});
