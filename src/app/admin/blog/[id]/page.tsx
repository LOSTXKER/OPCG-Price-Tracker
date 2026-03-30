import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BlogCategory } from "@/generated/prisma/client";
import { BlogForm } from "../blog-form";

const CATEGORY_TO_SLUG: Record<BlogCategory, string> = {
  [BlogCategory.MARKET_ANALYSIS]: "market-analysis",
  [BlogCategory.SET_REVIEW]: "set-review",
  [BlogCategory.TIPS]: "tips",
  [BlogCategory.NEWS]: "news",
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit Blog Post — Admin" };

export default async function EditBlogPostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Edit: {post.title}</h1>
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
    </div>
  );
}
