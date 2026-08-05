import { removeBackground } from "./remove-background"
import type { Frame } from "./store"

export type ExportFormat = "gif" | "mp4" | "apng"

export interface ExportSize {
  width: number
  height: number
}

export interface ExportProgress {
  /** 0..1 across the whole export. */
  value: number
  stage: "rendering" | "encoding"
}

type OnProgress = (progress: ExportProgress) => void

/**
 * `opaque` reproduces the old white-fill behaviour (1-bit GIF and the legacy
 * export). `alpha` skips the fill and lets Fabric's transparent canvas carry
 * through, which is what APNG and WebP need. Both modes iterate the full
 * timeline on a cloned StaticCanvas; the live editor canvas is never touched.
 */
type RenderMode = "opaque" | "alpha"

/** The only background this app draws on. Keeps the colour in one place. */
const PAPER = "#ffffff"

async function renderFrames(
  frames: Frame[],
  { width, height }: ExportSize,
  onProgress: OnProgress,
  mode: RenderMode = "opaque"
): Promise<HTMLCanvasElement[]> {
  const { StaticCanvas } = await import("fabric")
  const stage = new StaticCanvas(undefined, { width, height })
  const rendered: HTMLCanvasElement[] = []

  try {
    for (let i = 0; i < frames.length; i++) {
      stage.clear()
      if (frames[i].json) {
        await stage.loadFromJSON(frames[i].json as object)
      }
      stage.renderAll()
      const layer = stage.toCanvasElement(1)

      const out = document.createElement("canvas")
      out.width = width
      out.height = height
      const ctx = out.getContext("2d")!
      if (mode === "opaque") {
        ctx.fillStyle = PAPER
        ctx.fillRect(0, 0, width, height)
      }
      ctx.drawImage(layer, 0, 0, width, height)
      rendered.push(out)
      onProgress({ value: ((i + 1) / frames.length) * 0.5, stage: "rendering" })
    }
  } finally {
    stage.dispose()
  }
  return rendered
}

export async function exportGif(
  frames: Frame[],
  fps: number,
  size: ExportSize,
  onProgress: OnProgress,
  transparent = false
): Promise<Blob> {
  const [{ GIFEncoder, quantize, applyPalette }, canvases] = await Promise.all([
    import("gifenc"),
    renderFrames(frames, size, onProgress, "opaque"),
  ])

  const gif = GIFEncoder()
  const delay = Math.round(1000 / fps)

  for (let i = 0; i < canvases.length; i++) {
    const ctx = canvases[i].getContext("2d")!
    const { data, width, height } = ctx.getImageData(
      0,
      0,
      size.width,
      size.height
    )
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, width, height, {
      palette,
      delay,
      // gifenc's 1-bit alpha: any pixel in the palette matching
      // `transparentIndex` is treated as fully transparent. We reserved index
      // 0 for white above; the user-visible background colour on the GIF
      // path is white because `mode: "opaque"` already painted it.
      transparent,
      transparentIndex: 0,
    })
    onProgress({
      value: 0.5 + ((i + 1) / canvases.length) * 0.5,
      stage: "encoding",
    })
  }

  gif.finish()
  return new Blob([gif.bytesView() as BufferSource], { type: "image/gif" })
}

export async function exportApng(
  frames: Frame[],
  fps: number,
  size: ExportSize,
  onProgress: OnProgress,
  transparent = false
): Promise<Blob> {
  // upng-js ships as CommonJS (`module.exports = UPNG`), so under our ESM
  // bundler the actual API lands on the default export. Destructuring the
  // namespace directly yields `undefined` and the encode call below throws.
  const upngMod = await import("upng-js")
  const UPNG = upngMod.default
  const canvases = await renderFrames(frames, size, onProgress, "alpha")

  // The renderer left the paper colour in the alpha channel. The user
  // toggled "transparent background", so soft-fade the paper out before
  // encoding — strokes stay, paper goes.
  const stripped = transparent
    ? canvases.map((canvas) => removeBackground(canvas, { background: PAPER }))
    : canvases

  const delay = Math.round(1000 / fps)
  // upng-js wants ArrayBuffer of raw RGBA bytes, not ImageData. Copy each
  // frame's pixels into a freshly-allocated buffer because getImageData()
  // returns a Uint8ClampedArray view onto the canvas's backing store, which
  // UPNG.encode will read later — if a subsequent iteration mutates the
  // canvas, the buffer would change underneath it.
  const buffers: ArrayBuffer[] = stripped.map((canvas) => {
    const ctx = canvas.getContext("2d")!
    const { data } = ctx.getImageData(0, 0, size.width, size.height)
    const out = new ArrayBuffer(data.byteLength)
    new Uint8Array(out).set(data)
    return out
  })
  const delays = new Array<number>(canvases.length).fill(delay)

  onProgress({ value: 0.6, stage: "encoding" })

  // cnum = 0 disables palette quantisation so alpha is preserved losslessly.
  const tab = UPNG.encode(buffers, size.width, size.height, 0, delays, {
    loop: 0,
  })

  onProgress({ value: 0.95, stage: "encoding" })

  return new Blob([tab], { type: "image/apng" })
}

/**
 * MP4 (H.264) is, by spec, opaque: yuv420p has no alpha channel, so
 * "transparent background" is meaningless here. We always render with the
 * white paper fill, same as GIF. The Transparent toggle in the popover is
 * intentionally a no-op on this branch — the popover copy makes that clear
 * so users reach for APNG when they actually want alpha.
 */
const FFMPEG_CORE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd"

async function loadFFmpeg() {
  const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ])
  const instance = new FFmpeg()
  let coreURL: string
  let wasmURL: string
  try {
    // toBlobURL fetches the core scripts from the CDN. A "Failed to fetch"
    // here is almost always environmental (offline, CSP, ad-blocker, mixed
    // content) — surface that explicitly so the UI can show it as such
    // instead of the generic "MP4 export failed".
    ;[coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${FFMPEG_CORE}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${FFMPEG_CORE}/ffmpeg-core.wasm`, "application/wasm"),
    ])
  } catch (err) {
    throw new Error(
      `Could not load the MP4 encoder from ${FFMPEG_CORE}. ` +
        "Check your network connection, browser extensions, or CSP. " +
        `(${err instanceof Error ? err.message : String(err)})`
    )
  }
  await instance.load({ coreURL, wasmURL })
  return { instance, fetchFile }
}

export async function exportMp4(
  frames: Frame[],
  fps: number,
  size: ExportSize,
  onProgress: OnProgress
): Promise<Blob> {
  // Fetching the ffmpeg core (~30MB) and rendering frames are independent.
  const [{ instance: ffmpeg, fetchFile }, canvases] = await Promise.all([
    loadFFmpeg(),
    renderFrames(frames, size, (p) =>
      onProgress({ value: p.value * 0.6, stage: "rendering" })
    ),
  ])

  ffmpeg.on("progress", ({ progress }) => {
    onProgress({
      value: 0.7 + Math.min(Math.max(progress, 0), 1) * 0.3,
      stage: "encoding",
    })
  })

  try {
    for (let i = 0; i < canvases.length; i++) {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvases[i].toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/png"
        )
      )
      const name = `frame${String(i).padStart(4, "0")}.png`
      await ffmpeg.writeFile(name, await fetchFile(blob))
      onProgress({
        value: 0.6 + ((i + 1) / canvases.length) * 0.1,
        stage: "encoding",
      })
    }

    await ffmpeg.exec([
      "-framerate",
      String(fps),
      "-i",
      "frame%04d.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      // libx264 + yuv420p require even dimensions.
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-movflags",
      "+faststart",
      "out.mp4",
    ])

    const data = await ffmpeg.readFile("out.mp4")
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data
    return new Blob([bytes as BlobPart], { type: "video/mp4" })
  } finally {
    ffmpeg.terminate()
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
