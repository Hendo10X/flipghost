"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowDown01Icon,
  Copy01Icon,
  Delete02Icon,
  EyeIcon,
  EyeOffIcon,
  GhostIcon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { FPS_OPTIONS, ONION_MAX, useFlipbook } from "@/lib/flipbook/store"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"
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

const ONION_COUNTS = Array.from({ length: ONION_MAX + 1 }, (_, i) => i)

// One layer row is exactly this tall, and the viewport below is clamped to
// the same height, so only a single layer is ever visible — scrolling (wheel
// or the up/down buttons) snaps to the next/previous one.
const ROW_HEIGHT = 52

/** Popover for how many frames to ghost on each side, and how strongly. */
function OnionSettings() {
  const onionBefore = useFlipbook((s) => s.onionBefore)
  const onionAfter = useFlipbook((s) => s.onionAfter)
  const onionOpacity = useFlipbook((s) => s.onionOpacity)
  const setOnionBefore = useFlipbook((s) => s.setOnionBefore)
  const setOnionAfter = useFlipbook((s) => s.setOnionAfter)
  const setOnionOpacity = useFlipbook((s) => s.setOnionOpacity)

  const rows: {
    label: string
    hint: string
    value: number
    onChange: (n: number) => void
  }[] = [
    {
      label: "Before",
      hint: "bg-red-500",
      value: onionBefore,
      onChange: setOnionBefore,
    },
    {
      label: "After",
      hint: "bg-green-500",
      value: onionAfter,
      onChange: setOnionAfter,
    },
  ]

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Onion skin settings"
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Onion skin settings</TooltipContent>
      </Tooltip>

      <PopoverContent side="top" align="start" className="w-60">
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", row.hint)} />
                <span className="text-xs font-medium">{row.label}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {row.value === 0
                    ? "off"
                    : `${row.value} frame${row.value > 1 ? "s" : ""}`}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label={`Frames ghosted ${row.label.toLowerCase()}`}
                className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
              >
                {ONION_COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    role="radio"
                    aria-checked={row.value === count}
                    onClick={() => row.onChange(count)}
                    className={cn(
                      "flex-1 rounded-[5px] py-0.5 text-xs tabular-nums transition-colors select-none pointer-coarse:py-2 max-lg:py-2",
                      row.value === count
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center">
              <span className="text-xs font-medium">Opacity</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {Math.round(onionOpacity * 100)}%
              </span>
            </div>
            <Slider
              value={onionOpacity}
              onValueChange={(value) =>
                setOnionOpacity(Array.isArray(value) ? value[0] : value)
              }
              min={0.05}
              max={0.8}
              step={0.05}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Timeline() {
  const layers = useFlipbook((s) => s.layers)
  const currentLayerId = useFlipbook((s) => s.currentLayerId)
  const currentFrameIndex = useFlipbook((s) => s.currentFrameIndex)
  const selectLayer = useFlipbook((s) => s.selectLayer)
  const selectFrame = useFlipbook((s) => s.selectFrame)
  const setLayerName = useFlipbook((s) => s.setLayerName)
  const toggleLayerVisibility = useFlipbook((s) => s.toggleLayerVisibility)
  const addLayer = useFlipbook((s) => s.addLayer)
  const duplicateLayer = useFlipbook((s) => s.duplicateLayer)
  const deleteLayer = useFlipbook((s) => s.deleteLayer)
  const reorderLayers = useFlipbook((s) => s.reorderLayers)
  const addFrame = useFlipbook((s) => s.addFrame)
  const duplicateFrame = useFlipbook((s) => s.duplicateFrame)
  const deleteFrame = useFlipbook((s) => s.deleteFrame)
  const reorderFrames = useFlipbook((s) => s.reorderFrames)
  const playing = useFlipbook((s) => s.playing)
  const setPlaying = useFlipbook((s) => s.setPlaying)
  const fps = useFlipbook((s) => s.fps)
  const setFps = useFlipbook((s) => s.setFps)
  const onionSkin = useFlipbook((s) => s.onionSkin)
  const toggleOnionSkin = useFlipbook((s) => s.toggleOnionSkin)

  const frameCount = layers[0]?.frames.length ?? 0
  const dragFrameIndex = useRef<number | null>(null)
  const [dropFrameIndex, setDropFrameIndex] = useState<number | null>(null)
  const [draggingFrameIndex, setDraggingFrameIndex] = useState<number | null>(
    null
  )
  const [hoverColumn, setHoverColumn] = useState<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  // Single-layer viewport: only one layer row is visible at a time, and the
  // rest are reached by scrolling (wheel, or the up/down buttons), which
  // snaps one row at a time.
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewLayerIndex, setViewLayerIndex] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => {
    if (viewLayerIndex > layers.length - 1) {
      setViewLayerIndex(Math.max(0, layers.length - 1))
    }
  }, [layers.length])

  const goToLayer = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), layers.length - 1)
    viewportRef.current?.scrollTo({
      top: clamped * ROW_HEIGHT,
      behavior: reducedMotion ? "auto" : "smooth",
    })
    setViewLayerIndex(clamped)
  }

  // Stepping frames with the hotkeys moves the selection, which would
  // otherwise walk straight off the end of the strip and out of sight.
  useEffect(() => {
    const el =
      stripRef.current?.querySelector(
        `[data-cell-id="${currentLayerId}-${currentFrameIndex}"]`
      ) ??
      stripRef.current?.querySelector(
        `[data-frame-index="${currentFrameIndex}"]`
      )
    ;(el as HTMLElement | null)?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }, [currentLayerId, currentFrameIndex, reducedMotion])

  return (
    <section className="border-t bg-background/95 px-4 py-3 shadow-[0_-1px_0_hsl(var(--border))] backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card/80 px-3 py-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-lg"
                aria-label={playing ? "Pause" : "Play"}
                data-cuelume-toggle
                onClick={() => setPlaying(!playing)}
              >
                <HugeiconsIcon
                  icon={playing ? PauseIcon : PlayIcon}
                  strokeWidth={1.8}
                />
              </Button>
            }
          />
          <TooltipContent>
            {playing ? "Pause (Space)" : "Play (Space)"}
          </TooltipContent>
        </Tooltip>

        <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground tabular-nums">
          {currentFrameIndex + 1} / {frameCount}
        </span>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-1">
          {FPS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={fps === option}
              onClick={() => setFps(option)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs tabular-nums transition-colors select-none pointer-coarse:px-3 pointer-coarse:py-2 max-lg:px-3 max-lg:py-2",
                fps === option
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
          <span className="pr-2 text-xs text-muted-foreground">fps</span>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={onionSkin}
                data-cuelume-toggle
                onClick={toggleOnionSkin}
                className={cn(
                  "rounded-md text-muted-foreground transition-colors",
                  onionSkin && "bg-muted text-foreground"
                )}
              >
                <HugeiconsIcon icon={GhostIcon} strokeWidth={1.8} />
                Onion skin
              </Button>
            }
          />
          <TooltipContent>
            Show the previous and next frames as ghosts
          </TooltipContent>
        </Tooltip>

        <OnionSettings />

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Add layer"
                  onClick={addLayer}
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.8} />
                </Button>
              }
            />
            <TooltipContent>Add layer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Duplicate frame"
                  onClick={duplicateFrame}
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={1.8} />
                </Button>
              }
            />
            <TooltipContent>Duplicate frame</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Delete frame"
                  onClick={deleteFrame}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
                </Button>
              }
            />
            <TooltipContent>Delete frame</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border bg-card/70">
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>Layers</span>
            <span className="rounded-md border bg-background px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              standard timeline
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              Layer {layers.length === 0 ? 0 : viewLayerIndex + 1} of{" "}
              {layers.length}
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Previous layer"
                    disabled={viewLayerIndex <= 0}
                    onClick={() => goToLayer(viewLayerIndex - 1)}
                    className="rotate-180 text-muted-foreground"
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                  </Button>
                }
              />
              <TooltipContent>Previous layer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next layer"
                    disabled={viewLayerIndex >= layers.length - 1}
                    onClick={() => goToLayer(viewLayerIndex + 1)}
                    className="text-muted-foreground"
                  >
                    <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                  </Button>
                }
              />
              <TooltipContent>Next layer</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div ref={stripRef} className="relative overflow-x-auto">
          <div className="min-w-max">
            {/* Frame ruler — shared across every layer, always visible */}
            <div className="flex items-stretch border-b bg-background/95">
              <div className="flex w-72 shrink-0 items-center gap-2 border-r border-border/60 px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Frames
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5">
                {Array.from({ length: frameCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    draggable
                    data-frame-index={index}
                    onDragStart={() => {
                      dragFrameIndex.current = index
                      setDraggingFrameIndex(index)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (
                        dragFrameIndex.current !== null &&
                        dragFrameIndex.current !== index
                      ) {
                        setDropFrameIndex(index)
                      }
                    }}
                    onDragLeave={() =>
                      setDropFrameIndex((d) => (d === index ? null : d))
                    }
                    onDrop={(e) => {
                      e.preventDefault()
                      if (dragFrameIndex.current !== null) {
                        reorderFrames(dragFrameIndex.current, index)
                      }
                      dragFrameIndex.current = null
                      setDropFrameIndex(null)
                      setDraggingFrameIndex(null)
                    }}
                    onDragEnd={() => {
                      dragFrameIndex.current = null
                      setDropFrameIndex(null)
                      setDraggingFrameIndex(null)
                    }}
                    onMouseEnter={() => setHoverColumn(index)}
                    onMouseLeave={() => setHoverColumn(null)}
                    onClick={() => selectFrame(index)}
                    aria-label={`Frame ${index + 1}`}
                    className={cn(
                      "relative h-9 w-16 shrink-0 border border-border/70 bg-muted/30 text-xs font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      currentFrameIndex === index &&
                        "border-primary bg-primary/5 text-foreground",
                      dropFrameIndex === index && "border-ring",
                      draggingFrameIndex === index && "opacity-40",
                      hoverColumn === index &&
                        draggingFrameIndex === null &&
                        currentFrameIndex !== index &&
                        "border-foreground/40"
                    )}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">
                      {index + 1}
                    </span>
                  </button>
                ))}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="outline"
                        aria-label="Add frame"
                        data-cuelume-press
                        data-cuelume-release
                        onClick={addFrame}
                        className="h-9 w-16 shrink-0 border-dashed text-muted-foreground"
                      >
                        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.8} />
                      </Button>
                    }
                  />
                  <TooltipContent>Add a blank frame</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Exactly one layer's row is visible here; scrolling (wheel or
                the up/down buttons above) snaps to the next/previous one. */}
            <div
              ref={viewportRef}
              style={{ height: ROW_HEIGHT, scrollSnapType: "y mandatory" }}
              className="overflow-y-auto"
              onScroll={(e) => {
                const idx = Math.round(
                  e.currentTarget.scrollTop / ROW_HEIGHT
                )
                setViewLayerIndex(
                  Math.min(Math.max(idx, 0), layers.length - 1)
                )
              }}
            >
              {layers.map((layer, layerIndex) => {
                const active = layer.id === currentLayerId
                return (
                  <div
                    key={layer.id}
                    style={{ height: ROW_HEIGHT, scrollSnapAlign: "start" }}
                    className={cn(
                      "flex items-stretch border-b border-border/60 last:border-b-0",
                      active && "bg-muted/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex w-72 shrink-0 items-center gap-1.5 border-r border-border/60 bg-card/95 px-2.5",
                        active && "bg-muted/60"
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={
                                layer.visible ? "Hide layer" : "Show layer"
                              }
                              aria-pressed={layer.visible}
                              onClick={() => toggleLayerVisibility(layer.id)}
                              className="text-muted-foreground"
                            >
                              <HugeiconsIcon
                                icon={layer.visible ? EyeIcon : EyeOffIcon}
                                strokeWidth={1.8}
                              />
                            </Button>
                          }
                        />
                        <TooltipContent side="bottom">
                          {layer.visible ? "Hide layer" : "Show layer"}
                        </TooltipContent>
                      </Tooltip>

                      <input
                        value={layer.name || `Layer ${layerIndex + 1}`}
                        onChange={(e) => setLayerName(layer.id, e.target.value)}
                        aria-label={`Layer name ${layerIndex + 1}`}
                        spellCheck={false}
                        className="min-w-0 flex-1 border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none placeholder:text-muted-foreground focus:border-border focus:bg-background"
                      />

                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Move layer up"
                                disabled={layerIndex === 0}
                                onClick={() =>
                                  reorderLayers(layerIndex, layerIndex - 1)
                                }
                                className="rotate-180 text-muted-foreground"
                              >
                                <HugeiconsIcon
                                  icon={ArrowDown01Icon}
                                  strokeWidth={2}
                                />
                              </Button>
                            }
                          />
                          <TooltipContent side="bottom">
                            Move layer up
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Move layer down"
                                disabled={layerIndex === layers.length - 1}
                                onClick={() =>
                                  reorderLayers(layerIndex, layerIndex + 1)
                                }
                                className="text-muted-foreground"
                              >
                                <HugeiconsIcon
                                  icon={ArrowDown01Icon}
                                  strokeWidth={2}
                                />
                              </Button>
                            }
                          />
                          <TooltipContent side="bottom">
                            Move layer down
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Duplicate layer"
                                onClick={() => {
                                  selectLayer(layer.id)
                                  duplicateLayer()
                                  const state = useFlipbook.getState()
                                  const newLayerId = state.currentLayerId
                                  const newIndex = state.layers.findIndex(
                                    (l) => l.id === newLayerId
                                  )
                                  if (newLayerId && newIndex !== -1) {
                                    setLayerName(
                                      newLayerId,
                                      `Layer ${newIndex + 1}`
                                    )
                                  }
                                }}
                                className="text-muted-foreground"
                              >
                                <HugeiconsIcon
                                  icon={Copy01Icon}
                                  strokeWidth={1.8}
                                />
                              </Button>
                            }
                          />
                          <TooltipContent side="bottom">
                            Duplicate layer
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Delete layer"
                                onClick={() => {
                                  selectLayer(layer.id)
                                  deleteLayer()
                                }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <HugeiconsIcon
                                  icon={Delete02Icon}
                                  strokeWidth={1.8}
                                />
                              </Button>
                            }
                          />
                          <TooltipContent side="bottom">
                            Delete layer
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-4">
                      {layer.frames.map((frame, frameIndex) => (
                        <button
                          key={frame.id}
                          type="button"
                          data-cell-id={`${layer.id}-${frameIndex}`}
                          onClick={() => {
                            selectLayer(layer.id)
                            selectFrame(frameIndex)
                          }}
                          onMouseEnter={() => setHoverColumn(frameIndex)}
                          onMouseLeave={() => setHoverColumn(null)}
                          aria-label={`${layer.name || `Layer ${layerIndex + 1}`}, frame ${frameIndex + 1}`}
                          aria-current={
                            active && frameIndex === currentFrameIndex
                              ? "true"
                              : undefined
                          }
                          className={cn(
                            "relative h-9 w-16 shrink-0 cursor-pointer border border-border/70 bg-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active &&
                              frameIndex === currentFrameIndex &&
                              "border-primary",
                            !layer.visible && "opacity-40",
                            draggingFrameIndex === frameIndex && "opacity-40",
                            hoverColumn === frameIndex &&
                              draggingFrameIndex === null &&
                              !(active && frameIndex === currentFrameIndex) &&
                              "border-foreground/40"
                          )}
                        >
                          {frame.dataUrl && (
                            // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
                            <img
                              src={frame.dataUrl}
                              alt=""
                              draggable={false}
                              className="size-full object-contain select-none"
                            />
                          )}
                          <span className="absolute bottom-0.5 left-1.5 text-[10px] font-medium text-black/40 select-none">
                            {frameIndex + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
