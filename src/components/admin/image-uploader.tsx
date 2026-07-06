"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { adminForm } from "@/lib/admin/admin-fetch";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
  folder = "general",
  className,
  height = "h-32",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  height?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("รองรับเฉพาะไฟล์รูปภาพ");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("ขนาดไฟล์สูงสุด 5MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const data = await adminForm<{ url?: string }>("/api/admin/upload", formData);
        if (data.url) {
          onChange(data.url);
        } else {
          setError("อัปโหลดไม่สำเร็จ");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = "";
    },
    [upload],
  );

  if (value) {
    return (
      <div className={cn("group relative overflow-hidden rounded-lg border", height, className)}>
        <img
          src={value}
          alt="รูปที่อัปโหลด"
          className="size-full object-contain"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <Upload className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg bg-red-500/30 p-2 text-white backdrop-blur-sm transition-colors hover:bg-red-500/50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
          height,
          dragOver
            ? "border-primary bg-primary/5"
            : "border-hair hover:border-primary/40 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <span className="text-meta">กำลังอัปโหลด...</span>
          </>
        ) : (
          <>
            <ImagePlus className="size-6 text-muted-foreground/50" />
            <span className="text-meta">
              ลากวางหรือคลิกเพื่ออัปโหลด
            </span>
            <span className="text-meta text-muted-foreground/50">
              PNG, JPG, WebP (สูงสุด 5MB)
            </span>
          </>
        )}
      </button>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
