"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Canvas, FabricObject, TPointerEventInfo, TPointerEvent } from "fabric"
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
import { compositeLayerFrameDataUrls } from "@/lib/flipbook/composite"
import { EraserBrush } from "@/lib/flipbook/eraser-brush"
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

/** Smallest drag (in stage units) that counts as an intentional shape rather
 *  than a stray click — anything under this is discarded instead of leaving
 *  a near-invisible dot on the frame. */
const MIN_SHAPE_DRAG = 3

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageWrapRef = useRef<HTMLDivElement>(null)
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const commitRef = useRef<(() => void) | null>(null)
  const eraserBrushRef = useRef<EraserBrush | null>(null)
  const zoomAnchorRef = useRef<{
    fracX: number
    fracY: number
    clientX: number
    clientY: number
  } | null>(null)
  const zoomAnchorClearRef = useRef<number | null>(null)
  // Shape-tool drag state: the in-progress rect/ellipse and where the drag
  // started, in stage (scene) coordinates.
  const shapeDraftRef = useRef<FabricObject | null>(null)
  const shapeOriginRef = useRef<{ x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [container, setContainer] = useState({ width: 0, height: 0 })
  const [underlayUrl, setUnderlayUrl] = useState<string | null>(null)
  const [beforeUrls, setBeforeUrls] = useState<string[]>([])
  const [afterUrls, setAfterUrls] = useState<string[]>([])

  const currentLayerId = useFlipbook((s) => s.currentLayerId)
  const currentFrameIndex = useFlipbook((s) => s.currentFrameIndex)
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
  const layers = useFlipbook((s) => s.layers)
  const pendingImport = useFlipbook((s) => s.pendingImport)

  const stagePresetId = useFlipbook((s) => s.stagePresetId)
  const stage = getStagePreset(stagePresetId)
  // Scale that fits the stage in the viewport; zoom multiplies it.
  const fitScale = Math.min(
    (container.width - VIEWPORT_PAD) / stage.width,
    (container.height - VIEWPORT_PAD) / stage.height
  )
  const scale = fitScale > 0 ? fitScale * zoom : 0
  const displayWidth = Math.max(0, Math.floor(stage.width * scale) || 0)
  const displayHeight = Math.max(0, Math.floor(stage.height * scale) || 0)

  const currentLayer = layers.find((layer) => layer.id === currentLayerId) ?? layers[0]

  // Nearest neighbours first, so ghost opacity falls off with distance.
  // Guard on currentFrameIndex: a -1 would make the slices below select wildly.
  const showOnion = onionSkin && !playing && currentFrameIndex >= 0
  const beforeIndices = useMemo(
    () =>
      showOnion
        ? Array.from({ length: Math.min(onionBefore, currentFrameIndex) }, (_, i) => currentFrameIndex - i - 1)
        : [],
    [showOnion, onionBefore, currentFrameIndex]
  )
  const afterIndices = useMemo(
    () =>
      showOnion
        ? Array.from(
            { length: Math.min(onionAfter, Math.max(0, (currentLayer?.frames.length ?? 0) - currentFrameIndex - 1)) },
            (_, i) => currentFrameIndex + i + 1
          )
        : [],
    [showOnion, onionAfter, currentFrameIndex, currentLayer?.frames.length]
  )

  const playImgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let cancelled = false
    async function buildLayerPreviews() {
      if (!ready || displayWidth === 0 || displayHeight === 0) {
        setUnderlayUrl(null)
        setBeforeUrls([])
        setAfterUrls([])
        return
      }
      const size = { width: stage.width, height: stage.height }
      const underlay = await compositeLayerFrameDataUrls(layers, currentFrameIndex, size, {
        excludeLayerId: currentLayerId,
      })
      const before = (await Promise.all(
        beforeIndices.map((index) => compositeLayerFrameDataUrls(layers, index, size))
      )).filter((url): url is string => Boolean(url))
      const after = (await Promise.all(
        afterIndices.map((index) => compositeLayerFrameDataUrls(layers, index, size))
      )).filter((url): url is string => Boolean(url))
      if (cancelled) return
      setUnderlayUrl(underlay)
      setBeforeUrls(before)
      setAfterUrls(after)
    }
    buildLayerPreviews()
    return () => {
      cancelled = true
    }
  }, [
    ready,
    displayWidth,
    displayHeight,
    stage.width,
    stage.height,
    layers,
    currentLayerId,
    currentFrameIndex,
    beforeIndices,
    afterIndices,
  ])

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
      eraserBrushRef.current = new EraserBrush(canvas)
      fabricRef.current = canvas

      const commit = () => {
        if (!canvas) return
        const state = useFlipbook.getState()
        const activeLayer = state.layers.find((layer) => layer.id === state.currentLayerId)
        if (!activeLayer) return
        const json = canvas.toJSON() as Record<string, unknown>
        const dataUrl = canvas.toDataURL({
          format: "png",
          multiplier: SNAPSHOT_SIZE / canvas.getWidth(),
        })
        state.commitFrame(activeLayer.id, state.currentFrameIndex, json, dataUrl)
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

      // --- Shape tools: drag out a rect or circle instead of a freehand path ---
      function scenePointer(opt: TPointerEventInfo<TPointerEvent>) {
        // Fabric v6 renamed getPointer() to getScenePoint()/getViewportPoint(),
        // and puts the scene point directly on the event info object — that's
        // the coordinate space objects live in (already corrected for the
        // canvas's current zoom/pan).
        const withScenePoint = opt as TPointerEventInfo<TPointerEvent> & {
          scenePoint?: { x: number; y: number }
        }
        return withScenePoint.scenePoint ?? canvas!.getScenePoint(opt.e)
      }

      function onShapeMouseDown(opt: TPointerEventInfo<TPointerEvent>) {
        const currentTool = useFlipbook.getState().tool as string
        if (currentTool !== "square" && currentTool !== "circle") return
        if (!canvas) return

        const pointer = scenePointer(opt)
        shapeOriginRef.current = pointer
        const state = useFlipbook.getState()

        const common = {
          left: pointer.x,
          top: pointer.y,
          fill: "transparent",
          stroke: state.brushColor,
          strokeWidth: state.brushSize,
          strokeUniform: true,
          selectable: false,
          evented: false,
          originX: "left" as const,
          originY: "top" as const,
        }

        import("fabric").then(({ Rect, Circle }) => {
          if (!canvas || shapeOriginRef.current !== pointer) return
          const draft =
            currentTool === "square"
              ? new Rect({ ...common, width: 0, height: 0 })
              : new Circle({ ...common, radius: 0 })
          shapeDraftRef.current = draft
          canvas.add(draft)
          canvas.requestRenderAll()
        })
      }

      function onShapeMouseMove(opt: TPointerEventInfo<TPointerEvent>) {
        const draft = shapeDraftRef.current
        const origin = shapeOriginRef.current
        if (!draft || !origin || !canvas) return

        const pointer = scenePointer(opt)
        const dx = pointer.x - origin.x
        const dy = pointer.y - origin.y

        if (draft.type === "circle") {
          const r = Math.max(Math.abs(dx), Math.abs(dy)) / 2
          const cx = origin.x + dx / 2
          const cy = origin.y + dy / 2
          draft.set({ radius: r, left: cx - r, top: cy - r })
        } else {
          const size = Math.max(Math.abs(dx), Math.abs(dy))
          draft.set({
            width: size,
            height: size,
            left: dx < 0 ? origin.x - size : origin.x,
            top: dy < 0 ? origin.y - size : origin.y,
          })
        }
        draft.setCoords()
        canvas.requestRenderAll()
      }

      function onShapeMouseUp() {
        const draft = shapeDraftRef.current
        if (!canvas || !draft) {
          shapeDraftRef.current = null
          shapeOriginRef.current = null
          return
        }

        const finishedSize =
          draft.type === "circle"
            ? (draft as unknown as { radius: number }).radius * 2
            : Math.max(draft.width ?? 0, draft.height ?? 0)

        if (finishedSize < MIN_SHAPE_DRAG) {
          canvas.remove(draft)
          canvas.requestRenderAll()
        } else {
          draft.set({
            selectable: useFlipbook.getState().tool === "select",
            evented: true,
            perPixelTargetFind: true,
          })
          canvas.requestRenderAll()
          commit()
        }

        shapeDraftRef.current = null
        shapeOriginRef.current = null
      }

      canvas.on("mouse:down", onShapeMouseDown)
      canvas.on("mouse:move", onShapeMouseMove)
      canvas.on("mouse:up", onShapeMouseUp)

      setReady(true)
    }

    init()

    return () => {
      disposed = true
      setReady(false)
      fabricRef.current = null
      commitRef.current = null
      eraserBrushRef.current = null
      shapeDraftRef.current = null
      shapeOriginRef.current = null
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

      // Record where the cursor sits as a fraction of the stage *before* the
      // zoom changes, then correct against the rendered stage after the new
      // size lands.
      const stageEl = stageWrapRef.current
      if (stageEl) {
        const rect = stageEl.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          zoomAnchorRef.current = {
            fracX: (e.clientX - rect.left) / rect.width,
            fracY: (e.clientY - rect.top) / rect.height,
            clientX: e.clientX,
            clientY: e.clientY,
          }
        }
      }

      // Keep the anchor alive a little past this event: zooming in can make
      // a scrollbar appear, which shrinks the container and fires the
      // ResizeObserver as a second, separate resize. Extending the anchor's
      // lifetime lets every resize in the same burst correct against it.
      if (zoomAnchorClearRef.current) {
        window.clearTimeout(zoomAnchorClearRef.current)
      }
      zoomAnchorClearRef.current = window.setTimeout(() => {
        zoomAnchorRef.current = null
      }, 150)

      const state = useFlipbook.getState()
      state.setZoom(state.zoom * Math.exp(-e.deltaY / 300))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      el.removeEventListener("wheel", onWheel)
      if (zoomAnchorClearRef.current) {
        window.clearTimeout(zoomAnchorClearRef.current)
      }
      zoomAnchorRef.current = null
    }
  }, [])

  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current
    const containerEl = containerRef.current
    const stageEl = stageWrapRef.current
    if (!anchor || !containerEl || !stageEl) return

    const rect = stageEl.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const targetClientX = rect.left + anchor.fracX * rect.width
    const targetClientY = rect.top + anchor.fracY * rect.height

    containerEl.scrollLeft += targetClientX - anchor.clientX
    containerEl.scrollTop += targetClientY - anchor.clientY
  }, [scale, container.width, container.height])

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
      const { width: stageW, height: stageH } = getStagePreset(state.stagePresetId)
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

    async function updateTool() {
      if (!canvas) return
      if (tool === "brush") {
        const { PressureBrush } = await import("@/lib/flipbook/pressure-brush")
        canvas.isDrawingMode = true
        canvas.selection = false
        canvas.freeDrawingBrush = new PressureBrush(canvas)
        canvas.freeDrawingBrush.color = brushColor
        canvas.freeDrawingBrush.width = brushSize
      } else if (tool === "eraser") {
        canvas.isDrawingMode = true
        canvas.selection = false
        const eraser = eraserBrushRef.current
        if (eraser) {
          eraser.width = brushSize
          canvas.freeDrawingBrush = eraser
        }
        canvas.freeDrawingCursor = "crosshair"
      } else if ((["square", "circle"] as string[]).includes(tool)) {
        // Handled by the mouse:down/move/up handlers registered once at
        // init — this just puts the canvas in the right mode for them.
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
    }

    updateTool()
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

  // --- Load the current active layer cell into the canvas ---
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !ready) return

    /**
     * Stepping frames faster than a frame enlivens starts a second load before
     * the first has finished, and loadFromJSON does its `clear()` and `add()`
     * *inside* the promise it returns. So a flag checked after the await is
     * already too late: the stale artwork is on the canvas by then, and the
     * next stroke commits it into whichever frame is now selected.
     */
    const controller = new AbortController()

    async function load() {
      if (!canvas) return
      const state = useFlipbook.getState()
      const layer = state.layers.find((entry) => entry.id === state.currentLayerId)
      const cell = layer?.frames[state.currentFrameIndex]
      canvas.clear()
      if (cell?.json) {
        try {
          await canvas.loadFromJSON(cell.json as object, undefined, {
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
      // Undo/redo drops the cached snapshot; rebuild it from the canvas.
      if (layer && cell && cell.dataUrl === null && cell.json !== null) {
        state.setFrameSnapshot(
          layer.id,
          state.currentFrameIndex,
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
  }, [currentLayerId, currentFrameIndex, revision, ready])

  // --- Playback loop: drives the preview <img> directly, outside React ---
  useEffect(() => {
    if (!playing) return
    const state = useFlipbook.getState()
    let index = Math.max(0, state.currentFrameIndex)
    let cancelled = false

    const render = async () => {
      const img = playImgRef.current
      if (!img) return
      const currentState = useFlipbook.getState()
      const preset = getStagePreset(currentState.stagePresetId)
      const size = {
        width: preset.width,
        height: preset.height,
      }
      const composite = await compositeLayerFrameDataUrls(
        currentState.layers,
        index % (currentState.layers[0]?.frames.length ?? 1),
        size,
        { backgroundColor: "#ffffff" }
      )
      if (cancelled || !img) return
      if (composite) {
        img.src = composite
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
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [playing, fps])

  return (
    // min-w-0: without it a flex child refuses to shrink below its content,
    // which would push the stage out past the viewport instead of fitting it.
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/40 [overflow-anchor:none]"
      >
        {/* Sized to the stage (w-max/h-max) but never smaller than the
            viewport, so centring applies only when there is room to spare. */}
        <div className="flex h-max min-h-full w-max min-w-full items-center justify-center p-6">
          <div
            ref={stageWrapRef}
            className="relative shrink-0 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/10"
            style={{ width: displayWidth, height: displayHeight }}
          >
            {underlayUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL layers are not optimizable
              <img
                src={underlayUrl}
                alt=""
                aria-hidden
                draggable={false}
                className="pointer-events-none absolute inset-0 size-full select-none"
              />
            )}

            {beforeUrls.map((url, i) => (
              <OnionLayer
                key={`before-${currentFrameIndex - i - 1}`}
                dataUrl={url}
                color="#ef4444"
                opacity={onionStepOpacity(onionOpacity, i + 1)}
              />
            ))}
            {afterUrls.map((url, i) => (
              <OnionLayer
                key={`after-${currentFrameIndex + i + 1}`}
                dataUrl={url}
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