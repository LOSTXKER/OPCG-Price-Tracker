"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "sonner";

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
      const data = await apiPost<{ saved: boolean }>(
        `/api/listings/${listingId}/save`,
      );
      setSaved(data.saved);
    } catch {
      toast.error(t(lang, "saveFailed"));
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
          "size-5 motion-base",
          saved ? "fill-primary text-primary" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
