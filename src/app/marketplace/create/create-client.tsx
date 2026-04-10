"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

import {
  WizardLayout,
  StepCardSelect,
  StepPricing,
  StepShipping,
  StepPreview,
  type WizardStep,
  type SelectedCard,
  type PricingData,
  type ShippingData,
} from "@/components/marketplace/create-wizard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_CARD_CONDITION } from "@/lib/constants/ui";

export default function CreateListingClient() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("card");
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null);
  const [pricing, setPricing] = useState<PricingData>({
    priceJpy: 0,
    priceThb: null,
    condition: DEFAULT_CARD_CONDITION,
    quantity: 1,
  });
  const [shipping, setShipping] = useState<ShippingData>({
    shipping: [],
    location: "",
    description: "",
    photos: [],
  });

  const markComplete = (s: WizardStep) => {
    setCompletedSteps((prev) => new Set(prev).add(s));
  };

  const handleCardSelect = (card: SelectedCard) => {
    setSelectedCard(card);
    if (card.latestPriceJpy != null) {
      setPricing((prev) => ({ ...prev, priceJpy: card.latestPriceJpy! }));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedCard) return;
    setError(null);
    setSubmitting(true);

    try {
      const searchRes = await fetch(
        `/api/cards?search=${encodeURIComponent(selectedCard.cardCode)}&limit=40`
      );
      if (!searchRes.ok) throw new Error("Failed to search cards");
      const searchJson = (await searchRes.json()) as {
        cards: { id: number; cardCode: string }[];
      };
      const codeUp = selectedCard.cardCode.trim().toUpperCase();
      const card = searchJson.cards?.find(
        (c) => c.cardCode.toUpperCase() === codeUp
      );
      if (!card) {
        setError("ไม่พบการ์ดนี้ในระบบ");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          priceJpy: pricing.priceJpy,
          condition: pricing.condition,
          quantity: pricing.quantity,
          description: shipping.description.trim() || null,
          shipping: shipping.shipping,
          location: shipping.location,
          photos: shipping.photos,
        }),
      });

      const body = (await res.json()) as {
        listing?: { id: number };
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "ลงประกาศไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      if (body.listing) {
        router.push(`/marketplace/${body.listing.id}`);
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }, [selectedCard, pricing, shipping, router]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ลงขายการ์ด</h1>
          <p className="text-muted-foreground text-sm">
            สร้างประกาศขายการ์ดของคุณ
          </p>
        </div>
        <Link
          href="/marketplace"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ยกเลิก
        </Link>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <WizardLayout
        currentStep={step}
        onStepClick={setStep}
        completedSteps={completedSteps}
      >
        {step === "card" && (
          <StepCardSelect
            selected={selectedCard}
            onSelect={handleCardSelect}
            onNext={() => {
              markComplete("card");
              setStep("pricing");
            }}
          />
        )}

        {step === "pricing" && (
          <StepPricing
            data={pricing}
            onChange={setPricing}
            marketPriceJpy={selectedCard?.latestPriceJpy ?? null}
            marketPriceThb={selectedCard?.latestPriceThb ?? null}
            onBack={() => setStep("card")}
            onNext={() => {
              markComplete("pricing");
              setStep("shipping");
            }}
          />
        )}

        {step === "shipping" && (
          <StepShipping
            data={shipping}
            onChange={setShipping}
            onBack={() => setStep("pricing")}
            onNext={() => {
              markComplete("shipping");
              setStep("preview");
            }}
          />
        )}

        {step === "preview" && selectedCard && (
          <StepPreview
            card={selectedCard}
            pricing={pricing}
            shipping={shipping}
            onBack={() => setStep("shipping")}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            onEditStep={(s) => setStep(s)}
          />
        )}
      </WizardLayout>
    </div>
  );
}
