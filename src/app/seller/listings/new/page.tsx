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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ApiError, apiGet, apiPost } from "@/lib/api/client";
import { DEFAULT_CARD_CONDITION } from "@/lib/constants/ui";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export default function SellerCreateListingPage() {
  const lang = useUIStore((s) => s.language);
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
      const searchJson = await apiGet<{
        cards: { id: number; cardCode: string }[];
      }>(
        `/api/cards?search=${encodeURIComponent(selectedCard.cardCode)}&limit=40`
      );
      const codeUp = selectedCard.cardCode.trim().toUpperCase();
      const card = searchJson.cards?.find(
        (c) => c.cardCode.toUpperCase() === codeUp
      );
      if (!card) {
        setError("ไม่พบการ์ดนี้ในระบบ");
        setSubmitting(false);
        return;
      }

      const body = await apiPost<{ listing?: { id: number } }>("/api/listings", {
        cardId: card.id,
        priceJpy: pricing.priceJpy,
        condition: pricing.condition,
        quantity: pricing.quantity,
        description: shipping.description.trim() || null,
        shipping: shipping.shipping,
        location: shipping.location,
        photos: shipping.photos,
      });

      if (body.listing) {
        router.push(`/marketplace/${body.listing.id}`);
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "ลงประกาศไม่สำเร็จ");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedCard, pricing, shipping, router]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "sellerListNewTitle")}
        description={t(lang, "sellerListNewDesc")}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/seller/listings" />}>
            {t(lang, "cancel")}
          </Button>
        }
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

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
