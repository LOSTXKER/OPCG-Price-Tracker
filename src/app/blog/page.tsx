import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye } from "lucide-react";

import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { Surface } from "@/components/ui/surface";
import { BlogEmptyState } from "./blog-empty-state";
import { BlogPageHeader } from "./blog-page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "OPCG market analysis, set reviews, tips and news from Meecard. Stay updated with the latest One Piece Card Game content.",
  alternates: { canonical: "/blog" },
};

const CATEGORY_LABELS: Record<string, string> = {
  MARKET_ANALYSIS: "วิเคราะห์ตลาด",
  SET_REVIEW: "รีวิวชุดการ์ด",
  TIPS: "เทคนิค",
  NEWS: "ข่าว",
};

export default async function BlogPage() {
  let posts: {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string | null;
    category: string;
    publishedAt: Date | null;
    viewCount: number;
  }[] = [];

  try {
    posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
        viewCount: true,
      },
    });
  } catch {
    // table may not exist yet
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ])}
      />
      <div className="space-y-8">
        <BlogPageHeader />

        {posts.length === 0 ? (
          <BlogEmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Surface
                key={post.id}
                as={Link}
                variant="outline"
                interactive
                href={`/blog/${post.slug}`}
                className="group overflow-hidden transition-colors"
              >
                {post.coverImage && (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-micro text-primary">
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                  </div>
                  <h2 className="break-words text-h3 leading-snug transition-colors group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-meta text-muted-foreground/60">
                    {post.publishedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {post.publishedAt.toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3" />
                      {post.viewCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
