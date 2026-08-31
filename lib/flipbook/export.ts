import type { AudioTrack, Frame } from "./store"

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

/** The only background this app draws on. Keeps the colour in one place. */
const PAPER = "#ffffff"

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
      ctx.fillStyle = PAPER
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
  onProgress: OnProgress,
  transparent = false
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
    gif.writeFrame(index, width, height, {
      palette,
      delay,
      // gifenc's 1-bit alpha: any pixel in the palette matching
      // `transparentIndex` is treated as fully transparent. Index 0 is the
      // white paper the opaque render painted, so a transparent GIF keys that
      // colour out.
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

/**
 * MP4 (H.264) is, by spec, opaque: yuv420p has no alpha channel, so the
 * "transparent background" toggle is ignored for MP4. GIF is where a
 * transparent export actually lands.
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
  onProgress: OnProgress,
  audioTrack?: AudioTrack | null
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

    const ffmpegArgs: string[] = [
      "-framerate",
      String(fps),
      "-i",
      "frame%04d.png",
    ]

    const hasAudio = Boolean(audioTrack && !audioTrack.muted && audioTrack.dataUrl)
    if (hasAudio && audioTrack) {
      try {
        const audioBlob = await (await fetch(audioTrack.dataUrl)).blob()
        await ffmpeg.writeFile("input_audio", await fetchFile(audioBlob))

        if (audioTrack.offset > 0) {
          ffmpegArgs.push("-ss", String(audioTrack.offset))
        }
        // Honour the right-edge trim: read only the trimmed length so the
        // exported audio matches what plays in the editor.
        if (audioTrack.trimDuration && audioTrack.trimDuration > 0) {
          ffmpegArgs.push("-t", String(audioTrack.trimDuration))
        }
        if (audioTrack.startFrame > 0) {
          const delaySec = audioTrack.startFrame / fps
          ffmpegArgs.push("-itsoffset", String(delaySec))
        }
        ffmpegArgs.push("-i", "input_audio")
      } catch (err) {
        console.warn("Could not write audio to ffmpeg:", err)
      }
    }

    const totalDurationSec = frames.length / fps

    ffmpegArgs.push(
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-t",
      String(totalDurationSec)
    )

    if (hasAudio) {
      ffmpegArgs.push("-c:a", "aac", "-b:a", "192k")
    }

    ffmpegArgs.push("-movflags", "+faststart", "out.mp4")

    await ffmpeg.exec(ffmpegArgs)

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
