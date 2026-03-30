import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { getAdminUser } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/db";
import { BlogCategory } from "@/generated/prisma/client";

const BLOG_CATEGORY_MAP: Record<string, BlogCategory> = {
  "market-analysis": BlogCategory.MARKET_ANALYSIS,
  "set-review": BlogCategory.SET_REVIEW,
  tips: BlogCategory.TIPS,
  news: BlogCategory.NEWS,
};

export async function POST(req: NextRequest) {
  if (!(await checkIsAdmin())) {
    return unauthorized();
  }

  const parsed = await parseJsonBody<{
    title: string; slug: string; excerpt: string; content: string;
    coverImage?: string; category: string; tags?: string[]; published?: boolean;
  }>(req);
  if (!parsed.ok) return parsed.response;

  const { title, slug, excerpt, content, coverImage, category, tags, published } = parsed.body;

  const blogCategory = BLOG_CATEGORY_MAP[category as string];
  if (!title || !slug || !excerpt || !content || !blogCategory) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = await getAdminUser();
  if (!admin) {
    return unauthorized();
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      coverImage: coverImage || null,
      category: blogCategory,
      tags: Array.isArray(tags) ? tags : [],
      published: !!published,
      publishedAt: published ? new Date() : null,
      authorId: admin.id,
    },
  });

  return NextResponse.json({ id: post.id }, { status: 201 });
}
