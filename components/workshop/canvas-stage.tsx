"use client"

import { useEffect, useRef, useState } from "react"
import type { Canvas, TPointerEventInfo } from "fabric"
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
 *
 * The snapshot's alpha is used as a CSS mask over a flat fill, which tints the
 * strokes without touching the pixels. Doing this on an offscreen canvas
 * instead would mean a decode and a PNG re-encode per ghost every time the
 * frame changes, which is felt as lag while stepping along the timeline.
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
  // Scale that fits the stage in the viewport; zoom multiplies it.
  const fitScale = Math.min(
    (container.width - VIEWPORT_PAD) / stage.width,
    (container.height - VIEWPORT_PAD) / stage.height
  )
  const scale = fitScale > 0 ? fitScale * zoom : 0
  const displayWidth = Math.max(0, Math.floor(stage.width * scale) || 0)
  const displayHeight = Math.max(0, Math.floor(stage.height * scale) || 0)

  const currentIndex = frames.findIndex((f) => f.id === currentId)

  // Nearest neighbours first, so ghost opacity falls off with distance.
  // Guard on currentIndex: a -1 would make the slices below select wildly.
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
      const [{ Canvas }, { PressureBrush }] = await Promise.all([
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
        // Fabric defaults to mouse + touch events, which carry no pressure or
        // pointer type. Pointer events are what let a stylus draw as a stylus.
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

      // Moving/scaling/rotating with the select tool.
      canvas.on("object:modified", () => commit())

      // Stroke eraser: drag over strokes to remove them.
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

  // --- Responsive sizing: fit the stage into the container ---
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
    // Resizing the element (rather than CSS-scaling it) keeps strokes crisp.
    canvas.setDimensions({ width: displayWidth, height: displayHeight })
    canvas.setZoom(displayWidth / stage.width)
    canvas.requestRenderAll()
  }, [displayWidth, displayHeight, stage.width, ready])

  // --- Ctrl/Cmd + wheel zooms; a plain wheel scrolls (pans) the viewport ---
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

  // --- Place an imported image onto the current frame ---
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

  // --- Tool & brush settings ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready) return
    if (tool === "brush") {
      canvas.isDrawingMode = true
      canvas.selection = false
    } else if (tool === "eraser") {
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

  // --- Brush cursor: a ring matching the stroke it will lay down ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready || tool !== "brush" || scale <= 0) return
    // brushSize is in stage units, so scale it into screen pixels.
    canvas.freeDrawingCursor = brushCursor(brushSize * scale)
  }, [tool, brushSize, scale, ready])

  // --- Select-tool keyboard: delete selection, escape to deselect ---
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

  // --- Load the current frame into the canvas ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready) return
    let cancelled = false

    async function load() {
      if (!canvas) return
      const state = useFlipbook.getState()
      const frame = state.frames.find((f) => f.id === state.currentId)
      canvas.clear()
      if (frame?.json) {
        await canvas.loadFromJSON(frame.json as object)
        if (cancelled) return
        canvas.forEachObject((obj) => {
          obj.set({
            selectable: state.tool === "select",
            perPixelTargetFind: true,
          })
        })
      }
      canvas.requestRenderAll()
      // Undo/redo drops the cached snapshot; rebuild it from the canvas.
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
      cancelled = true
    }
  }, [currentId, revision, ready])

  // --- Playback loop: drives the preview <img> directly, outside React ---
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
    // min-w-0: without it a flex child refuses to shrink below its content,
    // which would push the stage out past the viewport instead of fitting it.
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/40">
        {/* Sized to the stage (w-max/h-max) but never smaller than the
            viewport, so centring applies only when there is room to spare.
            Plain justify-center would push the overflow of a zoomed-in stage
            to negative offsets, where scrolling cannot reach it. */}
        <div className="flex h-max min-h-full w-max min-w-full items-center justify-center p-6">
          <div
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
