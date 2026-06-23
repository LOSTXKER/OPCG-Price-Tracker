"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Loader2, Save, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { ApiError, apiForm, apiGet, apiPatch, apiTry } from "@/lib/api/client";

type ListingData = {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  condition: string;
  quantity: number;
  description: string | null;
  photos: string[];
  shipping: string[];
  location: string | null;
  status: string;
  card: {
    id: number;
    cardCode: string;
    nameJp: string;
    nameEn: string | null;
    rarity: string;
    imageUrl: string | null;
    set: { code: string; name: string };
  };
};

const CONDITIONS = [
  { value: "NM", label: "Near Mint" },
  { value: "LP", label: "Lightly Played" },
  { value: "MP", label: "Moderately Played" },
  { value: "HP", label: "Heavily Played" },
  { value: "DMG", label: "Damaged" },
];

const SHIPPING_OPTIONS = [
  { value: "ส่งทั่วไทย (Kerry/Flash)", labelKey: "sellListingShippingNationwide" },
  { value: "EMS / ไปรษณีย์ลงทะเบียน", labelKey: "sellListingShippingEms" },
  { value: "นัดรับ กรุงเทพฯ", labelKey: "sellListingShippingPickupBkk" },
  { value: "นัดรับ ต่างจังหวัด", labelKey: "sellListingShippingPickupUpcountry" },
] as const;

export default function SellerEditListingPage() {
  const params = useParams();
  const lang = useUIStore((s) => s.language);
  const listingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [listing, setListing] = useState<ListingData | null>(null);

  // Form state
  const [priceJpy, setPriceJpy] = useState(0);
  const [priceThb, setPriceThb] = useState<string>("");
  const [condition, setCondition] = useState("NM");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [shippingMethods, setShippingMethods] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    async function loadListing() {
      try {
        const data = await apiGet<{ listings: ListingData[] }>(
          `/api/seller/listings?limit=100`
        );
        const found = data.listings.find(
          (l: ListingData) => l.id === Number(listingId)
        );
        if (!found) throw new Error("Listing not found");

        setListing(found);
        setPriceJpy(found.priceJpy);
        setPriceThb(found.priceThb != null ? String(found.priceThb) : "");
        setCondition(found.condition);
        setQuantity(found.quantity);
        setDescription(found.description ?? "");
        setLocation(found.location ?? "");
        setShippingMethods(found.shipping ?? []);
        setPhotos(found.photos ?? []);
      } catch (e) {
        setError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : t(lang, "sellListingLoadError")
        );
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [listingId, lang]);

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        if (photos.length >= 5) break;
        const formData = new FormData();
        formData.append("file", file);
        const data = await apiTry(
          apiForm<{ url?: string }>("/api/listings/upload", formData),
        );
        if (data?.url) {
          const url = data.url;
          setPhotos((prev) => [...prev, url]);
        }
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = useCallback(async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        priceJpy,
        condition,
        quantity,
        description: description.trim() || null,
        location: location.trim() || null,
        shipping: shippingMethods,
        photos,
      };

      const thbValue = parseFloat(priceThb);
      if (!isNaN(thbValue) && thbValue > 0) {
        body.priceThb = thbValue;
      } else {
        body.priceThb = null;
      }

      await apiPatch(`/api/listings/${listingId}`, body);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.message ?? t(lang, "sellListingSaveFailed"))
          : t(lang, "sellListingGenericError")
      );
    } finally {
      setSaving(false);
    }
  }, [priceJpy, priceThb, condition, quantity, description, location, shippingMethods, photos, listingId, lang]);

  if (loading) {
    return <LoadingState variant="spinner" />;
  }

  if (error && !listing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link href="/seller/listings" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t(lang, "sellListingBack")}
        </Button>
        <EmptyState variant="error" icon={Package} title={error} />
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "sellerEditTitle")}
        description={`#${listing.id} • ${listing.card.cardCode}`}
        breadcrumb={
          <Button variant="ghost" size="sm" render={<Link href="/seller/listings" />}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t(lang, "back")}
          </Button>
        }
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t(lang, "save")}
          </Button>
        }
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-success">{t(lang, "sellListingSaveSuccess")}</p>
      )}

      {/* Card info (readonly) */}
      <div className="panel flex items-center gap-4 rounded-xl p-4">
        {listing.card.imageUrl ? (
          <Image
            src={listing.card.imageUrl}
            alt={listing.card.nameEn ?? listing.card.nameJp}
            width={60}
            height={84}
            className="rounded object-cover"
          />
        ) : (
          <div className="flex h-[84px] w-[60px] items-center justify-center rounded bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-semibold">
            {listing.card.nameEn ?? listing.card.nameJp}
          </p>
          <p className="text-sm text-muted-foreground">
            {listing.card.cardCode}
          </p>
          <div className="mt-1 flex gap-1.5">
            <Badge variant="secondary">{listing.card.rarity}</Badge>
            <Badge variant="secondary">{listing.card.set.name}</Badge>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="panel space-y-4 rounded-xl p-4">
        <h2 className="text-h3">{t(lang, "sellListingPriceConditionHeading")}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t(lang, "sellListingPriceJpyLabel")}</label>
            <Input
              type="number"
              min={1}
              value={priceJpy}
              onChange={(e) => setPriceJpy(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t(lang, "sellListingPriceThbLabel")}</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={priceThb}
              onChange={(e) => setPriceThb(e.target.value)}
              placeholder={t(lang, "sellListingOptional")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t(lang, "sellListingConditionLabel")}</label>
            <Select
              items={CONDITIONS}
              value={condition}
              onValueChange={(value) => setCondition(value ?? "NM")}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t(lang, "sellListingQuantityLabel")}</label>
            <Input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="panel space-y-4 rounded-xl p-4">
        <h2 className="text-h3">{t(lang, "sellListingDescriptionHeading")}</h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={t(lang, "sellListingDescriptionPlaceholder")}
          className="w-full rounded-lg border border-[var(--p-hair)] bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Photos */}
      <div className="panel space-y-4 rounded-xl p-4">
        <h2 className="text-h3">{t(lang, "sellListingPhotosHeading")}</h2>
        <div className="flex flex-wrap gap-3">
          {photos.map((url, i) => (
            <div key={i} className="group relative">
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                width={80}
                height={80}
                className="rounded-lg border border-[var(--p-hair)] object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < 5 && (
            <label className="ease-chrome flex h-[80px] w-[80px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--p-hair)] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              {uploadingPhoto ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="text-2xl">+</span>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                disabled={uploadingPhoto}
              />
            </label>
          )}
        </div>
        <p className="text-meta">
          {t(lang, "sellListingPhotosHint")}
        </p>
      </div>

      {/* Shipping */}
      <div className="panel space-y-4 rounded-xl p-4">
        <h2 className="text-h3">{t(lang, "sellListingShippingHeading")}</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">{t(lang, "sellListingLocationLabel")}</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t(lang, "sellListingLocationPlaceholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{t(lang, "sellListingShippingMethodLabel")}</label>
          <div className="space-y-2">
            {SHIPPING_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={shippingMethods.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShippingMethods((prev) => [...prev, opt.value]);
                    } else {
                      setShippingMethods((prev) =>
                        prev.filter((m) => m !== opt.value)
                      );
                    }
                  }}
                  className="rounded border-[var(--p-hair)]"
                />
                {t(lang, opt.labelKey)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom save button */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" render={<Link href="/seller/listings" />}>
          {t(lang, "sellListingCancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t(lang, "sellListingSaveChanges")}
        </Button>
      </div>
    </div>
  );
}