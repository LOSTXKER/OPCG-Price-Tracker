"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost, apiTry } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

interface SaveButtonProps {
  listingId: number;
  initialSaved: boolean;
  className?: string;
}

export function SaveButton({ listingId, initialSaved, className }: SaveButtonProps) {
  const lang = useUIStore((s) => s.language);
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const data = await apiTry(apiPost<{ saved: boolean }>(`/api/listings/${listingId}/save`));
      if (data) setSaved(data.saved);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      disabled={loading}
      className={cn("shrink-0", className)}
      aria-label={saved ? t(lang, "mktSaveRemoveAria") : t(lang, "mktSaveAddAria")}
    >
      <Bookmark
        className={cn(
          "size-5 transition-colors",
          saved ? "fill-primary text-primary" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
