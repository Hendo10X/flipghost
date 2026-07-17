import { pageOgImage } from "@/lib/og-page"
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { getPost, MARBLE_CATEGORY } from "@/lib/marble"

export const alt = "Flipghost tutorials"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(MARBLE_CATEGORY.tutorials, slug)
  return pageOgImage({ eyebrow: "Tutorials", title: post?.title ?? "Tutorials" })
}
