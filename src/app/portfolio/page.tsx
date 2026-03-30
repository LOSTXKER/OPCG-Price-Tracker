import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import PortfolioClient from "./portfolio-client";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Manage your OPCG card collection. Track portfolio value, view allocation charts and monitor performance over time.",
  robots: { index: false },
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Portfolio" }]} />
      <PortfolioClient />
    </>
  );
}
