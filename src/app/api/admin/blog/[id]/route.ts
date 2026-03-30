import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { BlogCategory } from "@/generated/prisma/client";

const BLOG_CATEGORY_MAP: Record<string, BlogCategory> = {
  "market-analysis": BlogCategory.MARKET_ANALYSIS,
  "set-review": BlogCategory.SET_REVIEW,
  tips: BlogCategory.TIPS,
  news: BlogCategory.NEWS,
};

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  if (!(await checkIsAdmin())) {
    return unauthorized();
  }

  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = await parseJsonBody<{
    title: string; slug: string; excerpt: string; content: string;
    coverImage?: string; category?: string; tags?: string[]; published?: boolean;
  }>(req);
  if (!parsed.ok) return parsed.response;

  const { title, slug, excerpt, content, coverImage, category, tags, published } = parsed.body;

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const wasPublished = existing.published;
  const nowPublished = !!published;

  const blogCategory = category ? BLOG_CATEGORY_MAP[category as string] : undefined;

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt,
      content,
      coverImage: coverImage || null,
      ...(blogCategory && { category: blogCategory }),
      tags: Array.isArray(tags) ? tags : [],
      published: nowPublished,
      publishedAt:
        nowPublished && !wasPublished
          ? new Date()
          : nowPublished
            ? existing.publishedAt
            : null,
    },
  });

  return NextResponse.json({ id: post.id });
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  if (!(await checkIsAdmin())) {
    return unauthorized();
  }

  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
