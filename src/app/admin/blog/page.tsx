import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye, EyeOff, Pencil, FileText, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "บล็อก — แอดมิน" };

type BlogPostRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  publishedAt: Date | null;
  viewCount: number;
  updatedAt: Date;
};

function PublishStatus({ published }: { published: boolean }) {
  return published ? (
    <AdminStatusBadge tone="success" icon={<Eye className="size-3" />}>
      เผยแพร่แล้ว
    </AdminStatusBadge>
  ) : (
    <AdminStatusBadge tone="neutral" icon={<EyeOff className="size-3" />}>
      ฉบับร่าง
    </AdminStatusBadge>
  );
}

export default async function AdminBlogPage() {
  let posts: BlogPostRow[] = [];
  let tableError = false;

  try {
    posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        published: true,
        publishedAt: true,
        viewCount: true,
        updatedAt: true,
      },
    });
  } catch {
    tableError = true;
  }

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="บทความ"
          description="จัดการบทความและเนื้อหาบนเว็บไซต์"
          icon={FileText}
          meta={
            posts.length > 0 ? (
              <Badge variant="secondary">{posts.length} บทความ</Badge>
            ) : undefined
          }
          actions={
            <Button render={<Link href="/admin/blog/new" />} size="sm">
              <Plus className="size-4" />
              สร้างบทความ
            </Button>
          }
        />
      }
    >
      {tableError ? (
        <div className="status-warning flex flex-col items-center gap-3 rounded-xl border border-warning/30 py-12">
          <AlertTriangle className="size-8" />
          <div className="text-center">
            <p className="font-medium">ตารางบล็อกไม่พร้อมใช้งาน</p>
            <p className="text-meta mt-1 text-warning/80">
              อาจยังไม่ได้สร้างตารางในฐานข้อมูล กรุณารัน migration
            </p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="ยังไม่มีบทความ"
          description="สร้างบทความแรกของคุณ"
          action={
            <Button render={<Link href="/admin/blog/new" />} size="sm">
              <Plus className="size-4" />
              สร้างบทความ
            </Button>
          }
        />
      ) : (
        <Surface variant="outline" className="sm:overflow-x-auto">
          {/* Desktop table */}
          <table className="hidden w-full text-sm sm:table">
            <thead>
              <tr className="border-b border-[var(--p-hair)] bg-muted/30">
                <th className="px-4 py-2.5 text-left text-eyebrow text-muted-foreground/70">
                  ชื่อเรื่อง
                </th>
                <th className="px-4 py-2.5 text-left text-eyebrow text-muted-foreground/70">
                  หมวดหมู่
                </th>
                <th className="px-4 py-2.5 text-center text-eyebrow text-muted-foreground/70">
                  สถานะ
                </th>
                <th className="px-4 py-2.5 text-right text-eyebrow text-muted-foreground/70">
                  ยอดดู
                </th>
                <th className="px-4 py-2.5 text-right text-eyebrow text-muted-foreground/70">
                  อัปเดต
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[var(--p-hair)] transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-meta">/blog/{post.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PublishStatus published={post.published} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {post.viewCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-meta">
                    {post.updatedAt.toLocaleDateString("th-TH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      render={<Link href={`/admin/blog/${post.id}`} />}
                    >
                      <Pencil className="size-3" /> แก้ไข
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list fallback */}
          <ul className="divide-y divide-[var(--p-hair)] sm:hidden">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="flex flex-col gap-2 px-4 py-3 transition-colors active:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{post.title}</p>
                      <p className="text-meta truncate">/blog/{post.slug}</p>
                    </div>
                    <PublishStatus published={post.published} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-meta">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span>{post.viewCount.toLocaleString()} ครั้ง</span>
                      <span>
                        {post.updatedAt.toLocaleDateString("th-TH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </AdminPage>
  );
}
