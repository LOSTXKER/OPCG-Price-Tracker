"use client";

import { useEffect, useRef } from "react";

import { apiPost, apiTry } from "@/lib/api/client";

export function ViewTracker({ listingId }: { listingId: number }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void apiTry(apiPost(`/api/listings/${listingId}/view`));
  }, [listingId]);

  return null;
}
