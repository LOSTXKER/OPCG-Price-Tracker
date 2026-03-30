"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type PostData = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  published: boolean;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function BlogForm({ initial }: { initial?: PostData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PostData>(
    initial ?? {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "news",
      tags: "",
      published: false,
    },
  );
  const [error, setError] = useState("");

  const isEdit = initial?.id != null;

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: isEdit ? f.slug : slugify(title),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const body = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    startTransition(async () => {
      try {
        const url = isEdit
          ? `/api/admin/blog/${initial!.id}`
          : "/api/admin/blog";
        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to save");
        }
        router.push("/admin/blog");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          required
          className={inputClass}
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Slug</label>
        <input
          type="text"
          required
          className={inputClass}
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Category</label>
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
          >
            <option value="market-analysis">Market Analysis</option>
            <option value="set-review">Set Review</option>
            <option value="tips">Tips</option>
            <option value="news">News</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tags (comma-separated)</label>
          <input
            type="text"
            className={inputClass}
            placeholder="OP13, SEC, price-drop"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cover Image URL</label>
        <input
          type="url"
          className={inputClass}
          placeholder="https://..."
          value={form.coverImage}
          onChange={(e) =>
            setForm((f) => ({ ...f, coverImage: e.target.value }))
          }
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Excerpt</label>
        <textarea
          required
          rows={2}
          className={inputClass}
          value={form.excerpt}
          onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Content (HTML)</label>
        <textarea
          required
          rows={16}
          className={`${inputClass} font-mono text-xs`}
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) =>
              setForm((f) => ({ ...f, published: e.target.checked }))
            }
            className="size-4 rounded border-border"
          />
          Published
        </label>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-border/60 px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}
