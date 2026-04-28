"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { AdminFormField, AdminCheckboxField } from "@/components/admin/admin-form-field";
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

const FORM_ID = "admin-blog-form";

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
  const initialState: PostData =
    initial ?? {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "news",
      tags: "",
      published: false,
    };
  const [form, setForm] = useState<PostData>(initialState);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const isEdit = initial?.id != null;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialState);

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
    <AdminPage
      header={
        <AdminPageHeader
          title={
            isEdit ? `แก้ไข: ${initial?.title ?? "บทความ"}` : "สร้างบทความใหม่"
          }
          description={isEdit ? "ปรับปรุงเนื้อหาและสถานะการเผยแพร่" : "เขียนบทความใหม่และเผยแพร่ในระบบ"}
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="size-4" />
                กลับ
              </Button>
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
            </div>
          }
        />
      }
      footer={
        <AdminSaveBar
          dirty={dirty || !isEdit}
          saving={isPending}
          onSave={() => {
            const formEl = document.getElementById(
              FORM_ID,
            ) as HTMLFormElement | null;
            formEl?.requestSubmit();
          }}
          saveLabel={isEdit ? "อัปเดต" : "สร้าง"}
          description={
            error ? (
              <span className="text-danger">{error}</span>
            ) : undefined
          }
        />
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl space-y-6"
      >
        {error && (
          <div className="status-danger rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className={cn("grid gap-6", showPreview && "lg:grid-cols-2")}>
          <div className="space-y-6">
            <AdminPanel title="ข้อมูลหลัก">
              <div className="space-y-4">
                <AdminFormField label="ชื่อเรื่อง" required>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="พิมพ์ชื่อบทความ..."
                  />
                </AdminFormField>

                <AdminFormField label="สลัก (slug)" required>
                  <Input
                    required
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    className="font-mono text-sm"
                  />
                </AdminFormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminFormField label="หมวดหมู่">
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v ?? f.category }))
                      }
                    >
                      <SelectTrigger>
                        <span
                          data-slot="select-value"
                          className="flex flex-1 text-left"
                        >
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
                  </AdminFormField>

                  <AdminFormField label="แท็ก (คั่นด้วย ,)">
                    <Input
                      placeholder="OP13, SEC, price-drop"
                      value={form.tags}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tags: e.target.value }))
                      }
                    />
                  </AdminFormField>
                </div>

                <AdminFormField label="URL รูปหน้าปก">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.coverImage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coverImage: e.target.value }))
                    }
                  />
                </AdminFormField>
              </div>
            </AdminPanel>

            <AdminPanel title="เนื้อหา">
              <div className="space-y-4">
                <AdminFormField label="บทคัดย่อ" required>
                  <Textarea
                    required
                    rows={2}
                    value={form.excerpt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, excerpt: e.target.value }))
                    }
                    placeholder="เขียนบทคัดย่อสั้นๆ..."
                  />
                </AdminFormField>

                <AdminFormField label="เนื้อหา (HTML)" required>
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
                </AdminFormField>
              </div>
            </AdminPanel>

            <div className="flex items-center gap-4">
              <AdminCheckboxField
                label="เผยแพร่บทความ"
                checked={form.published}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    published: (e.target as HTMLInputElement).checked,
                  }))
                }
              />
            </div>
          </div>

          {showPreview && (
            <AdminPanel
              title="ตัวอย่าง"
              className="sticky top-6 h-fit"
            >
              <article className="prose prose-sm dark:prose-invert max-w-none">
                <h1>{form.title || "ชื่อเรื่อง"}</h1>
                {form.excerpt && (
                  <p className="lead text-muted-foreground">
                    {form.excerpt}
                  </p>
                )}
                <div
                  dangerouslySetInnerHTML={{
                    __html: form.content || "<p>เนื้อหาจะแสดงที่นี่...</p>",
                  }}
                />
              </article>
            </AdminPanel>
          )}
        </div>
      </form>
    </AdminPage>
  );
}
