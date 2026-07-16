import { ImageResponse } from "next/og"

import { Ghost, OG_COLORS } from "@/lib/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/**
 * The home-screen icon. Unlike icon.svg this cannot follow the reader's theme
 * and cannot be transparent — iOS composites it onto its own tile and masks
 * the corners itself, so the square is full bleed and the corners are left
 * alone. White on the app's dark background reads on any wallpaper.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: OG_COLORS.BACKGROUND,
        }}
      >
        <Ghost size={116} color={OG_COLORS.FOREGROUND} />
      </div>
    ),
    size
  )
}
