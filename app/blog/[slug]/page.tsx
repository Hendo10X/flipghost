import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Article } from "@/components/marble/article"
import { getPost, MARBLE_CATEGORY } from "@/lib/marble"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(MARBLE_CATEGORY.blog, slug)
  if (!post) return { title: "Post not found | Flipghost" }

  return {
    title: `${post.title} | Flipghost`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      // The key is omitted, not set to undefined. Next decides whether to use
      // opengraph-image.tsx with hasOwnProperty("images"), so `images: undefined`
      // still counts as "this page brought its own" and throws the generated
      // card away — leaving a post with no cover image with no preview at all.
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(MARBLE_CATEGORY.blog, slug)
  if (!post) notFound()

  return <Article post={post} backHref="/blog" backLabel="Blog" />
}
