"use client"

import { useEffect } from "react"

import { saveProjectToCloud } from "@/lib/flipbook/cloud"
import { buildDemoFrames, getDemo } from "@/lib/flipbook/demos"
import {
  clearLocalSnapshot,
  loadLocalSnapshot,
  saveLocalSnapshot,
  snapshotChanged,
  snapshotFromState,
} from "@/lib/flipbook/persistence"
import {
  normalizeProjectSnapshot,
  getStagePreset,
  useFlipbook,
  type Frame,
  type Layer,
  type ProjectSnapshot,
} from "@/lib/flipbook/store"
import { getHotkeysSnapshot } from "@/lib/hotkeys"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CanvasStage } from "@/components/workshop/canvas-stage"
import { SmallScreenNotice } from "@/components/workshop/small-screen-notice"
import { WorkshopHeader } from "@/components/workshop/header"
import { Timeline } from "@/components/workshop/timeline"
import { Toolbar } from "@/components/workshop/toolbar"

export interface InitialProject extends ProjectSnapshot {
  id: string
}

function demoSnapshot(
  title: string,
  fps: number,
  stagePresetId: string,
  frames: Frame[]
): ProjectSnapshot {
  const layer: Layer = {
    id: crypto.randomUUID(),
    name: "Layer 1",
    visible: true,
    frames,
  }
  return normalizeProjectSnapshot({
    title,
    layers: [layer],
    currentLayerId: layer.id,
    currentFrameIndex: 0,
    fps,
    stagePresetId,
    onionSkin: true,
    onionBefore: 1,
    onionAfter: 1,
    onionOpacity: 0.3,
    brushColor: "#1a1a1a",
    brushSize: 8,
  })
}

export function Editor({
  initialProject,
  initialNew,
  initialDemoId,
}: {
  initialProject?: InitialProject | null
  initialNew?: { stagePresetId: string; title: string }
  initialDemoId?: string
}) {
  // --- Hydration + autosave ---
  useEffect(() => {
    let disposed = false
    let unsubscribe: (() => void) | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let flush: (() => void) | undefined
    let onHide: (() => void) | undefined

    async function boot() {
      if (initialProject) {
        const { id, ...project } = initialProject
        useFlipbook.setState((s) => ({
          projectId: id,
          cloudStatus: "saved",
          ...project,
          past: [],
          future: [],
          revision: s.revision + 1,
        }))
      } else if (initialDemoId && getDemo(initialDemoId)) {
        // A showcase animation, loaded as a real editable project.
        const spec = getDemo(initialDemoId)!
        const demoFrames = await buildDemoFrames(spec)
        if (disposed) return
        clearLocalSnapshot()
        useFlipbook.setState((s) => ({
          projectId: null,
          cloudStatus: "idle",
          ...demoSnapshot(spec.title, spec.fps, spec.stagePresetId, demoFrames),
          past: [],
          future: [],
          revision: s.revision + 1,
        }))
      } else if (initialNew) {
        // Fresh "New animation" at a chosen name/size: blank canvas, clean slate.
        const frame: Frame = { id: crypto.randomUUID(), json: null, dataUrl: null }
        const layer: Layer = {
          id: crypto.randomUUID(),
          name: "Layer 1",
          visible: true,
          frames: [frame],
        }
        clearLocalSnapshot()
        useFlipbook.setState((s) => ({
          projectId: null,
          cloudStatus: "idle",
          ...normalizeProjectSnapshot({
            title: initialNew.title,
            layers: [layer],
            currentLayerId: layer.id,
            currentFrameIndex: 0,
            fps: 12,
            stagePresetId: getStagePreset(initialNew.stagePresetId).id,
            onionSkin: true,
            onionBefore: 1,
            onionAfter: 1,
            onionOpacity: 0.3,
            brushColor: "#1a1a1a",
            brushSize: 8,
          }),
          past: [],
          future: [],
          revision: s.revision + 1,
        }))
      } else {
        const snapshot = await loadLocalSnapshot()
        if (disposed) return
        if (snapshot && useFlipbook.getState().projectId === null) {
          useFlipbook.setState((s) => ({
            ...snapshot,
            past: [],
            future: [],
            revision: s.revision + 1,
          }))
        }
      }

      // Watch the persistable slice; ignore tool/playback churn.
      let previous = snapshotFromState(useFlipbook.getState())

      /**
       * A version, not a boolean. The debounce is re-armed by *any* snapshot
       * change, and the snapshot includes the current frame/layer selection and
       * the brush settings, so a per-notification "did content change" flag
       * gets replaced by the next innocent change and the edit it was standing
       * for is dropped.
       */
      let contentVersion = 0
      let savedVersion = 0
      let pending = false

      // Saves are chained rather than raced: two POSTs for one project can
      // land out of order and the loser overwrites the newer drawing.
      let queue: Promise<void> = Promise.resolve()

      function runSave() {
        pending = false
        queue = queue.then(async () => {
          const s = useFlipbook.getState()
          if (!s.projectId) {
            await saveLocalSnapshot(snapshotFromState(s))
            return
          }
          // Read inside the queue: an edit may have arrived while the previous
          // save was still in flight.
          const version = contentVersion
          if (version === savedVersion) return

          s.setCloudStatus("saving")
          try {
            await saveProjectToCloud(s)
            savedVersion = version
            useFlipbook.getState().setCloudStatus("saved")
          } catch {
            useFlipbook.getState().setCloudStatus("error")
          }
        })
      }

      flush = () => {
        if (!pending) return
        clearTimeout(timer)
        runSave()
      }

      unsubscribe = useFlipbook.subscribe((state) => {
        const next = snapshotFromState(state)
        if (!snapshotChanged(next, previous)) return

        if (
          next.layers !== previous.layers ||
          next.title !== previous.title ||
          next.fps !== previous.fps ||
          next.stagePresetId !== previous.stagePresetId
        ) {
          contentVersion++
        }
        previous = next

        pending = true
        clearTimeout(timer)
        timer = setTimeout(runSave, 1500)
      })

      // Everything drawn in the last 1.5s exists only in memory. Hiding the
      // tab is the last moment we are reliably given, so spend it. A true
      // unload-time flush is not available: sendBeacon and fetch keepalive cap
      // at ~64KB and a single frame is a base64 PNG well past that.
      onHide = () => {
        if (document.visibilityState === "hidden") flush?.()
      }
      document.addEventListener("visibilitychange", onHide)
    }

    boot()
    return () => {
      disposed = true
      unsubscribe?.()
      if (onHide) document.removeEventListener("visibilitychange", onHide)
      // Flush rather than clear. Clicking a link out of the workshop unmounts
      // this within the debounce window, and cancelling the timer here threw
      // away the last thing drawn without ever writing it.
      flush?.()
      clearTimeout(timer)
    }
  }, [initialProject, initialNew, initialDemoId])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isTextField = Boolean(
        target?.closest("input, textarea, [contenteditable=true]")
      )

      const s = useFlipbook.getState()
      const key = e.key.toLowerCase()
      const code = e.code.toLowerCase()
      const mod = e.metaKey || e.ctrlKey
      const zoomIn = mod && (key === "=" || key === "+" || code === "equal" || code === "numpadadd")
      const zoomOut = mod && (key === "-" || code === "minus" || code === "numpadsubtract")
      const zoomReset = mod && (key === "0" || code === "digit0" || code === "numpad0")

      if (mod && key === "z") {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if (mod && key === "y") {
        e.preventDefault()
        s.redo()
        return
      }
      if (zoomIn || zoomOut || zoomReset) {
        e.preventDefault()
        if (zoomIn) s.setZoom(s.zoom * 1.25)
        else if (zoomOut) s.setZoom(s.zoom / 1.25)
        else s.setZoom(1)
        return
      }
      if (isTextField) return

      const keys = getHotkeysSnapshot()
      const step = (delta: number) => {
        const next = s.currentFrameIndex + delta
        if (next >= 0 && next < (s.layers[0]?.frames.length ?? 0)) {
          s.selectFrame(next)
        }
      }

      let handled = true
      const matches = (action: keyof typeof keys, fallbackKey: string, fallbackCode?: string) =>
        key === keys[action] || key === fallbackKey || code === fallbackCode
      switch (true) {
        case key === keys.playPause:
          s.setPlaying(!s.playing)
          break
        case key === keys.select:
          s.setTool("select")
          break
        case matches("brush", "b", "keyb"):
          s.setTool("brush")
          break
        case matches("eraser", "e", "keye"):
          s.setTool("eraser")
          break
        case key === keys.toggleOnion:
          s.toggleOnionSkin()
          break
        case key === keys.addFrame:
          s.addFrame()
          break
        case key === keys.prevFrame:
          step(-1)
          break
        case key === keys.nextFrame:
          step(1)
          break
        default:
          handled = false
      }
      // Space and the arrows would otherwise scroll the canvas viewport.
      if (handled) e.preventDefault()
    }

    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [])

  return (
    <TooltipProvider>
      <SmallScreenNotice />
      {/* overflow-hidden so the only thing that ever scrolls sideways is the
          frame strip in the timeline. Everything above it has to fit. */}
      <div className="hidden h-dvh flex-col overflow-hidden md:flex">
        <WorkshopHeader />
        <div className="flex min-h-0 min-w-0 flex-1">
          <Toolbar />
          <CanvasStage />
        </div>
        <Timeline />
      </div>
    </TooltipProvider>
  )
}
