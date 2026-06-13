"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAuthBypassed } from "@/lib/env";
import { apiGet, apiTry } from "@/lib/api/client";

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const bypass = isAuthBypassed();

    const fetchProfile = async () => {
      const json = await apiTry(apiGet<{ user?: { id: string } }>("/api/me"));
      if (json?.user?.id) {
        router.replace(`/profile/${json.user.id}`);
      } else if (!bypass) {
        router.replace("/login");
      }
    };

    if (bypass) {
      fetchProfile();
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?redirect=/settings");
        return;
      }
      fetchProfile();
    });
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
