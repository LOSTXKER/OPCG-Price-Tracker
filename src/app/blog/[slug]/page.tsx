import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Eye, Tag } from "lucide-react";
import { cache } from "react";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, blogPostingJsonLd } from "@/lib/seo/json-ld";
import { RelatedPages } from "@/components/shared/related-pages";
import { prisma } from "@/lib/db";
import { Layers, TrendingUp, Store, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const getPost = cache(async (slug: string) => {
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { displayName: true, avatarUrl: true } } },
  });
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
    { href: "/trending", icon: TrendingUp, title: "Trending", description: "การ์ดที่ราคาขยับมากที่สุด" },
    { href: "/market-overview", icon: Layers, title: "Market Overview", description: "สถิติตลาดภาพรวม" },
  ],
  SET_REVIEW: [
    { href: "/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
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
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title },
        ]}
      />

      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            บทความทั้งหมด
          </Link>

          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
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
              priority
            />
          </div>
        )}

        <div
          className="prose prose-sm prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <div className="mx-auto max-w-3xl mt-8">
        <RelatedPages title="เพิ่มเติม" items={relatedCtas} />
      </div>
    </>
  );
}
