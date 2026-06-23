"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { ApiError, apiDelete, apiForm } from "@/lib/api/client";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ProfileCover } from "./public/profile-cover";
import type { DbUser } from "./profile-types";

type AccountCoverImageProps = {
  user: DbUser;
  lang: Language;
  onUserUpdate: (user: DbUser) => void;
};

/**
 * Maximum dimensions we keep after the client-side downscale step. The cover
 * photo only ever renders inside a ~1024px-wide container, so anything larger
 * than 1600px is wasted bandwidth + storage. We resize before upload so the
 * user never has to think about file size, and so the round-trip on slow
 * mobile connections stays fast.
 *
 * 6 MB is the server-side hard cap (`/api/me/cover/route.ts`) — we keep the
 * client cap a bit lower so we can give a helpful "image too large" message
 * before the request fires.
 */
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const TARGET_WIDTH = 1600;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Downscale an image File using a canvas, preserving aspect ratio while
 * fitting inside `TARGET_WIDTH × TARGET_HEIGHT`. Returns a JPEG Blob (with a
 * filename) so the upload payload is small and predictable.
 *
 * Falls back to the original file if the browser can't decode it (e.g. exotic
 * formats) — the server still validates size + mime, so this is purely a
 * "make it nicer when we can" optimisation.
 */
async function prepareCoverFile(file: File): Promise<File> {
  if (typeof window === "undefined" || !ACCEPTED_TYPES.includes(file.type)) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      TARGET_WIDTH / bitmap.width,
      // We don't enforce TARGET_HEIGHT directly because the cover container
      // is wider than it is tall — capping width keeps the natural aspect
      // ratio while keeping payloads small.
      1,
    );
    if (scale >= 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close?.();
      return file;
    }
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
    );
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export function AccountCoverImage({
  user,
  lang,
  onUserUpdate,
}: AccountCoverImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: "saved" }
    | { kind: "error"; message: string }
    | null
  >(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback(
    (next: { kind: "saved" } | { kind: "error"; message: string }) => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setFeedback(next);
      flashTimer.current = setTimeout(() => setFeedback(null), 3000);
    },
    [],
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith("image/")) {
        return t(lang, "coverErrorNotImage");
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return t(lang, "coverErrorBadFormat");
      }
      if (file.size > MAX_INPUT_BYTES) {
        return t(lang, "coverErrorTooLarge");
      }
      return null;
    },
    [lang],
  );

  const upload = useCallback(
    async (rawFile: File) => {
      const validationError = validateFile(rawFile);
      if (validationError) {
        showFeedback({ kind: "error", message: validationError });
        return;
      }
      setUploading(true);
      try {
        const file = await prepareCoverFile(rawFile);
        const form = new FormData();
        form.append("file", file);
        const json = await apiForm<{ user: DbUser }>("/api/me/cover", form);
        onUserUpdate(json.user);
        showFeedback({ kind: "saved" });
      } catch (err) {
        showFeedback({
          kind: "error",
          message: err instanceof ApiError ? err.message : t(lang, "coverUploadFailed"),
        });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [lang, onUserUpdate, showFeedback, validateFile],
  );

  const remove = useCallback(async () => {
    if (!user.coverImageUrl || removing) return;
    setRemoving(true);
    try {
      const json = await apiDelete<{ user: DbUser }>("/api/me/cover");
      onUserUpdate(json.user);
      showFeedback({ kind: "saved" });
    } catch (err) {
      showFeedback({
        kind: "error",
        message: err instanceof ApiError ? err.message : t(lang, "saveFailed"),
      });
    } finally {
      setRemoving(false);
    }
  }, [lang, onUserUpdate, removing, showFeedback, user.coverImageUrl]);

  const onPick = () => {
    if (uploading || removing) return;
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading || removing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const busy = uploading || removing;
  const hasCover = !!user.coverImageUrl;

  return (
    <Card>
      <CardHeader
        eyebrow={t(lang, "coverEyebrow")}
        title={t(lang, "coverTitle")}
        subtitle={t(lang, "coverSubtitle")}
        feedback={<Feedback feedback={feedback} lang={lang} />}
      />

      <div className="px-5 pb-5">
        <div
          role="button"
          tabIndex={0}
          aria-label={t(lang, hasCover ? "coverReplace" : "coverUpload")}
          aria-disabled={busy}
          onClick={onPick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPick();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            "ease-chrome group relative w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            dragActive
              ? "border-primary bg-primary/[0.06]"
              : "border-[var(--p-hair)] hover:border-border",
            busy && "cursor-progress",
            !busy && "cursor-pointer",
          )}
        >
          <ProfileCover
            userId={user.id}
            coverImageUrl={user.coverImageUrl ?? null}
            className="!rounded-none"
          />

          {/* Hover/empty-state overlay — visible when there's no cover, or on
              hover/drag when there is one. Keeps the affordance discoverable
              without permanently dimming the live preview. */}
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center transition-opacity",
              hasCover
                ? "bg-background/55 opacity-0 backdrop-blur-[1px] group-hover:opacity-100"
                : "bg-background/35 opacity-100",
              dragActive && "opacity-100",
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="size-5 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {t(lang, "coverUploading")}
                </p>
              </>
            ) : (
              <>
                <span
                  className={cn(
                    "ease-chrome flex size-9 items-center justify-center rounded-full transition-colors",
                    dragActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/90 text-foreground",
                  )}
                >
                  {hasCover ? (
                    <Upload className="size-4" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                </span>
                <p className="text-sm font-medium">
                  {t(
                    lang,
                    hasCover
                      ? "coverDropHintReplace"
                      : "coverDropHintEmpty",
                  )}
                </p>
                <p className="text-meta">{t(lang, "coverFileHint")}</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            disabled={busy}
            onChange={onFileChange}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta">{t(lang, "coverRecommendedSize")}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPick}
              disabled={busy}
              className={cn(
                "ease-chrome inline-flex items-center gap-1.5 rounded-lg border border-[var(--p-hair)] bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {t(lang, hasCover ? "coverReplace" : "coverUpload")}
            </button>
            {hasCover ? (
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy}
                className={cn(
                  "ease-chrome inline-flex items-center gap-1.5 rounded-lg border border-[var(--p-hair)] bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {removing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                {t(lang, "coverRemove")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── Building blocks (mirrors AccountPrivacySection's Card/CardHeader) ── */

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--p-hair)] bg-card">
      {children}
    </div>
  );
}

function CardHeader({
  eyebrow,
  title,
  subtitle,
  feedback,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  feedback?: ReactNode;
}) {
  return (
    <div className="px-5 pb-3 pt-4">
      {eyebrow ? (
        <p className="text-eyebrow text-muted-foreground/70">{eyebrow}</p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h3 className="text-h5">{title}</h3>
        {feedback}
      </div>
      {subtitle ? <p className="mt-1 text-meta">{subtitle}</p> : null}
    </div>
  );
}

function Feedback({
  feedback,
  lang,
}: {
  feedback: { kind: "saved" } | { kind: "error"; message: string } | null;
  lang: Language;
}) {
  if (!feedback) return null;
  if (feedback.kind === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive animate-in fade-in zoom-in-95">
        <CircleAlert className="size-3" />
        {feedback.message}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in-95">
      <CircleCheck className="size-3" />
      {t(lang, "saved")}
    </span>
  );
}
