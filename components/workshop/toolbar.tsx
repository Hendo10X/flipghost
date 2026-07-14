"use client"

import {
  BrushCleaningIcon,
  Cursor01Icon,
  EraserIcon,
  PencilEdit02Icon,
  Redo02Icon,
  Undo02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { HexColorInput, HexColorPicker } from "react-colorful"

import { useFlipbook, type Tool } from "@/lib/flipbook/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const BRUSH_SIZES = [4, 8, 16, 32] as const
const DOT_CLASSES = ["size-1", "size-1.5", "size-2.5", "size-3.5"] as const

const TOOLS: { tool: Tool; label: string; icon: typeof PencilEdit02Icon }[] = [
  { tool: "select", label: "Select (V)", icon: Cursor01Icon },
  { tool: "brush", label: "Brush (B)", icon: PencilEdit02Icon },
  { tool: "eraser", label: "Eraser (E)", icon: EraserIcon },
]

export function Toolbar() {
  const tool = useFlipbook((s) => s.tool)
  const setTool = useFlipbook((s) => s.setTool)
  const brushColor = useFlipbook((s) => s.brushColor)
  const setBrushColor = useFlipbook((s) => s.setBrushColor)
  const brushSize = useFlipbook((s) => s.brushSize)
  const setBrushSize = useFlipbook((s) => s.setBrushSize)
  const clearFrame = useFlipbook((s) => s.clearFrame)
  const undo = useFlipbook((s) => s.undo)
  const redo = useFlipbook((s) => s.redo)
  const canUndo = useFlipbook(
    (s) => (s.histories[s.currentId]?.past.length ?? 0) > 0
  )
  const canRedo = useFlipbook(
    (s) => (s.histories[s.currentId]?.future.length ?? 0) > 0
  )

  return (
    <aside className="flex w-12 flex-col items-center gap-1 border-r py-3">
      {TOOLS.map(({ tool: t, label, icon }) => (
        <Tooltip key={t}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label={label}
                aria-pressed={t === tool}
                onClick={() => setTool(t)}
                className={cn(
                  "text-muted-foreground",
                  t === tool && "bg-muted text-foreground"
                )}
              >
                <HugeiconsIcon icon={icon} strokeWidth={1.8} />
              </Button>
            }
          />
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}

      <div className="my-2 h-px w-6 bg-border" />

      <Popover>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Brush color"
                  >
                    <span
                      className="size-4 rounded-full ring-1 ring-black/15 ring-inset dark:ring-white/20"
                      style={{ backgroundColor: brushColor }}
                    />
                  </Button>
                }
              />
            }
          />
          <TooltipContent side="right">Brush color</TooltipContent>
        </Tooltip>
        <PopoverContent side="right" align="start" className="w-auto">
          <div className="flex flex-col gap-3 [&_.react-colorful]:h-44 [&_.react-colorful]:w-44">
            <HexColorPicker color={brushColor} onChange={setBrushColor} />
            <HexColorInput
              prefixed
              color={brushColor}
              onChange={setBrushColor}
              aria-label="Hex color"
              className="h-8 w-44 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
            />
          </div>
        </PopoverContent>
      </Popover>

      <div className="my-2 h-px w-6 bg-border" />

      <div role="radiogroup" aria-label="Brush size" className="flex flex-col gap-1">
        {BRUSH_SIZES.map((size, i) => (
          <Tooltip key={size}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  role="radio"
                  aria-checked={brushSize === size}
                  aria-label={`Brush size ${size}`}
                  onClick={() => setBrushSize(size)}
                  className={cn(brushSize === size && "bg-muted")}
                >
                  <span
                    className={cn(
                      "rounded-full",
                      DOT_CLASSES[i],
                      brushSize === size
                        ? "bg-foreground"
                        : "bg-muted-foreground"
                    )}
                  />
                </Button>
              }
            />
            <TooltipContent side="right">Brush size {size}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="my-2 h-px w-6 bg-border" />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Clear frame"
              onClick={clearFrame}
              className="text-muted-foreground"
            >
              <HugeiconsIcon icon={BrushCleaningIcon} strokeWidth={1.8} />
            </Button>
          }
        />
        <TooltipContent side="right">Clear frame</TooltipContent>
      </Tooltip>

      <div className="mt-auto flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Undo"
                disabled={!canUndo}
                onClick={undo}
                className="text-muted-foreground"
              >
                <HugeiconsIcon icon={Undo02Icon} strokeWidth={1.8} />
              </Button>
            }
          />
          <TooltipContent side="right">Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Redo"
                disabled={!canRedo}
                onClick={redo}
                className="text-muted-foreground"
              >
                <HugeiconsIcon icon={Redo02Icon} strokeWidth={1.8} />
              </Button>
            }
          />
          <TooltipContent side="right">Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
