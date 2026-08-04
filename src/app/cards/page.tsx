import { permanentRedirect } from "next/navigation";

/**
 * Legacy `/cards` → the market lives on the home page now. A `?search=` from an
 * old link goes to /search (the home page no longer reads searchParams so it can
 * stay statically rendered); everything else just lands on home.
 *
 * Permanent (308) so inbound links to the pre-namespace URL consolidate onto
 * the destination instead of being re-crawled forever.
 */
export default async function CardsRedirect(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const rawSearch = sp.search;
  const search = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;
  permanentRedirect(search ? `/search?q=${encodeURIComponent(search)}` : "/");
}
