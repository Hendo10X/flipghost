"use client"

import { useEffect, useRef, useState } from "react"
import type { Canvas, TPointerEventInfo } from "fabric"

import {
  getStagePreset,
  SNAPSHOT_SIZE,
  useFlipbook,
} from "@/lib/flipbook/store"

/** Recolors a stroke snapshot to a flat tint for onion skinning. */
function useTintedImage(dataUrl: string | null, color: string) {
  const [tinted, setTinted] = useState<{
    source: string
    result: string
  } | null>(null)

  useEffect(() => {
    if (!dataUrl) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      ctx.globalCompositeOperation = "source-in"
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setTinted({ source: dataUrl, result: canvas.toDataURL() })
    }
    img.src = dataUrl
    return () => {
      cancelled = true
    }
  }, [dataUrl, color])

  return dataUrl && tinted?.source === dataUrl ? tinted.result : null
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
  const playing = useFlipbook((s) => s.playing)
  const fps = useFlipbook((s) => s.fps)
  const frames = useFlipbook((s) => s.frames)
  const stagePresetId = useFlipbook((s) => s.stagePresetId)
  const pendingImport = useFlipbook((s) => s.pendingImport)

  const stage = getStagePreset(stagePresetId)
  const scale = Math.min(
    container.width / stage.width,
    container.height / stage.height
  )
  const displayWidth = Math.max(0, Math.floor(stage.width * scale) || 0)
  const displayHeight = Math.max(0, Math.floor(stage.height * scale) || 0)

  const currentIndex = frames.findIndex((f) => f.id === currentId)
  const prevFrame = currentIndex > 0 ? frames[currentIndex - 1] : null
  const nextFrame =
    currentIndex >= 0 && currentIndex < frames.length - 1
      ? frames[currentIndex + 1]
      : null

  const onionPrev = useTintedImage(prevFrame?.dataUrl ?? null, "#ef4444")
  const onionNext = useTintedImage(nextFrame?.dataUrl ?? null, "#22c55e")

  const playImgRef = useRef<HTMLImageElement>(null)

  // --- Fabric lifecycle ---
  useEffect(() => {
    let disposed = false
    let canvas: Canvas | null = null

    async function init() {
      const { Canvas, PencilBrush } = await import("fabric")
      if (disposed || !canvasElRef.current) return

      canvas = new Canvas(canvasElRef.current, {
        isDrawingMode: true,
        selection: false,
        perPixelTargetFind: true,
        targetFindTolerance: 12,
        enableRetinaScaling: true,
      })
      canvas.freeDrawingBrush = new PencilBrush(canvas)
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
        path.set({ selectable: false, perPixelTargetFind: true })
        commit()
      })

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
    canvas.setDimensions({ width: displayWidth, height: displayHeight })
    canvas.setZoom(displayWidth / stage.width)
    canvas.requestRenderAll()
  }, [displayWidth, displayHeight, stage.width, ready])

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
        selectable: false,
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
    } else {
      canvas.isDrawingMode = false
      canvas.defaultCursor = "crosshair"
      canvas.hoverCursor = "crosshair"
    }
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor
      canvas.freeDrawingBrush.width = brushSize
    }
  }, [tool, brushColor, brushSize, ready])

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
          obj.set({ selectable: false, perPixelTargetFind: true })
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
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/40 p-6"
    >
      <div
        className="relative overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/10"
        style={{ width: displayWidth, height: displayHeight }}
      >
        {onionSkin && !playing && onionPrev && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
          <img
            src={onionPrev}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full opacity-30 select-none"
          />
        )}
        {onionSkin && !playing && onionNext && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
          <img
            src={onionNext}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full opacity-30 select-none"
          />
        )}

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
  )
}
