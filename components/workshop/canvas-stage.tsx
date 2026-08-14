"use client"

import { useEffect, useRef, useState } from "react"
import type { Canvas, FabricImage as FabricImageType, TPointerEvent, TPointerEventInfo } from "fabric"
import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  getStagePreset,
  onionStepOpacity,
  SNAPSHOT_SIZE,
  useFlipbook,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/lib/flipbook/store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Padding around the stage inside the scrollable viewport (p-6 = 24px). */
const VIEWPORT_PAD = 48

/**
 * One ghosted neighbouring frame layered under the drawing surface.
 */
function OnionLayer({
  dataUrl,
  color,
  opacity,
}: {
  dataUrl: string | null
  color: string
  opacity: number
}) {
  if (!dataUrl) return null
  const mask = `url("${dataUrl}") 0 0 / 100% 100% no-repeat`
  return (
    <div
      aria-hidden
      style={{ backgroundColor: color, opacity, mask, WebkitMask: mask }}
      className="pointer-events-none absolute inset-0 select-none"
    />
  )
}

const toHex = (n: number) => n.toString(16).padStart(2, "0")

/**
 * The colour of the pixel under a pointer event, or null where there is
 * nothing drawn.
 */
function sampleColorAt(canvas: Canvas, e: TPointerEvent): string | null {
  const point = canvas.getViewportPoint(e)
  const scale = canvas.getRetinaScaling()
  const x = Math.round(point.x * scale)
  const y = Math.round(point.y * scale)

  try {
    const [r, g, b, a] = canvas.getContext().getImageData(x, y, 1, 1).data
    if (a < 16) return null
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  } catch {
    return null
  }
}

/**
 * Performs flood fill starting at pointer position
 * Returns a new offscreen canvas element with filled pixel data, or null if no change.
 */
function floodFillCanvas(
  canvas: Canvas,
  e: TPointerEvent,
  fillColorHex: string,
  stageWidth: number,
  stageHeight: number
): HTMLCanvasElement | null {
  const pointer = canvas.getScenePoint(e)
  const startX = Math.round(pointer.x)
  const startY = Math.round(pointer.y)

  if (startX < 0 || startX >= stageWidth || startY < 0 || startY >= stageHeight) return null

  const zoom = canvas.getZoom()
  const multiplier = zoom > 0 ? 1 / zoom : 1

  let renderedEl: HTMLCanvasElement
  try {
    renderedEl = canvas.toCanvasElement(multiplier)
  } catch {
    return null
  }

  const ctx = renderedEl.getContext("2d")
  if (!ctx) return null

  const width = renderedEl.width
  const height = renderedEl.height

  let imgData: ImageData
  try {
    imgData = ctx.getImageData(0, 0, width, height)
  } catch {
    return null
  }
  const data = imgData.data

  const clampedX = Math.max(0, Math.min(width - 1, Math.floor((startX / stageWidth) * width)))
  const clampedY = Math.max(0, Math.min(height - 1, Math.floor((startY / stageHeight) * height)))

  const startIndex = (clampedY * width + clampedX) * 4
  const startR = data[startIndex]
  const startG = data[startIndex + 1]
  const startB = data[startIndex + 2]
  const startA = data[startIndex + 3]

  const fillR = parseInt(fillColorHex.slice(1, 3), 16)
  const fillG = parseInt(fillColorHex.slice(3, 5), 16)
  const fillB = parseInt(fillColorHex.slice(5, 7), 16)
  const fillA = 255

  // Early exit if clicking on a pixel that already matches the fill color
  if (
    startA > 240 &&
    Math.abs(startR - fillR) < 4 &&
    Math.abs(startG - fillG) < 4 &&
    Math.abs(startB - fillB) < 4
  ) {
    return null
  }

  const isStartTransparent = startA < 16

  const colorMatch = (idx: number) => {
    const a = data[idx + 3]
    if (isStartTransparent) {
      return a < 128
    }
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]

    return (
      Math.abs(r - startR) <= 32 &&
      Math.abs(g - startG) <= 32 &&
      Math.abs(b - startB) <= 32 &&
      Math.abs(a - startA) <= 32
    )
  }

  const fillCanvas = document.createElement("canvas")
  fillCanvas.width = width
  fillCanvas.height = height
  const fillCtx = fillCanvas.getContext("2d")
  if (!fillCtx) return null

  const newImgData = fillCtx.createImageData(width, height)
  const newData = newImgData.data

  const totalPixels = width * height
  const visited = new Uint8Array(totalPixels)
  const filled = new Uint8Array(totalPixels)
  const queue = new Int32Array(totalPixels)
  let qHead = 0
  let qTail = 0

  const startPos = clampedY * width + clampedX
  queue[qTail++] = startPos
  visited[startPos] = 1

  while (qHead < qTail) {
    const pos = queue[qHead++]
    const px = pos % width
    const py = (pos / width) | 0
    const idx = pos * 4

    newData[idx] = fillR
    newData[idx + 1] = fillG
    newData[idx + 2] = fillB
    newData[idx + 3] = fillA
    filled[pos] = 1

    if (px > 0) {
      const nPos = pos - 1
      if (!visited[nPos]) {
        visited[nPos] = 1
        if (colorMatch(nPos * 4)) queue[qTail++] = nPos
      }
    }
    if (px < width - 1) {
      const nPos = pos + 1
      if (!visited[nPos]) {
        visited[nPos] = 1
        if (colorMatch(nPos * 4)) queue[qTail++] = nPos
      }
    }
    if (py > 0) {
      const nPos = pos - width
      if (!visited[nPos]) {
        visited[nPos] = 1
        if (colorMatch(nPos * 4)) queue[qTail++] = nPos
      }
    }
    if (py < height - 1) {
      const nPos = pos + width
      if (!visited[nPos]) {
        visited[nPos] = 1
        if (colorMatch(nPos * 4)) queue[qTail++] = nPos
      }
    }
  }

  if (qTail === 0) return null

  // Dilation pass to smoothly cover stroke anti-aliasing edges
  let currentBoundary: number[] = []
  for (let i = 0; i < qTail; i++) {
    currentBoundary.push(queue[i])
  }

  const DILATION_RADIUS = 3
  for (let pass = 0; pass < DILATION_RADIUS; pass++) {
    const nextBoundary: number[] = []
    for (let i = 0; i < currentBoundary.length; i++) {
      const pos = currentBoundary[i]
      const px = pos % width
      const py = (pos / width) | 0

      const ns: number[] = []
      if (px > 0) ns.push(pos - 1)
      if (px < width - 1) ns.push(pos + 1)
      if (py > 0) ns.push(pos - width)
      if (py < height - 1) ns.push(pos + width)
      if (px > 0 && py > 0) ns.push(pos - width - 1)
      if (px < width - 1 && py > 0) ns.push(pos - width + 1)
      if (px > 0 && py < height - 1) ns.push(pos + width - 1)
      if (px < width - 1 && py < height - 1) ns.push(pos + width + 1)

      for (let j = 0; j < ns.length; j++) {
        const nPos = ns[j]
        if (!filled[nPos]) {
          filled[nPos] = 1
          const nIdx = nPos * 4
          newData[nIdx] = fillR
          newData[nIdx + 1] = fillG
          newData[nIdx + 2] = fillB
          newData[nIdx + 3] = fillA
          nextBoundary.push(nPos)
        }
      }
    }
    currentBoundary = nextBoundary
  }

  fillCtx.putImageData(newImgData, 0, 0)
  return fillCanvas
}

/**
 * A ring the size of the brush, drawn white over black so it stays visible on
 * both bare paper and dark strokes. Sized in screen pixels, so it tracks zoom.
 */
function brushCursor(diameter: number) {
  const d = Math.max(4, Math.min(128, diameter))
  const size = d + 4
  const c = size / 2
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${c}" cy="${c}" r="${d / 2}" fill="none" stroke="#fff" stroke-width="2.5"/>` +
    `<circle cx="${c}" cy="${c}" r="${d / 2}" fill="none" stroke="#000" stroke-width="1"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c} ${c}, crosshair`
}

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const commitRef = useRef<(() => void) | null>(null)
  const [ready, setReady] = useState(false)
  const [container, setContainer] = useState({ width: 0, height: 0 })

  const currentId = useFlipbook((s) => s.currentId)
  const revision = useFlipbook((s) => s.revision)
  const tool = useFlipbook((s) => s.tool)
  const brushColor = useFlipbook((s) => s.brushColor)
  const brushSize = useFlipbook((s) => s.brushSize)
  const onionSkin = useFlipbook((s) => s.onionSkin)
  const onionBefore = useFlipbook((s) => s.onionBefore)
  const onionAfter = useFlipbook((s) => s.onionAfter)
  const onionOpacity = useFlipbook((s) => s.onionOpacity)
  const zoom = useFlipbook((s) => s.zoom)
  const setZoom = useFlipbook((s) => s.setZoom)
  const playing = useFlipbook((s) => s.playing)
  const fps = useFlipbook((s) => s.fps)
  const frames = useFlipbook((s) => s.frames)
  const stagePresetId = useFlipbook((s) => s.stagePresetId)
  const pendingImport = useFlipbook((s) => s.pendingImport)

  const stage = getStagePreset(stagePresetId)
  const fitScale = Math.min(
    (container.width - VIEWPORT_PAD) / stage.width,
    (container.height - VIEWPORT_PAD) / stage.height
  )
  const scale = fitScale > 0 ? fitScale * zoom : 0
  const displayWidth = Math.max(0, Math.floor(stage.width * scale) || 0)
  const displayHeight = Math.max(0, Math.floor(stage.height * scale) || 0)

  const currentIndex = frames.findIndex((f) => f.id === currentId)

  const showOnion = onionSkin && !playing && currentIndex >= 0
  const beforeFrames = showOnion
    ? frames.slice(Math.max(0, currentIndex - onionBefore), currentIndex).reverse()
    : []
  const afterFrames = showOnion
    ? frames.slice(currentIndex + 1, currentIndex + 1 + onionAfter)
    : []

  const playImgRef = useRef<HTMLImageElement>(null)

  // --- Fabric lifecycle ---
  useEffect(() => {
    let disposed = false
    let canvas: Canvas | null = null

    async function init() {
      const [{ Canvas, FabricImage }, { PressureBrush }] = await Promise.all([
        import("fabric"),
        import("@/lib/flipbook/pressure-brush"),
      ])
      if (disposed || !canvasElRef.current) return

      canvas = new Canvas(canvasElRef.current, {
        isDrawingMode: true,
        selection: false,
        perPixelTargetFind: true,
        targetFindTolerance: 12,
        enableRetinaScaling: true,
        enablePointerEvents: true,
      })
      canvas.freeDrawingBrush = new PressureBrush(canvas)
      fabricRef.current = canvas

      const commit = () => {
        if (!canvas) return
        const state = useFlipbook.getState()
        const json = canvas.toJSON() as Record<string, unknown>
        const dataUrl = canvas.toDataURL({
          format: "png",
          multiplier: SNAPSHOT_SIZE / canvas.getWidth(),
        })
        state.commitFrame(state.currentId, json, dataUrl)
      }
      commitRef.current = commit

      canvas.on("path:created", ({ path }) => {
        path.set({
          selectable: useFlipbook.getState().tool === "select",
          perPixelTargetFind: true,
        })
        commit()
      })

      canvas.on("object:modified", () => commit())

      let erasing = false
      let erasedAny = false

      const tryErase = (opt: TPointerEventInfo) => {
        if (!canvas) return
        const { target } = canvas.findTarget(opt.e)
        if (target) {
          canvas.remove(target)
          erasedAny = true
          canvas.requestRenderAll()
        }
      }

      // Eyedropper tool
      canvas.on("mouse:down", (opt) => {
        if (!canvas || useFlipbook.getState().tool !== "eyedropper") return
        const color = sampleColorAt(canvas, opt.e)
        if (color) useFlipbook.getState().setBrushColor(color)
        useFlipbook.getState().setTool("brush")
      })

      // Paint Bucket tool
      canvas.on("mouse:down", async (opt) => {
        if (!canvas || useFlipbook.getState().tool !== "bucket") return
        const state = useFlipbook.getState()
        const stagePreset = getStagePreset(state.stagePresetId)

        const filledCanvas = floodFillCanvas(
          canvas,
          opt.e,
          state.brushColor,
          stagePreset.width,
          stagePreset.height
        )

        if (filledCanvas) {
          const existingFillImages = canvas
            .getObjects()
            .filter(
              (obj) =>
                obj.isType("Image", "image") || obj.type?.toLowerCase() === "image"
            )

          const compositeCanvas = document.createElement("canvas")
          compositeCanvas.width = filledCanvas.width
          compositeCanvas.height = filledCanvas.height
          const compCtx = compositeCanvas.getContext("2d")!

          existingFillImages.forEach((imgObj) => {
            const fabricImg = imgObj as FabricImageType
            const el = fabricImg.getElement?.()
            if (el) {
              compCtx.drawImage(
                el,
                0,
                0,
                compositeCanvas.width,
                compositeCanvas.height
              )
            }
          })

          compCtx.drawImage(filledCanvas, 0, 0)

          const src = compositeCanvas.toDataURL()
          const img = new FabricImage(compositeCanvas, {
            src,
            originX: "left",
            originY: "top",
            left: 0,
            top: 0,
            scaleX: stagePreset.width / compositeCanvas.width,
            scaleY: stagePreset.height / compositeCanvas.height,
            selectable: state.tool === "select",
            perPixelTargetFind: true,
          })

          canvas.remove(...existingFillImages)
          canvas.insertAt(0, img)
          canvas.requestRenderAll()
          commit()
        }
        state.setTool("brush")
      })

      canvas.on("mouse:down", (opt) => {
        if (useFlipbook.getState().tool !== "eraser") return
        erasing = true
        erasedAny = false
        tryErase(opt)
      })
      canvas.on("mouse:move", (opt) => {
        if (erasing) tryErase(opt)
      })
      canvas.on("mouse:up", () => {
        if (erasing && erasedAny) commit()
        erasing = false
        erasedAny = false
      })

      setReady(true)
    }

    init()

    return () => {
      disposed = true
      setReady(false)
      fabricRef.current = null
      commitRef.current = null
      canvas?.dispose()
    }
  }, [])

  // --- Responsive sizing ---
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainer({
        width: Math.max(0, Math.floor(width)),
        height: Math.max(0, Math.floor(height)),
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready || displayWidth === 0 || displayHeight === 0) return
    canvas.setDimensions({ width: displayWidth, height: displayHeight })
    canvas.setZoom(displayWidth / stage.width)
    canvas.requestRenderAll()
  }, [displayWidth, displayHeight, stage.width, ready])

  // --- Zoom controls via Ctrl/Cmd + wheel ---
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const state = useFlipbook.getState()
      state.setZoom(state.zoom * Math.exp(-e.deltaY / 300))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  // --- Image insertion ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready || !pendingImport) return
    let cancelled = false

    async function place() {
      const { FabricImage } = await import("fabric")
      const image = await FabricImage.fromURL(pendingImport!)
      if (cancelled || !canvas) return
      const state = useFlipbook.getState()
      const { width: stageW, height: stageH } = getStagePreset(
        state.stagePresetId
      )
      const fit = Math.min(
        (stageW * 0.8) / (image.width || 1),
        (stageH * 0.8) / (image.height || 1),
        1
      )
      image.set({
        scaleX: fit,
        scaleY: fit,
        left: (stageW - (image.width || 0) * fit) / 2,
        top: (stageH - (image.height || 0) * fit) / 2,
        selectable: state.tool === "select",
        perPixelTargetFind: true,
      })
      canvas.add(image)
      canvas.requestRenderAll()
      commitRef.current?.()
      state.clearPendingImport()
    }

    place()
    return () => {
      cancelled = true
    }
  }, [pendingImport, ready])

  // --- Tool & brush state ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready) return
    if (tool === "brush") {
      canvas.isDrawingMode = true
      canvas.selection = false
    } else if (tool === "eraser" || tool === "eyedropper" || tool === "bucket") {
      canvas.isDrawingMode = false
      canvas.selection = false
      canvas.defaultCursor = "crosshair"
      canvas.hoverCursor = "crosshair"
    } else {
      canvas.isDrawingMode = false
      canvas.selection = true
      canvas.defaultCursor = "default"
      canvas.hoverCursor = "move"
    }
    canvas.forEachObject((obj) => {
      obj.set({ selectable: tool === "select" })
    })
    if (tool !== "select") {
      canvas.discardActiveObject()
    }
    canvas.requestRenderAll()
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor
      canvas.freeDrawingBrush.width = brushSize
    }
  }, [tool, brushColor, brushSize, ready])

  // --- Dynamic brush cursor ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready || tool !== "brush" || scale <= 0) return
    canvas.freeDrawingCursor = brushCursor(brushSize * scale)
  }, [tool, brushSize, scale, ready])

  // --- Selection keyboard navigation ---
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const canvas = fabricRef.current
      if (!canvas || !ready) return
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable=true]")) return
      if (useFlipbook.getState().tool !== "select") return

      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = canvas.getActiveObjects()
        if (selected.length === 0) return
        e.preventDefault()
        canvas.discardActiveObject()
        selected.forEach((obj) => canvas.remove(obj))
        canvas.requestRenderAll()
        commitRef.current?.()
      } else if (e.key === "Escape") {
        canvas.discardActiveObject()
        canvas.requestRenderAll()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [ready])

  // --- Frame JSON loader ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready) return

    const controller = new AbortController()

    async function load() {
      if (!canvas) return
      const state = useFlipbook.getState()
      const frame = state.frames.find((f) => f.id === state.currentId)
      canvas.clear()
      if (frame?.json) {
        try {
          await canvas.loadFromJSON(frame.json as object, undefined, {
            signal: controller.signal,
          })
        } catch {
          return
        }
        canvas.forEachObject((obj) => {
          obj.set({
            selectable: state.tool === "select",
            perPixelTargetFind: true,
          })
        })
      }
      canvas.requestRenderAll()
      if (frame && frame.dataUrl === null && frame.json !== null) {
        state.setFrameSnapshot(
          frame.id,
          canvas.toDataURL({
            format: "png",
            multiplier: SNAPSHOT_SIZE / canvas.getWidth(),
          })
        )
      }
    }

    load()
    return () => {
      controller.abort()
    }
  }, [currentId, revision, ready])

  // --- Playback loop ---
  useEffect(() => {
    if (!playing) return
    const state = useFlipbook.getState()
    let index = Math.max(
      0,
      state.frames.findIndex((f) => f.id === state.currentId)
    )

    const render = () => {
      const img = playImgRef.current
      if (!img) return
      const currentFrames = useFlipbook.getState().frames
      const frame = currentFrames[index % currentFrames.length]
      if (frame?.dataUrl) {
        img.src = frame.dataUrl
        img.style.visibility = "visible"
      } else {
        img.style.visibility = "hidden"
      }
    }

    render()
    const interval = setInterval(() => {
      index += 1
      render()
    }, 1000 / fps)
    return () => clearInterval(interval)
  }, [playing, fps])

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/40">
        <div className="flex h-max min-h-full w-max min-w-full items-center justify-center p-6">
          <div
            data-tour="canvas"
            className="relative shrink-0 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/10"
            style={{ width: displayWidth, height: displayHeight }}
          >
            {beforeFrames.map((frame, i) => (
              <OnionLayer
                key={frame.id}
                dataUrl={frame.dataUrl}
                color="#ef4444"
                opacity={onionStepOpacity(onionOpacity, i + 1)}
              />
            ))}
            {afterFrames.map((frame, i) => (
              <OnionLayer
                key={frame.id}
                dataUrl={frame.dataUrl}
                color="#22c55e"
                opacity={onionStepOpacity(onionOpacity, i + 1)}
              />
            ))}

            <div className={playing ? "invisible" : undefined}>
              <canvas ref={canvasElRef} />
            </div>

            {playing && (
              <div className="absolute inset-0 z-10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL frames can't use next/image */}
                <img
                  ref={playImgRef}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="size-full select-none"
                  style={{ visibility: "hidden" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ZoomControls
        percent={Math.round(scale * 100)}
        zoom={zoom}
        onZoom={setZoom}
      />
    </div>
  )
}

function ZoomControls({
  percent,
  zoom,
  onZoom,
}: {
  percent: number
  zoom: number
  onZoom: (zoom: number) => void
}) {
  return (
    <div className="absolute right-3 bottom-3 flex items-center gap-0.5 rounded-lg border bg-background/90 p-0.5 shadow-sm backdrop-blur-sm">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom out"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => onZoom(zoom / 1.25)}
              className="text-muted-foreground"
            >
              <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
            </Button>
          }
        />
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              aria-label="Fit to viewport"
              onClick={() => onZoom(1)}
              className="min-w-12 tabular-nums"
            >
              {percent}%
            </Button>
          }
        />
        <TooltipContent>Fit to viewport</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Zoom in"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => onZoom(zoom * 1.25)}
              className="text-muted-foreground"
            >
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            </Button>
          }
        />
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
    </div>
  )
}
