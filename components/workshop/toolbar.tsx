"use client"

import { useEffect, useState } from "react"
import {
  ArrowDown01Icon,
  BrushCleaningIcon,
  Cursor01Icon,
  DropperIcon,
  EraserIcon,
  PaintBucketIcon,
  PencilEdit02Icon,
  Redo02Icon,
  Tick02Icon,
  Undo02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { HexColorInput, HexColorPicker } from "react-colorful"

import {
  loadRecentColors,
  saveRecentColors,
  withRecentColor,
} from "@/lib/flipbook/recent-colors"
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

// Paint Bucket added to the main tools list under Eraser
const TOOLS: { tool: Tool; label: string; icon: typeof PencilEdit02Icon }[] = [
  { tool: "select", label: "Select (V)", icon: Cursor01Icon },
  { tool: "brush", label: "Brush (B)", icon: PencilEdit02Icon },
  { tool: "eraser", label: "Eraser (E)", icon: EraserIcon },
  { tool: "bucket", label: "Paint Bucket", icon: PaintBucketIcon },
]

const PALETTE = [
  { name: "Ink", value: "#1a1a1a" },
  { name: "White", value: "#ffffff" },
  { name: "Grey", value: "#9ca3af" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#facc15" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
] as const

function needsDarkTick(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

function Swatch({
  color,
  label,
  selected,
  onSelect,
}: {
  color: string
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      data-cuelume-toggle
      onClick={onSelect}
      style={{ backgroundColor: color }}
      className={cn(
        "flex aspect-square items-center justify-center rounded-md outline-none",
        "ring-1 ring-black/15 ring-inset dark:ring-white/20",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      )}
    >
      {selected && (
        <HugeiconsIcon
          icon={Tick02Icon}
          className={cn(
            "size-3.5",
            needsDarkTick(color) ? "text-black" : "text-white"
          )}
          strokeWidth={2.5}
        />
      )}
    </button>
  )
}

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

  const [pickerOpen, setPickerOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [recent, setRecent] = useState<string[]>([])

  const currentColor = brushColor.toLowerCase()
  const isPreset = PALETTE.some((p) => p.value === currentColor)

  useEffect(() => {
    let cancelled = false
    loadRecentColors().then((colors) => {
      if (!cancelled) setRecent(colors)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function onPickerOpenChange(open: boolean) {
    setPickerOpen(open)
    if (open) {
      if (tool === "eyedropper" || tool === "bucket") setTool("brush")
      return
    }
    setShowCustom(false)
    if (isPreset) return
    setRecent((list) => {
      const next = withRecentColor(list, currentColor)
      if (next !== list) saveRecentColors(next)
      return next
    })
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
                data-cuelume-toggle
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

      <Popover open={pickerOpen} onOpenChange={onPickerOpenChange}>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Brush color"
                    className={cn(
                      (tool === "eyedropper" || tool === "bucket") && "bg-muted"
                    )}
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
          <TooltipContent side="right">
            {tool === "eyedropper"
              ? "Click the canvas to pick"
              : tool === "bucket"
              ? "Click the canvas to fill"
              : "Brush color"}
          </TooltipContent>
        </Tooltip>
        <PopoverContent side="right" align="start" className="w-auto">
          <div
            className="
              flex w-35 flex-col gap-2 overflow-hidden
              [&_.react-colorful]:w-full
              [&_.react-colorful]:h-33
              [&_.react-colorful]:max-w-full
              [&_.react-colorful__saturation]:rounded-md
              [&_.react-colorful__hue]:w-full
            "
          >
            <div
              role="radiogroup"
              aria-label="Palette"
              className="grid grid-cols-5 gap-1"
            >
              {PALETTE.map(({ name, value }) => (
                <Swatch
                  key={value}
                  color={value}
                  label={name}
                  selected={currentColor === value}
                  onSelect={() => setBrushColor(value)}
                />
              ))}
            </div>

            {recent.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-muted-foreground">
                    Recent
                  </span>
                  <div
                    role="radiogroup"
                    aria-label="Recent colours"
                    className="grid grid-cols-5 gap-1.5"
                  >
                    {recent.map((color) => (
                      <Swatch
                        key={color}
                        color={color}
                        label={color}
                        selected={currentColor === color}
                        onSelect={() => setBrushColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="h-px bg-border" />

            <div className="flex items-center gap-1.5">
              <HexColorInput
                prefixed
                color={brushColor}
                onChange={setBrushColor}
                aria-label="Hex color"
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
              />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant={tool === "eyedropper" ? "secondary" : "outline"}
                      size="icon-lg"
                      aria-label="Eye Drop"
                      onClick={() => {
                        setPickerOpen(false)
                        setTool("eyedropper")
                      }}
                    >
                      <HugeiconsIcon icon={DropperIcon} strokeWidth={1.8} />
                    </Button>
                  }
                />
                <TooltipContent side="top">Eye Drop</TooltipContent>
              </Tooltip>
            </div>

            <button
              type="button"
              aria-expanded={showCustom}
              onClick={() => setShowCustom((v) => !v)}
              className="flex items-center gap-1 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className={cn(
                  "size-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                  showCustom && "rotate-180"
                )}
                strokeWidth={1.8}
              />
              Custom
            </button>

            {showCustom && (
              <HexColorPicker color={brushColor} onChange={setBrushColor} />
            )}
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