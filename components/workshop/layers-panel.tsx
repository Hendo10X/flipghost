"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
  Copy01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  EyeIcon,
  EyeOffIcon,
  LayerAddIcon,
  Layers01Icon,
  LockIcon,
  PencilEdit02Icon,
  SquareUnlock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  activeLayerIndex,
  ensureFrameLayers,
  layerCount,
  useFlipbook,
  type FrameLayer,
} from "@/lib/flipbook/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function objectCount(layer: FrameLayer) {
  const objects = layer.json?.objects
  return Array.isArray(objects) ? objects.length : 0
}

interface DragState {
  /** Index in the displayLayers array (reversed: top-of-stack first). */
  from: number
  over: number
}

export function LayersPanel() {
  const frames = useFlipbook((s) => s.frames)
  const currentId = useFlipbook((s) => s.currentId)
  const addLayer = useFlipbook((s) => s.addLayer)
  const duplicateLayer = useFlipbook((s) => s.duplicateLayer)
  const deleteLayer = useFlipbook((s) => s.deleteLayer)
  const renameLayer = useFlipbook((s) => s.renameLayer)
  const selectLayer = useFlipbook((s) => s.selectLayer)
  const reorderLayers = useFlipbook((s) => s.reorderLayers)
  const toggleLayerHidden = useFlipbook((s) => s.toggleLayerHidden)
  const toggleLayerLocked = useFlipbook((s) => s.toggleLayerLocked)
  const setLayerOpacity = useFlipbook((s) => s.setLayerOpacity)

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)

  const frame = useMemo(
    () => ensureFrameLayers(frames.find((item) => item.id === currentId) ?? frames[0]),
    [frames, currentId]
  )
  const layers = frame.layers ?? []
  const activeIndex = activeLayerIndex(frame)

  // displayLayers: top-of-stack first (reversed from the internal bottom-to-top array)
  const displayLayers = useMemo(
    () => layers.map((layer, index) => ({ layer, index })).reverse(),
    [layers]
  )

  // ---------------------------------------------------------------------------
  // Pointer-based drag-and-drop (works for mouse AND touch)
  // ---------------------------------------------------------------------------
  const [drag, setDrag] = useState<DragState | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  /** displayIdx → store index (bottom-to-top) */
  const toStoreIndex = useCallback(
    (displayIdx: number) => layers.length - 1 - displayIdx,
    [layers.length]
  )

  const hitTestItems = useCallback((clientY: number): number => {
    if (!listRef.current) return 0
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-layer-item]")
    let closest = 0
    let minDist = Infinity
    items.forEach((item, i) => {
      const rect = item.getBoundingClientRect()
      const center = rect.top + rect.height / 2
      const dist = Math.abs(clientY - center)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    return closest
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, displayIdx: number) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrag({ from: displayIdx, over: displayIdx })
    },
    []
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag) return
      const over = hitTestItems(e.clientY)
      if (over !== drag.over) setDrag((d) => d && { ...d, over })
    },
    [drag, hitTestItems]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!drag) return
      e.currentTarget.releasePointerCapture(e.pointerId)
      const { from, over } = drag
      setDrag(null)
      if (from !== over) {
        reorderLayers(toStoreIndex(from), toStoreIndex(over))
      }
    },
    [drag, reorderLayers, toStoreIndex]
  )

  // Apply drag preview: show the item at the drop target position
  const orderedDisplay = useMemo(() => {
    if (!drag || drag.from === drag.over) return displayLayers
    const arr = [...displayLayers]
    const [moved] = arr.splice(drag.from, 1)
    arr.splice(drag.over, 0, moved)
    return arr
  }, [displayLayers, drag])

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="lg"
                  aria-label="Layers"
                  className="relative gap-1.5 text-muted-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
                >
                  <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.8} />
                  Layers
                  <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums shadow-sm">
                    {activeIndex + 1}
                  </span>
                </Button>
              }
            />
          }
        />
        <TooltipContent>
          Layer {activeIndex + 1} of {layerCount(frame)}
        </TooltipContent>
      </Tooltip>

      <PopoverContent side="top" align="end" className="w-80 p-2">
        {/* ── Header ── */}
        <div className="flex items-center gap-1 border-b px-1 pb-2">
          <div className="min-w-0">
            <div className="text-xs font-semibold">Layers</div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              Frame has {layers.length} layer{layers.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="New layer"
                    onClick={addLayer}
                    className="text-muted-foreground"
                  >
                    <HugeiconsIcon icon={LayerAddIcon} strokeWidth={1.8} />
                  </Button>
                }
              />
              <TooltipContent>New layer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Duplicate layer"
                    onClick={duplicateLayer}
                    className="text-muted-foreground"
                  >
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={1.8} />
                  </Button>
                }
              />
              <TooltipContent>Duplicate layer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete layer"
                    onClick={deleteLayer}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
                  </Button>
                }
              />
              <TooltipContent>Delete layer</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Layer list ── */}
        <div
          ref={listRef}
          className="mt-2 flex max-h-80 flex-col gap-0.5 overflow-y-auto pr-1"
          onPointerMove={drag ? handlePointerMove : undefined}
          onPointerUp={drag ? handlePointerUp : undefined}
        >
          {orderedDisplay.map(({ layer, index }, displayIdx) => {
            const selected = layer.id === frame.activeLayerId
            const count = objectCount(layer)
            const isDraggingThis = drag?.from === displayIdx
            const isDropTarget = drag !== null && drag.over === displayIdx && drag.from !== displayIdx

            return (
              <div
                key={layer.id}
                data-layer-item
                data-layer-id={layer.id}
                className={cn(
                  "group relative rounded-lg transition-[background-color,box-shadow,opacity,transform] duration-100",
                  selected
                    ? "bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.35)]"
                    : "hover:bg-muted/70",
                  isDraggingThis && "opacity-40 scale-[0.98]",
                  isDropTarget && "ring-1 ring-primary/50 ring-inset"
                )}
              >
                {/* Drop indicator line */}
                {isDropTarget && (
                  <div className="pointer-events-none absolute -top-px left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}

                {/* ── Row: click anywhere (except controls) to select ── */}
                <div
                  role="button"
                  tabIndex={0}
                  className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => selectLayer(layer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      selectLayer(layer.id)
                    }
                  }}
                  aria-current={selected ? "true" : undefined}
                  aria-label={`Select ${layer.name}`}
                >
                  {/* Drag handle */}
                  <div
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground/40 transition-colors select-none",
                      "cursor-grab active:cursor-grabbing",
                      "group-hover:text-muted-foreground",
                      drag && "cursor-grabbing"
                    )}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      handlePointerDown(e, displayIdx)
                    }}
                    aria-hidden
                    title="Drag to reorder"
                  >
                    <HugeiconsIcon
                      icon={DragDropVerticalIcon}
                      size={14}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex items-center gap-1.5">
                      {editingLayerId === layer.id ? (
                        <input
                          autoFocus
                          key={layer.id}
                          defaultValue={layer.name}
                          onBlur={(e) => {
                            renameLayer(layer.id, e.currentTarget.value)
                            setEditingLayerId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameLayer(layer.id, e.currentTarget.value)
                              setEditingLayerId(null)
                            } else if (e.key === "Escape") {
                              setEditingLayerId(null)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Rename ${layer.name}`}
                          className="h-5 w-fit min-w-[64px] max-w-[130px] rounded bg-background px-1.5 text-xs font-medium ring-1 ring-ring outline-none shadow-xs"
                        />
                      ) : (
                        <span
                          role="button"
                          tabIndex={-1}
                          title={selected ? "Click to rename" : `Select ${layer.name}`}
                          onClick={(e) => {
                            if (selected) {
                              e.stopPropagation()
                              setEditingLayerId(layer.id)
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            selectLayer(layer.id)
                            setEditingLayerId(layer.id)
                          }}
                          className={cn(
                            "inline-block max-w-[130px] truncate rounded px-1.5 py-0.5 text-xs font-medium transition-colors",
                            selected
                              ? "cursor-text hover:bg-background/80 hover:ring-1 hover:ring-border/60"
                              : "hover:text-foreground"
                          )}
                        >
                          {layer.name}
                        </span>
                      )}

                      {/* Rename hint button shown when selected */}
                      {selected && editingLayerId !== layer.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingLayerId(layer.id)
                          }}
                          title="Rename layer"
                          className="hidden size-4 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:text-foreground sm:inline-flex opacity-70 hover:opacity-100"
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={11} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>

                    <div className="px-1.5 text-[10px] text-muted-foreground tabular-nums select-none">
                      {count} object{count === 1 ? "" : "s"} · {Math.round(layer.opacity * 100)}%
                    </div>
                  </div>

                  {/* Visibility + lock */}
                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-0.5 transition-all duration-150",
                      layer.hidden || layer.locked
                        ? "opacity-100"
                        : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={layer.hidden ? "Show layer" : "Hide layer"}
                          aria-pressed={!layer.hidden}
                          onClick={() => toggleLayerHidden(layer.id)}
                          className={cn(
                            "size-7 rounded-md transition-colors",
                            layer.hidden
                              ? "bg-muted text-foreground hover:bg-muted/80 shadow-xs"
                              : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                          )}
                        >
                          <HugeiconsIcon
                            icon={layer.hidden ? EyeOffIcon : EyeIcon}
                            size={14}
                            strokeWidth={1.8}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {layer.hidden ? "Show layer" : "Hide layer"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
                          aria-pressed={layer.locked}
                          onClick={() => toggleLayerLocked(layer.id)}
                          className={cn(
                            "size-7 rounded-md transition-colors",
                            layer.locked
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 shadow-xs"
                              : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                          )}
                        >
                          <HugeiconsIcon
                            icon={layer.locked ? LockIcon : SquareUnlock01Icon}
                            size={14}
                            strokeWidth={1.8}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {layer.locked ? "Unlock layer" : "Lock layer"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* ── Opacity slider — only for the selected layer ── */}
                {selected && (
                  <div className="flex items-center gap-2 px-2 pb-2">
                    <span className="w-12 shrink-0 text-[10px] text-muted-foreground">
                      Opacity
                    </span>
                    <Slider
                      value={layer.opacity}
                      onValueChange={(value) =>
                        setLayerOpacity(
                          layer.id,
                          Array.isArray(value) ? value[0] : value
                        )
                      }
                      min={0.05}
                      max={1}
                      step={0.05}
                      className="flex-1"
                    />
                    <span className="w-7 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
