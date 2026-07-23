import type { Layer } from "./store"

export interface RasterSize {
  width: number
  height: number
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = dataUrl
  })
}

/**
 * Composites one or more transparent PNG snapshots into a single data URL.
 * Used for layer stacks, onion skins, exports, and project thumbnails.
 */
export async function compositeDataUrls(
  dataUrls: Array<string | null | undefined>,
  { width, height }: RasterSize,
  backgroundColor: string | null = null
): Promise<string | null> {
  const urls = dataUrls.filter((url): url is string => Boolean(url))
  if (urls.length === 0 && backgroundColor === null) return null

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  if (backgroundColor !== null) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
  }

  for (const dataUrl of urls) {
    try {
      const img = await loadImage(dataUrl)
      ctx.drawImage(img, 0, 0, width, height)
    } catch {
      // Skip broken snapshots; one bad layer should not blank the stack.
    }
  }

  return canvas.toDataURL("image/png")
}

export async function compositeLayerFrameDataUrls(
  layers: Layer[],
  frameIndex: number,
  size: RasterSize,
  options?: {
    excludeLayerId?: string
    backgroundColor?: string | null
  }
): Promise<string | null> {
  const { excludeLayerId = null, backgroundColor = null } = options ?? {}
  const dataUrls = layers
    .filter((layer) => layer.visible && layer.id !== excludeLayerId)
    .map((layer) => layer.frames[frameIndex]?.dataUrl ?? null)
  return compositeDataUrls(dataUrls, size, backgroundColor)
}
