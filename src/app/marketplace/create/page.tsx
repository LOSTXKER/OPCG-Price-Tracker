"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ListingForm, type ListingFormData } from "@/components/marketplace/listing-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CreateListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ListingFormData) => {
    setError(null);
    setLoading(true);
    try {
      const searchRes = await fetch(
        `/api/cards?search=${encodeURIComponent(data.cardCode)}&limit=40`
      );
      if (!searchRes.ok) throw new Error("ค้นหาการ์ดไม่สำเร็จ");
      const searchJson = (await searchRes.json()) as {
        cards: { id: number; cardCode: string }[];
      };
      const codeUp = data.cardCode.trim().toUpperCase();
      const card = searchJson.cards?.find((c) => c.cardCode.toUpperCase() === codeUp);
      if (!card) {
        setError("ไม่พบการ์ดในระบบ กรุณาเลือกจากรายการค้นหา");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          priceJpy: data.priceJpy,
          condition: data.condition,
          quantity: data.quantity,
          description: data.description.trim() || null,
          shipping: data.shipping,
          location: data.location,
        }),
      });
      const body = (await res.json()) as { listing?: { id: number }; error?: string };
      if (!res.ok) {
        setError(body.error ?? "สร้างรายการไม่สำเร็จ");
        setLoading(false);
        return;
      }
      if (body.listing) {
        router.push(`/marketplace/${body.listing.id}`);
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ลงขายการ์ด</h1>
          <p className="text-muted-foreground text-sm">กรอกข้อมูลรายการขายของคุณ</p>
        </div>
        <Link
          href="/marketplace"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ยกเลิก
        </Link>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <ListingForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  );
}
