import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og"
import { pageOgImage } from "@/lib/og-page"

export const alt = "Flipghost changelog"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return pageOgImage({
    eyebrow: "Changelog",
    title: "Every change, written down",
  })
}
