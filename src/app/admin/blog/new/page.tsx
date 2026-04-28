import type { Metadata } from "next";
import { BlogForm } from "../blog-form";

export const metadata: Metadata = { title: "สร้างบทความใหม่ — แอดมิน" };

export default function NewBlogPostPage() {
  return <BlogForm />;
}
