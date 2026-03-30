import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import WatchlistClient from "./watchlist-client";

export const metadata: Metadata = {
  title: "Watchlist",
  description:
    "Track your favourite OPCG cards in one place. Monitor price changes and get notified when prices move.",
  robots: { index: false },
  alternates: { canonical: "/watchlist" },
};

export default function WatchlistPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Watchlist" }]} />
      <WatchlistClient />
    </>
  );
}
