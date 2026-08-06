import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getDrawnRaffles, groupRafflesByMonth } from "@/lib/honey/raffle-winners";
import { SEO_PAGE_META } from "@/lib/seo/copy/site";
import { WinnersList } from "./winners-list";

export const revalidate = 3600;

export const metadata = buildPageMetadata({
  title: SEO_PAGE_META.raffleWinners.title,
  description: SEO_PAGE_META.raffleWinners.description,
  canonical: "/raffle/winners",
});

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
      <LocalizedBreadcrumb
        items={[{ labelKey: "home", href: "/" }, { labelKey: "winnersPageTitle" }]}
      />
      <WinnersList groups={grouped} />
    </>
  );
}
