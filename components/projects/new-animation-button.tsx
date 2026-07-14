"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { STAGE_PRESETS } from "@/lib/flipbook/store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function NewAnimationButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [presetId, setPresetId] = useState(STAGE_PRESETS[0].id)

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = title.trim() || "Untitled Animation"
    const params = new URLSearchParams({ new: presetId, title: name })
    router.push(`/workshop?${params.toString()}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setTitle("")
          setPresetId(STAGE_PRESETS[0].id)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="lg" className="px-3">
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            New animation
          </Button>
        }
      />
      <DialogContent>
        <DialogTitle>New animation</DialogTitle>
        <DialogDescription>
          Give it a name and pick a canvas size.
        </DialogDescription>

        <form onSubmit={create} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="animation-title">Name</Label>
            <Input
              id="animation-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Animation"
              maxLength={255}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Canvas size</Label>
            <div className="grid grid-cols-2 gap-2">
              {STAGE_PRESETS.map((preset) => {
                const active = preset.id === presetId
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPresetId(preset.id)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                      active
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-xs font-medium">{preset.label}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {preset.width}×{preset.height}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full">
            Create animation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
