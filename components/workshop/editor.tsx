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
import { getStagePreset, useFlipbook, type Frame } from "@/lib/flipbook/store"
import { getHotkeysSnapshot } from "@/lib/hotkeys"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CanvasStage } from "@/components/workshop/canvas-stage"
import { SmallScreenNotice } from "@/components/workshop/small-screen-notice"
import { WorkshopHeader } from "@/components/workshop/header"
import { Timeline } from "@/components/workshop/timeline"
import { Toolbar } from "@/components/workshop/toolbar"

export interface InitialProject {
  id: string
  title: string
  fps: number
  stagePresetId: string
  frames: Frame[]
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
      if (initialProject && initialProject.frames.length > 0) {
        useFlipbook.setState((s) => ({
          projectId: initialProject.id,
          cloudStatus: "saved",
          title: initialProject.title,
          fps: initialProject.fps,
          stagePresetId: initialProject.stagePresetId,
          frames: initialProject.frames,
          currentId: initialProject.frames[0].id,
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
          title: spec.title,
          fps: spec.fps,
          stagePresetId: spec.stagePresetId,
          frames: demoFrames,
          currentId: demoFrames[0].id,
          past: [],
          future: [],
          revision: s.revision + 1,
        }))
      } else if (initialNew) {
        // Fresh "New animation" at a chosen name/size: blank canvas, clean slate.
        const frame: Frame = { id: crypto.randomUUID(), json: null, dataUrl: null }
        clearLocalSnapshot()
        useFlipbook.setState((s) => ({
          projectId: null,
          cloudStatus: "idle",
          title: initialNew.title,
          fps: 12,
          stagePresetId: getStagePreset(initialNew.stagePresetId).id,
          frames: [frame],
          currentId: frame.id,
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
       * change, and the snapshot includes currentId and the brush settings, so
       * a per-notification "did content change" flag gets replaced by the next
       * innocent change and the edit it was standing for is dropped. Drawing a
       * stroke and stepping to the next frame within the window — the normal
       * way anyone animates — silently threw the stroke away.
       *
       * savedVersion only moves on a successful write, so a failed save is
       * retried by the next edit rather than forgotten.
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
            await saveProjectToCloud({
              projectId: s.projectId,
              title: s.title,
              fps: s.fps,
              stagePresetId: s.stagePresetId,
              frames: s.frames,
            })
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
          next.frames !== previous.frames ||
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
      if (target?.closest("input, textarea, [contenteditable=true]")) return

      const s = useFlipbook.getState()
      const key = e.key.toLowerCase()

      if ((e.metaKey || e.ctrlKey) && key === "z") {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && key === "y") {
        e.preventDefault()
        s.redo()
        return
      }
      if (e.metaKey || e.ctrlKey) {
        // Ctrl/Cmd +, -, 0 mirror the canvas zoom controls.
        if (key === "=" || key === "+") {
          e.preventDefault()
          s.setZoom(s.zoom * 1.25)
        } else if (key === "-") {
          e.preventDefault()
          s.setZoom(s.zoom / 1.25)
        } else if (key === "0") {
          e.preventDefault()
          s.setZoom(1)
        }
        return
      }

      const keys = getHotkeysSnapshot()
      const step = (delta: number) => {
        const index = s.frames.findIndex((f) => f.id === s.currentId)
        const next = index + delta
        if (next >= 0 && next < s.frames.length) {
          s.selectFrame(s.frames[next].id)
        }
      }

      let handled = true
      switch (key) {
        case keys.playPause:
          s.setPlaying(!s.playing)
          break
        case keys.select:
          s.setTool("select")
          break
        case keys.brush:
          s.setTool("brush")
          break
        case keys.eraser:
          s.setTool("eraser")
          break
        case keys.toggleOnion:
          s.toggleOnionSkin()
          break
        case keys.addFrame:
          s.addFrame()
          break
        case keys.prevFrame:
          step(-1)
          break
        case keys.nextFrame:
          step(1)
          break
        default:
          handled = false
      }
      // Space and the arrows would otherwise scroll the canvas viewport.
      if (handled) e.preventDefault()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
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
