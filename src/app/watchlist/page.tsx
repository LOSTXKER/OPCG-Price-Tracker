import type { Metadata } from "next";
import { Suspense } from "react";
import WatchlistTabs from "./watchlist-tabs";

export const metadata: Metadata = {
  title: "Watchlist",
  description:
    "Track your favourite OPCG cards in one place. Monitor price changes and get notified when prices move.",
  robots: { index: false },
  alternates: { canonical: "/watchlist" },
};

export default function WatchlistPage() {
  return (
    <Suspense fallback={null}>
      <WatchlistTabs />
    </Suspense>
  );
}
