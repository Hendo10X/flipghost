import type { Frame } from "./store"

export type ExportFormat = "gif" | "mp4"

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
 * Renders every frame's Fabric JSON onto a white canvas at the stage's
 * logical resolution. Runs client-side only.
 */
async function renderFrames(
  frames: Frame[],
  { width, height }: ExportSize,
  onProgress: OnProgress
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
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
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
  onProgress: OnProgress
): Promise<Blob> {
  const [{ GIFEncoder, quantize, applyPalette }, canvases] = await Promise.all([
    import("gifenc"),
    renderFrames(frames, size, onProgress),
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
    gif.writeFrame(index, width, height, { palette, delay })
    onProgress({
      value: 0.5 + ((i + 1) / canvases.length) * 0.5,
      stage: "encoding",
    })
  }

  gif.finish()
  return new Blob([gif.bytesView() as BufferSource], { type: "image/gif" })
}

const FFMPEG_CORE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd"

export async function exportMp4(
  frames: Frame[],
  fps: number,
  size: ExportSize,
  onProgress: OnProgress
): Promise<Blob> {
  // Fetching the ffmpeg core (~30MB) and rendering frames are independent.
  async function loadFFmpeg() {
    const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ])
    const instance = new FFmpeg()
    const [coreURL, wasmURL] = await Promise.all([
      toBlobURL(`${FFMPEG_CORE}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${FFMPEG_CORE}/ffmpeg-core.wasm`, "application/wasm"),
    ])
    await instance.load({ coreURL, wasmURL })
    return { instance, fetchFile }
  }

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
    return new Blob([bytes as BufferSource], { type: "video/mp4" })
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
