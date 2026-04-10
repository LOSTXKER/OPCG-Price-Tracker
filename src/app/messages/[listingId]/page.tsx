import { getAuthUser } from "@/lib/api/auth";
import { redirect } from "next/navigation";
import { ChatLayout } from "@/components/messages";

export default async function ChatPage(props: {
  params: Promise<{ listingId: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { listingId } = await props.params;
  const listingIdNum = parseInt(listingId, 10);

  if (isNaN(listingIdNum)) redirect("/messages");

  return <ChatLayout currentUserId={user.id} activeListingId={listingIdNum} />;
}
