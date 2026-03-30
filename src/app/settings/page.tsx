import { redirect } from "next/navigation";

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  void searchParams;
  redirect("/profile?tab=notifications");
}
