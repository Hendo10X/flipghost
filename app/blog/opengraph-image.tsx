import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { pageOgImage } from "@/lib/og-page"

export const alt = "Flipghost blog"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * Without this the section inherits the root preview, so a link to the blog
 * looks exactly like a link to the home page.
 */
export default async function Image() {
  return pageOgImage({
    eyebrow: "Blog",
    title: "Notes from inside the workshop",
  })
}
