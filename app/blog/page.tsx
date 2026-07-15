import type { Metadata } from "next"

import { WritingIndex } from "@/components/marble/writing-index"
import { getPosts, MARBLE_CATEGORY } from "@/lib/marble"

export const metadata: Metadata = {
  title: "Blog | Flipghost",
  description:
    "Notes from inside the workshop: craft, engineering, and the decisions behind how Flipghost works.",
}

export default async function BlogPage() {
  const posts = await getPosts(MARBLE_CATEGORY.blog)

  return (
    <WritingIndex
      eyebrow="Blog"
      title="Notes from inside the workshop"
      description="A slow blog about frame by frame animation and the software built to serve it. Written when there is something worth saying, which is less often than a content calendar would like."
      posts={posts}
      basePath="/blog"
      emptyMessage="Nothing published yet. When the first post lands it will be linked from the changelog, which is currently the most reliable way to tell that anything happened at all."
    />
  )
}
