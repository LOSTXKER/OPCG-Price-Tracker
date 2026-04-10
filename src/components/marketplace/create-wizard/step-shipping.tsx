"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ImagePlus, X, Loader2 } from "lucide-react";

const SHIPPING_OPTIONS = [
  "EMS/Kerry",
  "Pickup (นัดรับ)",
  "Registered mail (ลงทะเบียน)",
  "J&T Express",
  "Flash Express",
] as const;

const LOCATIONS = [
  "กรุงเทพมหานคร",
  "เชียงใหม่",
  "ชลบุรี",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "อื่น ๆ",
] as const;

const MAX_PHOTOS = 5;

export interface ShippingData {
  shipping: string[];
  location: string;
  description: string;
  photos: string[];
}

interface StepShippingProps {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepShipping({
  data,
  onChange,
  onBack,
  onNext,
}: StepShippingProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const update = (partial: Partial<ShippingData>) =>
    onChange({ ...data, ...partial });

  const toggleShipping = (opt: string) => {
    const next = data.shipping.includes(opt)
      ? data.shipping.filter((s) => s !== opt)
      : [...data.shipping, opt];
    update({ shipping: next });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const remaining = MAX_PHOTOS - data.photos.length;
    if (remaining <= 0) {
      setUploadError(`อัปโหลดได้สูงสุด ${MAX_PHOTOS} รูป`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          setUploadError("ไฟล์ใหญ่เกิน 5MB");
          continue;
        }

        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/listings/upload", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setUploadError(body.error ?? "อัปโหลดไม่สำเร็จ");
          continue;
        }

        const { url } = (await res.json()) as { url: string };
        urls.push(url);
      }

      if (urls.length > 0) {
        update({ photos: [...data.photos, ...urls] });
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    update({ photos: data.photos.filter((_, i) => i !== index) });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const isValid = data.location.trim().length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">การจัดส่งและรายละเอียด</h2>
        <p className="text-sm text-muted-foreground">
          ระบุวิธีจัดส่ง พื้นที่ และภาพสินค้าจริง
        </p>
      </div>

      {/* Shipping methods */}
      <div className="space-y-2">
        <label className="text-sm font-medium">วิธีจัดส่ง</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SHIPPING_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleShipping(opt)}
              className={cn(
                "rounded-lg border p-2.5 text-xs font-medium transition-colors",
                data.shipping.includes(opt)
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium">พื้นที่</label>
        <div className="flex flex-wrap gap-1.5">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => update({ location: loc === "อื่น ๆ" ? "" : loc })}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                data.location === loc
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              )}
            >
              {loc}
            </button>
          ))}
        </div>
        <Input
          value={data.location}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="กรุงเทพมหานคร"
          className="mt-1"
        />
      </div>

      {/* Photo upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          ภาพสินค้าจริง
          <span className="text-muted-foreground ml-1 font-normal">
            (ไม่บังคับ · สูงสุด {MAX_PHOTOS} รูป)
          </span>
        </label>

        {/* Thumbnails of uploaded photos */}
        {data.photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.photos.map((url, i) => (
              <div
                key={url}
                className="group relative size-20 overflow-hidden rounded-lg border"
              >
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        {data.photos.length < MAX_PHOTOS && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
              "border-border hover:border-primary/50 hover:bg-muted/50",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            ) : (
              <ImagePlus className="text-muted-foreground size-8" />
            )}
            <div>
              <p className="text-sm font-medium">
                {uploading ? "กำลังอัปโหลด..." : "คลิกหรือลากไฟล์มาวาง"}
              </p>
              <p className="text-muted-foreground text-xs">
                JPG, PNG, WebP · ไม่เกิน 5MB ต่อรูป
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploadError && (
          <p className="text-destructive text-xs">{uploadError}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">คำอธิบายเพิ่มเติม (ไม่บังคับ)</label>
        <Textarea
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          placeholder="เช่น ซื้อมาจากร้าน... สภาพตามรูป..."
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1">
          <ChevronLeft className="size-4" />
          กลับ
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="gap-1">
          ถัดไป
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
