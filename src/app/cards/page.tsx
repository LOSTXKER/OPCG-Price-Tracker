import { redirect } from "next/navigation";

/**
 * Legacy `/cards` → the market lives on the home page now. A `?search=` from an
 * old link goes to /search (the home page no longer reads searchParams so it can
 * stay statically rendered); everything else just lands on home.
 */
export default async function CardsRedirect(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const rawSearch = sp.search;
  const search = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;
  redirect(search ? `/search?q=${encodeURIComponent(search)}` : "/");
}
