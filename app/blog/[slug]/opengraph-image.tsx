import { pageOgImage } from "@/lib/og-page"
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { getPost, MARBLE_CATEGORY } from "@/lib/marble"

export const alt = "Flipghost blog"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(MARBLE_CATEGORY.blog, slug)
  // getPost never throws; a missing key or a dead CMS lands here, and a
  // preview with the section name still beats a broken image.
  return pageOgImage({ eyebrow: "Blog", title: post?.title ?? "Blog" })
}
