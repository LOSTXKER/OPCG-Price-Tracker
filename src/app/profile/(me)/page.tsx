"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?redirect=/settings");
        return;
      }
      fetch("/api/me")
        .then((r) => r.json())
        .then((json: { user?: { id: string } }) => {
          if (json.user?.id) {
            router.replace(`/profile/${json.user.id}`);
          } else {
            router.replace("/login");
          }
        })
        .catch(() => router.replace("/login"));
    });
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
