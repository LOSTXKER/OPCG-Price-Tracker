import type { Metadata } from "next";
import { ImageMatchClient } from "./image-match-client";

export const metadata: Metadata = {
  title: "Image Matching — Admin",
};

export const dynamic = "force-dynamic";

export default function ImageMatchingPage() {
  return <ImageMatchClient />;
}
