import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { pageOgImage } from "@/lib/og-page"

export const alt = "Flipghost tutorials"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return pageOgImage({
    eyebrow: "Tutorials",
    title: "Learn to animate twelve frames at a time",
  })
}
