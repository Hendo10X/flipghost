import { ImageResponse } from "next/og"

import {
  Canvas,
  OG_CONTENT_TYPE,
  OG_SIZE,
  ogFonts,
  Wordmark,
} from "@/lib/og"

export const alt = "Flipghost — flipbook animation in your browser"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * The home preview is the wordmark and nothing else. No tagline, no
 * screenshot, no gradient: a link preview is glanced at, and the one thing
 * worth carrying at that size is whose link it is.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <Canvas>
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wordmark size={72} />
        </div>
      </Canvas>
    ),
    { ...size, fonts: await ogFonts() }
  )
}
