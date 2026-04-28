import type { Metadata } from "next";
import { BlogForm } from "../blog-form";

export const metadata: Metadata = { title: "New Blog Post — Admin" };

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1">New Blog Post</h1>
      <BlogForm />
    </div>
  );
}
