import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PortfolioDetailClient from "./portfolio-detail-client";
import { parsePortfolioRouteId } from "./portfolio-navigation";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false },
};

export default async function PortfolioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ add?: string | string[] }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const portfolioId = parsePortfolioRouteId(id);
  if (portfolioId == null) notFound();

  return (
    <PortfolioDetailClient
      portfolioId={portfolioId}
      openAddOnLoad={query.add === "1"}
    />
  );
}
