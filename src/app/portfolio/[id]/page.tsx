import type { Metadata } from "next";
import PortfolioDetailClient from "./portfolio-detail-client";

export const metadata: Metadata = {
  title: "Portfolio",
  robots: { index: false },
};

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortfolioDetailClient portfolioId={Number(id)} />;
}
