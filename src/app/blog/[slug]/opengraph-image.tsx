import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const alt = "Blog Post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function BlogOG(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true, category: true },
  });

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
            background: "#0f0f23",
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
          background:
            "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
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
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: "white" }}>
              M
            </span>
          </div>
          <span style={{ fontSize: 22, color: "#94a3b8", fontWeight: 600 }}>
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
            color: "#a5b4fc",
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
