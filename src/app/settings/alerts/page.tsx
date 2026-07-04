import { redirect } from "next/navigation";

// Price alerts moved out of Settings — they now live as a tab on /watchlist,
// next to the cards they fire on. Keep this route as a redirect so old
// bookmarks / external links land on the new tab instead of 404-ing. (Live
// in-app nav points straight at /watchlist?tab=alerts, so this path is only
// hit by stale links. A fully flash-free 307 would need a middleware rule.)
export default function SettingsAlertsPage() {
  redirect("/watchlist?tab=alerts");
}
