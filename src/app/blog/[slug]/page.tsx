import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, Eye, Tag } from "lucide-react";
import { cache } from "react";

import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { BackButton } from "@/components/shared/back-button";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, blogPostingJsonLd } from "@/lib/seo/json-ld";
import { RelatedPages } from "@/components/shared/related-pages";
import { prisma } from "@/lib/db";
import { isMissingTableError } from "@/lib/db-errors";
import { Layers, TrendingUp, Store, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const getPost = cache(async (slug: string) => {
  try {
    return await prisma.blogPost.findUnique({
      where: { slug, published: true },
      include: { author: { select: { displayName: true, avatarUrl: true } } },
    });
  } catch (error) {
    // Blog is an optional surface in local/preview environments created before
    // its table existed. Treat only that known state like an empty collection;
    // real database failures must still reach the error boundary.
    if (isMissingTableError(error)) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

const CATEGORY_CTA: Record<
  string,
  { href: string; icon: typeof Layers; title: string; description: string }[]
> = {
  MARKET_ANALYSIS: [
    { href: "/opcg/trending", icon: TrendingUp, title: "Trending", description: "การ์ดที่ราคาขยับมากที่สุด" },
    { href: "/opcg/market-overview", icon: Layers, title: "Market Overview", description: "สถิติตลาดภาพรวม" },
  ],
  SET_REVIEW: [
    { href: "/opcg/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
  ],
  TIPS: [
    { href: "/guide", icon: BookOpen, title: "คู่มือ OPCG", description: "เรียนรู้เกมตั้งแต่เริ่มต้น" },
  ],
  NEWS: [
    { href: "/", icon: TrendingUp, title: "ตลาดราคา", description: "ดูราคาการ์ดอัปเดตทุกวัน" },
    { href: "/marketplace", icon: Store, title: "Marketplace", description: "ซื้อขายการ์ด" },
  ],
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  const relatedCtas = CATEGORY_CTA[post.category] ?? CATEGORY_CTA.NEWS;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title, href: `/blog/${post.slug}` },
        ])}
      />
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          authorName: post.author?.displayName ?? null,
        })}
      />
      <LocalizedBreadcrumb
        items={[
          { labelKey: "home", href: "/" },
          { labelKey: "blogPageTitle", href: "/blog" },
          { label: post.title },
        ]}
        hideMobileBack
      />

      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <BackButton href="/blog" label="Blog" className="mt-1 shrink-0 md:hidden" />
            <h1 className="text-h1 break-words leading-tight">
              {post.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-meta">
            {post.author && (
              <span>{post.author.displayName ?? "Meecard"}</span>
            )}
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" />
                {post.publishedAt.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" />
              {(post.viewCount + 1).toLocaleString()} views
            </span>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-meta"
                >
                  <Tag className="size-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.coverImage && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              preload
            />
          </div>
        )}

        <div
          className="prose prose-neutral dark:prose-invert max-w-none overflow-x-auto break-words [overflow-wrap:anywhere] [&_img]:max-w-full [&_table]:block [&_table]:overflow-x-auto [&_pre]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <div className="mx-auto max-w-3xl mt-8">
        <RelatedPages title="เพิ่มเติม" items={relatedCtas} />
      </div>
    </>
  );
}
