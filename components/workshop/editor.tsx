"use client"

import { useEffect } from "react"

import { useFlipbook } from "@/lib/flipbook/store"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CanvasStage } from "@/components/workshop/canvas-stage"
import { WorkshopHeader } from "@/components/workshop/header"
import { Timeline } from "@/components/workshop/timeline"
import { Toolbar } from "@/components/workshop/toolbar"

export function Editor() {
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
      if (e.metaKey || e.ctrlKey) return

      switch (key) {
        case " ":
          e.preventDefault()
          s.setPlaying(!s.playing)
          break
        case "b":
          s.setTool("brush")
          break
        case "e":
          s.setTool("eraser")
          break
        case "arrowleft":
        case "arrowright": {
          const index = s.frames.findIndex((f) => f.id === s.currentId)
          const next = key === "arrowleft" ? index - 1 : index + 1
          if (next >= 0 && next < s.frames.length) {
            s.selectFrame(s.frames[next].id)
          }
          break
        }
      }
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
