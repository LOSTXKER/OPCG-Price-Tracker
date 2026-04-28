"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, Save, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BLOG_CATEGORY_LABELS: Record<string, string> = {
  "market-analysis": "วิเคราะห์ตลาด",
  "set-review": "รีวิวชุด",
  tips: "เคล็ดลับ",
  news: "ข่าวสาร",
};

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
  const [showPreview, setShowPreview] = useState(false);

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
          throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
        }
        router.push("/admin/blog");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-h1">
            {isEdit ? "แก้ไขบทความ" : "สร้างบทความใหม่"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {showPreview ? "ซ่อนตัวอย่าง" : "ดูตัวอย่าง"}
          </Button>
          <Button type="submit" disabled={isPending} size="sm">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isPending ? "กำลังบันทึก..." : isEdit ? "อัปเดต" : "สร้าง"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className={cn("grid gap-6", showPreview && "lg:grid-cols-2")}>
        {/* Form Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">ข้อมูลหลัก</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ชื่อเรื่อง</label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="พิมพ์ชื่อบทความ..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">หมวดหมู่</label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v ?? f.category }))
                    }
                  >
                    <SelectTrigger>
                      <span data-slot="select-value" className="flex flex-1 text-left">
                        {BLOG_CATEGORY_LABELS[form.category] ?? form.category}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market-analysis">
                        วิเคราะห์ตลาด
                      </SelectItem>
                      <SelectItem value="set-review">รีวิวชุด</SelectItem>
                      <SelectItem value="tips">เคล็ดลับ</SelectItem>
                      <SelectItem value="news">ข่าวสาร</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    แท็ก (คั่นด้วย ,)
                  </label>
                  <Input
                    placeholder="OP13, SEC, price-drop"
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">URL รูปหน้าปก</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.coverImage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coverImage: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">เนื้อหา</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">บทคัดย่อ</label>
                <Textarea
                  required
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, excerpt: e.target.value }))
                  }
                  placeholder="เขียนบทคัดย่อสั้นๆ..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">เนื้อหา (HTML)</label>
                <Textarea
                  required
                  rows={16}
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  className="font-mono text-xs"
                  placeholder="<p>เนื้อหาบทความ...</p>"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, published: e.target.checked }))
                }
                className="size-4 rounded border-border accent-primary"
              />
              เผยแพร่บทความ
            </label>
          </div>
        </div>

        {/* Preview Column */}
        {showPreview && (
          <Card className="sticky top-6 h-fit">
            <CardHeader className="border-b">
              <CardTitle className="text-base">ตัวอย่าง</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="prose prose-sm dark:prose-invert max-w-none">
                <h1>{form.title || "ชื่อเรื่อง"}</h1>
                {form.excerpt && (
                  <p className="lead text-muted-foreground">{form.excerpt}</p>
                )}
                <div
                  dangerouslySetInnerHTML={{
                    __html: form.content || "<p>เนื้อหาจะแสดงที่นี่...</p>",
                  }}
                />
              </article>
            </CardContent>
          </Card>
        )}
      </div>
    </form>
  );
}
