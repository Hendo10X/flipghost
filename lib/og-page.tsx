import { ImageResponse } from "next/og"

import { Canvas, OG_COLORS, OG_SIZE, ogFonts, Wordmark } from "@/lib/og"

/**
 * Every preview that is not the home page: an eyebrow, a title, and the
 * wordmark sitting quietly at the bottom. The title is the only thing sized to
 * be read; everything else is there to say where the link goes.
 *
 * Titles are clamped rather than shrunk to fit. Type that changes size with
 * its content makes the set look accidental, and a long title that has to be
 * cut was too long for a preview anyway.
 */
export async function pageOgImage({
  title,
  eyebrow,
}: {
  title: string
  eyebrow?: string
}) {
  return new ImageResponse(
    (
      <Canvas>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            justifyContent: "space-between",
            // Roughly the site's px-6 scaled to this canvas.
            padding: 72,
          }}
        >
          {eyebrow ? (
            <span
              style={{
                fontFamily: "Momo Trust Display",
                fontSize: 24,
                color: OG_COLORS.MUTED,
              }}
            >
              {eyebrow}
            </span>
          ) : (
            <span />
          )}

          <span
            style={{
              fontFamily: "Momo Trust Display",
              fontSize: 60,
              lineHeight: 1.1,
              letterSpacing: -1.2,
              color: OG_COLORS.FOREGROUND,
              maxWidth: 900,
              // Three lines and an ellipsis. A hard cut mid-sentence reads as
              // a broken image; an ellipsis reads as a title that was too long,
              // which is the truth. Satori only honours lineClamp on a block —
              // it checks `display === "block"` before applying it — so this is
              // load-bearing rather than a default.
              display: "block",
              lineClamp: 3,
            }}
          >
            {title}
          </span>

          <Wordmark size={28} />
        </div>
      </Canvas>
    ),
    { ...OG_SIZE, fonts: await ogFonts() }
  )
}
