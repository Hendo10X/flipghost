"use client"

import { useEffect, useRef, useState } from "react"
import {
  Add01Icon,
  BrushCleaningIcon,
  Cursor01Icon,
  Delete02Icon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

const DEFAULT_COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#78716c",
  "#9ca3af",
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

  const canUndo = useFlipbook((s) => s.past.length > 0)
  const canRedo = useFlipbook((s) => s.future.length > 0)

  const [palette, setPalette] = useState(DEFAULT_COLORS)
  const [showPicker, setShowPicker] = useState(false)
  const paletteScrollRef = useRef<HTMLDivElement>(null)
  const prevPaletteLength = useRef(palette.length)

  const addCurrentColor = () => {
    if (!palette.includes(brushColor)) {
      setPalette([...palette, brushColor])
    }
  }

  useEffect(() => {
    // Only auto-scroll when a color was added (not on delete or initial mount)
    if (palette.length > prevPaletteLength.current) {
      paletteScrollRef.current?.scrollTo({
        top: paletteScrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
    prevPaletteLength.current = palette.length
  }, [palette.length])

  const isColorInPalette = palette.includes(brushColor)

  const deleteCurrentColor = () => {
    if (!isColorInPalette || palette.length <= 1) return

    const index = palette.indexOf(brushColor)
    const nextPalette = palette.filter((color) => color !== brushColor)
    setPalette(nextPalette)

    const fallback =
      nextPalette[index] ?? nextPalette[index - 1] ?? nextPalette[0]
    setBrushColor(fallback)
  }

  return (
    <aside className="flex w-12 flex-col items-center gap-1 border-r py-3 pointer-coarse:w-16 max-lg:w-16 pointer-coarse:[&_[data-slot=button]]:size-11 max-lg:[&_[data-slot=button]]:size-11">
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

      {/* COLOR PICKER */}
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
                      className="size-5 rounded-md border shadow-sm"
                      style={{ backgroundColor: brushColor }}
                    />
                  </Button>
                }
              />
            }
          />
          <TooltipContent side="right">
            Brush Color
          </TooltipContent>
        </Tooltip>

        <PopoverContent side="right" align="start" className="w-56">
          <div className="space-y-4">

            {/* Current Color */}
            <div className="flex items-center gap-2">
              <div
                className="size-10 rounded-md border"
                style={{ backgroundColor: brushColor }}
              />

              <HexColorInput
                prefixed
                color={brushColor}
                onChange={setBrushColor}
                className="h-9 flex-1 rounded-md border text-sm outline-none"
              />
            </div>

            {/* Palette */}
            <div ref={paletteScrollRef} className="max-h-40 overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-2">
                {palette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBrushColor(color)}
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-md border transition-all hover:scale-105",
                      brushColor === color &&
                        "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Add / delete actions (always visible, outside scroll area) */}
            <div className="flex items-center gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowPicker(!showPicker)}
              >
                <HugeiconsIcon icon={Add01Icon} size={18} />
              </Button>

              {isColorInPalette && palette.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Delete selected color"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={deleteCurrentColor}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={18} />
                </Button>
              )}
            </div>

            {showPicker && (
              <div className="space-y-3 border-t pt-3">
                <HexColorPicker
                  color={brushColor}
                  onChange={setBrushColor}
                />

                <Button
                  className="w-full"
                  onClick={addCurrentColor}
                >
                  Add Current Color
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className="my-2 h-px w-6 bg-border" />

      <div
        role="radiogroup"
        aria-label="Brush size"
        className="flex flex-col gap-1"
      >
        {BRUSH_SIZES.map((size, i) => (
          <Tooltip key={size}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  role="radio"
                  aria-checked={brushSize === size}
                  onClick={() => setBrushSize(size)}
                  className={cn(
                    brushSize === size && "bg-muted"
                  )}
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
            <TooltipContent side="right">
              Brush size {size}
            </TooltipContent>
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
              onClick={clearFrame}
              className="text-muted-foreground"
            >
              <HugeiconsIcon
                icon={BrushCleaningIcon}
                strokeWidth={1.8}
              />
            </Button>
          }
        />
        <TooltipContent side="right">
          Clear frame
        </TooltipContent>
      </Tooltip>

      <div className="mt-auto flex flex-col gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                disabled={!canUndo}
                onClick={undo}
                className="text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={Undo02Icon}
                  strokeWidth={1.8}
                />
              </Button>
            }
          />
          <TooltipContent side="right">
            Undo (Ctrl+Z)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                disabled={!canRedo}
                onClick={redo}
                className="text-muted-foreground"
              >
                <HugeiconsIcon
                  icon={Redo02Icon}
                  strokeWidth={1.8}
                />
              </Button>
            }
          />
          <TooltipContent side="right">
            Redo (Ctrl+Shift+Z)
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}