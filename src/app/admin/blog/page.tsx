import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye, EyeOff, Pencil, FileText, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "บล็อก — แอดมิน" };

export default async function AdminBlogPage() {
  let posts: {
    id: number;
    title: string;
    slug: string;
    category: string;
    published: boolean;
    publishedAt: Date | null;
    viewCount: number;
    updatedAt: Date;
  }[] = [];
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
    <div className="space-y-6">
      <AdminPageHeader
        title="บทความ"
        description="จัดการบทความและเนื้อหาบนเว็บไซต์"
        icon={FileText}
        badge={
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

      {tableError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 py-12">
          <AlertTriangle className="size-8 text-amber-500" />
          <div className="text-center">
            <p className="font-medium text-amber-600 dark:text-amber-400">
              ตารางบล็อกไม่พร้อมใช้งาน
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
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
        <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
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
                  className="border-b border-border/10 transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-meta">
                        /blog/{post.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-500">
                        <Eye className="size-3" /> เผยแพร่แล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-meta">
                        <EyeOff className="size-3" /> ฉบับร่าง
                      </span>
                    )}
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
        </div>
      )}
    </div>
  );
}
