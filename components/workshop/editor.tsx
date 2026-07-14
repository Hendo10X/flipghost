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
          histories: {},
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
          histories: {},
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
          histories: {},
          revision: s.revision + 1,
        }))
      } else {
        const snapshot = await loadLocalSnapshot()
        if (disposed) return
        if (snapshot && useFlipbook.getState().projectId === null) {
          useFlipbook.setState((s) => ({
            ...snapshot,
            histories: {},
            revision: s.revision + 1,
          }))
        }
      }

      // Watch the persistable slice; ignore tool/playback churn.
      let previous = snapshotFromState(useFlipbook.getState())
      unsubscribe = useFlipbook.subscribe((state) => {
        const next = snapshotFromState(state)
        if (!snapshotChanged(next, previous)) return

        const contentChanged =
          next.frames !== previous.frames ||
          next.title !== previous.title ||
          next.fps !== previous.fps ||
          next.stagePresetId !== previous.stagePresetId
        previous = next

        clearTimeout(timer)
        timer = setTimeout(async () => {
          const s = useFlipbook.getState()
          if (s.projectId) {
            if (!contentChanged) return
            s.setCloudStatus("saving")
            try {
              await saveProjectToCloud({
                projectId: s.projectId,
                title: s.title,
                fps: s.fps,
                stagePresetId: s.stagePresetId,
                frames: s.frames,
              })
              useFlipbook.getState().setCloudStatus("saved")
            } catch {
              useFlipbook.getState().setCloudStatus("error")
            }
          } else {
            saveLocalSnapshot(snapshotFromState(s))
          }
        }, 1500)
      })
    }

    boot()
    return () => {
      disposed = true
      unsubscribe?.()
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
      <div className="flex h-dvh flex-col">
        <WorkshopHeader />
        <div className="flex min-h-0 flex-1">
          <Toolbar />
          <CanvasStage />
        </div>
        <Timeline />
      </div>
    </TooltipProvider>
  )
}
