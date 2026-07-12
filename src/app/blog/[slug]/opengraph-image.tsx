import { ImageResponse } from "next/og";
import { BRAND_SURFACE } from "@/lib/constants/brand";
import { prisma } from "@/lib/db";
import { isMissingTableError } from "@/lib/db-errors";

export const alt = "Blog Post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOG(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug, published: true },
      select: { title: true, excerpt: true, category: true },
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1C1C1E",
            color: "white",
            fontSize: 48,
          }}
        >
          Post not found
        </div>
      ),
      { ...size },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#1C1C1E",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BRAND_SURFACE,
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: "white" }}>
              M
            </span>
          </div>
          <span style={{ fontSize: 22, color: "#B09A88", fontWeight: 600 }}>
            Meecard Blog
          </span>
        </div>

        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          {post.title}
        </span>

        <span
          style={{
            fontSize: 22,
            color: "#C49A70",
            marginTop: 24,
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          {post.excerpt}
        </span>
      </div>
    ),
    { ...size },
  );
}
