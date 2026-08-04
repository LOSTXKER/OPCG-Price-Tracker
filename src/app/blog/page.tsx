import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Calendar, Eye, Layers, TrendingUp } from "lucide-react";

import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { prisma } from "@/lib/db";
import { Surface } from "@/components/ui/surface";
import { RelatedPages } from "@/components/shared/related-pages";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  SEO_PAGE_META,
  buildBlogIntro,
  buildBlogRelated,
} from "@/lib/seo/copy/site";
import { BlogEmptyState } from "./blog-empty-state";
import { BlogPageHeader } from "./blog-page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SEO_PAGE_META.blog.title,
  description: SEO_PAGE_META.blog.description,
  alternates: { canonical: "/blog" },
};

const RELATED_ICONS: Record<string, typeof TrendingUp> = {
  "/opcg/trending": TrendingUp,
  "/opcg/sets": Layers,
  "/guide": BookOpen,
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

  const lang = await getServerLanguage();
  const intro = buildBlogIntro(lang);
  const related = buildBlogRelated(lang).map((item) => ({
    ...item,
    icon: RELATED_ICONS[item.href] ?? BookOpen,
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
        ])}
      />
      {/* ItemList only describes posts that actually exist — an empty list
          would be a structured-data lie on a blog with no articles yet. */}
      {posts.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            SEO_PAGE_META.blog.title,
            posts.map((post) => ({ name: post.title, url: `/blog/${post.slug}`, image: post.coverImage })),
          )}
        />
      )}
      <div className="space-y-8">
        <BlogPageHeader />

        <div className="max-w-3xl space-y-2">
          {intro.map((paragraph) => (
            <p key={paragraph} className="text-body-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>

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
                  <p className="line-clamp-2 text-body-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-meta">
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

        <RelatedPages items={related} />
      </div>
    </>
  );
}
