import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye, EyeOff, Pencil, FileText, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Blog Posts — Admin" };

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
        title="Blog Posts"
        icon={FileText}
        badge={
          posts.length > 0 ? (
            <Badge variant="secondary">{posts.length} posts</Badge>
          ) : undefined
        }
        actions={
          <Button render={<Link href="/admin/blog/new" />} size="sm">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        }
      />

      {tableError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 py-12">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div className="text-center">
            <p className="font-medium text-amber-600 dark:text-amber-400">Blog table not available</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The blog database table may not have been created yet. Run migrations to set it up.
            </p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <AdminEmptyState
          icon={FileText}
          title="No blog posts yet"
          description="Create your first blog post to get started"
          action={
            <Button render={<Link href="/admin/blog/new" />} size="sm">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Views</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Updated</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border/20 transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        /blog/{post.slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[11px]">{post.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-500">
                        <Eye className="size-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="size-3" /> Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {post.viewCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {post.updatedAt.toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="xs" render={<Link href={`/admin/blog/${post.id}`} />}>
                      <Pencil className="size-3" /> Edit
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
