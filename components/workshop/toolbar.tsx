"use client"

import { useEffect, useState } from "react"
import {
  ArrowDown01Icon,
  BrushCleaningIcon,
  Cursor01Icon,
  DropperIcon,
  EraserIcon,
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

const TOOLS: { tool: Tool; label: string; icon: typeof PencilEdit02Icon }[] = [
  { tool: "select", label: "Select (V)", icon: Cursor01Icon },
  { tool: "brush", label: "Brush (B)", icon: PencilEdit02Icon },
  { tool: "eraser", label: "Eraser (E)", icon: EraserIcon },
]

/**
 * Ten presets, because dragging a saturation square to find plain red is a
 * silly way to spend a second you could have spent drawing. Fixed rather than
 * editable: a palette the user can add to is a palette they expect to still be
 * there tomorrow, and that means storing it per project and persisting it,
 * which is a real feature rather than a toolbar tweak.
 *
 * Ink is the store's default brush colour, so the palette shows a selection
 * the moment it opens rather than looking like nothing is chosen. Two rows of
 * five at w-44 lines the grid up with the picker above it.
 */
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

/**
 * Whether a tick drawn on this swatch should be black or white. A ring around
 * the selected swatch cannot work here: the grid is exactly as wide as the
 * picker above it, so a ring sitting outside the swatch would push past that
 * edge and knock the row out of line with everything else in the popover.
 * The mark has to live inside the swatch, which means it has to survive both
 * White and Ink.
 */
function needsDarkTick(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Rec. 601 luma: green reads far brighter to the eye than blue does.
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
        // Same inset hairline the trigger swatch uses, and what keeps White
        // visible against a light popover.
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

  /**
   * Recorded when the popover closes, not as the colour changes: dragging the
   * picker fires a change per pointer move, and every muddy shade you passed
   * through on the way is not a colour you chose. Presets are skipped — they
   * are already one row up, and echoing them into Recent would push out the
   * mixed colours this row exists to keep.
   */
  function onPickerOpenChange(open: boolean) {
    setPickerOpen(open)
    if (open) {
      // Coming back to the popover means choosing a colour some other way, so
      // disarm the dropper. Otherwise it stays armed behind the popover and the
      // next stroke you try to draw silently samples a colour instead.
      if (tool === "eyedropper") setTool("brush")
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
    // Every control in here is icon-only, so they all grow to a 44px target
    // together and the rail widens to hold them. Keyed off both a coarse
    // pointer (a real tablet, at any width) and tablet widths (a desktop
    // browser resized down, which reports a fine pointer).
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
                    // Sampling closes the popover, so without this the rail
                    // would show no active tool at all and the mode would be
                    // invisible until you clicked something.
                    className={cn(tool === "eyedropper" && "bg-muted")}
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
            {tool === "eyedropper" ? "Click the canvas to pick" : "Brush color"}
          </TooltipContent>
        </Tooltip>
        <PopoverContent side="right" align="start" className="w-auto">
          {/* Presets first and the picker folded away: reaching for red is the
              common errand, and it was sitting underneath a 176px saturation
              square. react-colorful is 200px wide by default, so the w-44 on it
              is what holds it inside this column. */}
          <div className="flex w-44 flex-col gap-3 [&_.react-colorful]:h-44 [&_.react-colorful]:w-44">
            <div
              role="radiogroup"
              aria-label="Palette"
              className="grid grid-cols-5 gap-1.5"
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
                  <span className="text-[10px] text-muted-foreground">
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
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Pick a colour from the canvas"
                onClick={() => {
                  // The popover sits over the thing you are trying to click.
                  setPickerOpen(false)
                  setTool("eyedropper")
                }}
              >
                <HugeiconsIcon icon={DropperIcon} strokeWidth={1.8} />
              </Button>
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
