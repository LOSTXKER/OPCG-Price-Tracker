import { getAuthUser } from "@/lib/api/auth";
import { redirect } from "next/navigation";
import { ChatLayout } from "@/components/messages";

export default async function MessagesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return <ChatLayout currentUserId={user.id} activeListingId={null} />;
}
