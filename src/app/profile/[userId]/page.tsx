import Link from "next/link";
import { notFound } from "next/navigation";

import { ListingCard } from "@/components/marketplace/listing-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params;
  if (!userId || userId.length < 10) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      sellerRating: true,
      sellerReviewCount: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  const [listings, reviews] = await Promise.all([
    prisma.listing.findMany({
      where: { userId: user.id, status: ListingStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        card: {
          include: { set: { select: { code: true, name: true, nameEn: true } } },
        },
        user: {
          select: {
            displayName: true,
            avatarUrl: true,
            sellerRating: true,
            sellerReviewCount: true,
          },
        },
      },
    }),
    prisma.review.findMany({
      where: { revieweeId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        reviewer: { select: { displayName: true, avatarUrl: true } },
      },
    }),
  ]);

  return (
    <div className="container mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-20">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-lg">
            {(user.displayName ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.displayName ?? "ผู้ขาย"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {user.sellerRating != null ? `★ ${user.sellerRating.toFixed(1)}` : "ยังไม่มีคะแนน"} ·{" "}
            {user.sellerReviewCount} รีวิว
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">รายการขาย</h2>
        {listings.length === 0 ? (
          <p className="text-muted-foreground text-sm">ยังไม่มีรายการที่เปิดขาย</p>
        ) : (
          <div className="space-y-4">
            {listings.map((l) => (
              <div key={l.id} className="space-y-2">
                <ListingCard
                  id={l.id}
                  card={{
                    cardCode: l.card.cardCode,
                    nameJp: l.card.nameJp,
                    nameEn: l.card.nameEn,
                    rarity: l.card.rarity,
                    imageUrl: l.card.imageUrl,
                    latestPriceJpy: l.card.latestPriceJpy,
                  }}
                  priceJpy={l.priceJpy}
                  priceThb={l.priceThb}
                  condition={l.condition}
                  seller={{
                    displayName: l.user.displayName,
                    avatarUrl: l.user.avatarUrl,
                    sellerRating: l.user.sellerRating,
                    sellerReviewCount: l.user.sellerReviewCount,
                  }}
                  shipping={l.shipping}
                  location={l.location}
                  isFeatured={l.isFeatured}
                />
                <div className="flex justify-end">
                  <Link
                    href={`/marketplace/${l.id}`}
                    className="text-primary text-sm underline-offset-4 hover:underline"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">รีวิวที่ได้รับ</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">ยังไม่มีรีวิว</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="bg-card flex gap-3 rounded-lg border p-3 ring-1 ring-foreground/10"
              >
                <Avatar className="size-10 shrink-0">
                  {r.reviewer.avatarUrl ? (
                    <AvatarImage src={r.reviewer.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback>
                    {(r.reviewer.displayName ?? "?").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.reviewer.displayName ?? "ผู้รีวิว"}</p>
                  <p className="text-muted-foreground text-sm">
                    ให้คะแนน {r.rating}/5
                    <span className="text-muted-foreground/70 ml-2 text-xs">
                      {r.createdAt.toLocaleDateString()}
                    </span>
                  </p>
                  {r.comment ? <p className="mt-1 text-sm">{r.comment}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
