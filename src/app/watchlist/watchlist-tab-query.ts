export type WatchlistTab = "cards" | "alerts";

export function getWatchlistTab(params: Pick<URLSearchParams, "get">): WatchlistTab {
  return params.get("tab") === "alerts" ? "alerts" : "cards";
}

export function buildWatchlistTabHref(
  pathname: string,
  currentParams: Pick<URLSearchParams, "toString">,
  tab: WatchlistTab,
): string {
  const nextParams = new URLSearchParams(currentParams.toString());
  if (tab === "alerts") nextParams.set("tab", "alerts");
  else nextParams.delete("tab");

  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
