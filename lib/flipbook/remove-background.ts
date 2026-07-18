/**
 * Pure helper for removing a known background colour from a canvas, with a
 * soft alpha fade over a tolerance band so anti-aliased stroke edges don't
 * snap to a hard mask. Lives next to the other flipbook helpers because
 * export-only code shouldn't pollute `lib/flipbook/export.ts` with algorithm
 * details, and because it's the one piece of this feature that benefits from
 * being independently testable.
 *
 * Distance metric is Euclidean in sRGB. Good enough for "remove this solid
 * background" — perceptual colour spaces (LAB, OKLab) only matter when the
 * background sits near the strokes in chroma, which is a problem a painting
 * app doesn't really have.
 */

export const DEFAULT_BG_TOLERANCE = 32
export const DEFAULT_BG_SOFTNESS = 16

export interface RemoveBackgroundOptions {
  /** Any CSS colour string the browser can parse: "#fff", "#ffffff", "rgb(255,255,255)". */
  background: string
  /** Pixels with distance below this are fully transparent. 0..255 per channel. */
  tolerance?: number
  /** Width of the linear alpha ramp on top of `tolerance`. 0..255 per channel. */
  softness?: number
}

/**
 * Resolves a CSS colour string to a [r, g, b] tuple by painting it into a
 * 1x1 canvas. The browser does the parsing (and accepts the same shapes
 * `style.background = ...` does), so callers don't have to.
 */
function parseColor(input: string): [number, number, number] {
  const swatch = document.createElement("canvas")
  swatch.width = 1
  swatch.height = 1
  const ctx = swatch.getContext("2d")!
  ctx.fillStyle = input
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

/**
 * Returns a new canvas where pixels matching `background` (within `tolerance`,
 * with a soft alpha fade over `softness`) are made transparent. The source
 * canvas is never mutated — callers can hand in the per-frame canvas from
 * `renderFrames` without worrying about corrupting the timeline.
 */
export function removeBackground(
  source: HTMLCanvasElement,
  options: RemoveBackgroundOptions
): HTMLCanvasElement {
  const tolerance = options.tolerance ?? DEFAULT_BG_TOLERANCE
  const softness = options.softness ?? DEFAULT_BG_SOFTNESS
  const [br, bg, bb] = parseColor(options.background)

  const out = document.createElement("canvas")
  out.width = source.width
  out.height = source.height
  const outCtx = out.getContext("2d")!

  const srcCtx = source.getContext("2d")!
  const image = srcCtx.getImageData(0, 0, source.width, source.height)
  const data = image.data

  // Single pass: scale each channel's delta by the same factor so the alpha
  // ramp depends on Euclidean distance, not a max-of-channels hack. Pixels
  // already transparent stay transparent — there's no point matching them
  // against the background colour.
  const innerSq = tolerance * tolerance
  const outerSq = (tolerance + softness) * (tolerance + softness)

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a === 0) continue

    const dr = data[i] - br
    const dg = data[i + 1] - bg
    const db = data[i + 2] - bb
    const distSq = dr * dr + dg * dg + db * db

    if (distSq <= innerSq) {
      data[i + 3] = 0
    } else if (distSq < outerSq && softness > 0) {
      // Linear ramp from opaque to transparent across the softness band.
      const t = (Math.sqrt(distSq) - tolerance) / softness
      data[i + 3] = Math.round(a * (1 - t))
    }
  }

  outCtx.putImageData(image, 0, 0)
  return out
}
