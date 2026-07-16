import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db";
import {
  PORTFOLIO_LAST_ACTIVE_COOKIE,
  parseLastActivePortfolioId,
} from "@/lib/portfolio/last-active";

import PortfolioClient from "./portfolio-client";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Track the value, holdings and performance of your card portfolios.",
  robots: { index: false },
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const user = await getAuthUser();
  if (!user) return <PortfolioClient mode="guest" />;

  const cookieStore = await cookies();
  const rememberedId = parseLastActivePortfolioId(
    cookieStore.get(PORTFOLIO_LAST_ACTIVE_COOKIE)?.value,
  );

  let destination = rememberedId
    ? await prisma.portfolio.findFirst({
        where: { id: rememberedId, userId: user.id },
        select: { id: true },
      })
    : null;

  if (!destination) {
    destination = await prisma.portfolio.findFirst({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: { id: true },
    });
  }

  if (destination) redirect(`/portfolio/${destination.id}`);

  return <PortfolioClient mode="empty" />;
}
