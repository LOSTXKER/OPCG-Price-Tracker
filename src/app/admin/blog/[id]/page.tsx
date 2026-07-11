import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isMissingTableError } from "@/lib/db-errors";
import { BlogCategory } from "@/generated/prisma/client";
import { BlogForm } from "../blog-form";

const CATEGORY_TO_SLUG: Record<BlogCategory, string> = {
  [BlogCategory.MARKET_ANALYSIS]: "market-analysis",
  [BlogCategory.SET_REVIEW]: "set-review",
  [BlogCategory.TIPS]: "tips",
  [BlogCategory.NEWS]: "news",
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขบทความ — แอดมิน" };

export default async function EditBlogPostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const post = await prisma.blogPost.findUnique({ where: { id } }).catch((error) => {
    if (isMissingTableError(error)) redirect("/admin/blog");
    throw error;
  });
  if (!post) notFound();

  return (
    <BlogForm
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage ?? "",
        category: CATEGORY_TO_SLUG[post.category],
        tags: post.tags.join(", "),
        published: post.published,
      }}
    />
  );
}
