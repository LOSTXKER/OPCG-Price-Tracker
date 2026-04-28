import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getDrawnRaffles, groupRafflesByMonth } from "@/lib/honey/raffle-winners";
import { WinnersList } from "./winners-list";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Prize Winners — Monthly Raffle Announcements",
  description:
    "Public archive of monthly raffle winners on Meecard. Browse past prize draws, see who won, and verify the results for full transparency.",
  alternates: { canonical: "/raffle/winners" },
  openGraph: {
    title: "Prize Winners — Monthly Raffle Announcements | Meecard",
    description:
      "Public archive of monthly raffle winners on Meecard. Browse past prize draws and verify the results.",
    type: "website",
  },
};

export default async function RaffleWinnersPage() {
  const drawn = await getDrawnRaffles({ limit: 60 });
  const grouped = groupRafflesByMonth(drawn);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Prize Winners", href: "/raffle/winners" },
        ])}
      />
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Prize Winners" }]}
      />
      <WinnersList groups={grouped} />
    </>
  );
}
