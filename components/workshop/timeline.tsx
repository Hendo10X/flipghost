"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowDown01Icon,
  Copy01Icon,
  Delete02Icon,
  GhostIcon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
  Settings01Icon,
  VolumeHighIcon,
  VolumeOffIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { FPS_OPTIONS, ONION_MAX, useFlipbook, type AudioTrack } from "@/lib/flipbook/store"
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

/** Popover for Audio track settings (start frame, volume, mute, offset, remove). */
function AudioSettingsPopover() {
  const audioTrack = useFlipbook((s) => s.audioTrack)
  const updateAudioTrack = useFlipbook((s) => s.updateAudioTrack)
  const removeAudioTrack = useFlipbook((s) => s.removeAudioTrack)
  const frames = useFlipbook((s) => s.frames)

  if (!audioTrack) return null

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
                  aria-label="Audio settings"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={Settings01Icon} strokeWidth={1.8} />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Audio track settings</TooltipContent>
      </Tooltip>

      <PopoverContent side="top" align="center" className="w-72 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="truncate text-xs font-medium" title={audioTrack.name}>
              {audioTrack.name}
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={removeAudioTrack}
              className="text-xs text-destructive hover:bg-destructive/10"
            >
              Remove
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Start Frame</span>
              <span className="text-muted-foreground tabular-nums">
                Frame {audioTrack.startFrame + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                aria-label="Audio start frame"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={audioTrack.startFrame}
                onChange={(e) =>
                  updateAudioTrack({ startFrame: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Volume</span>
              <span className="text-muted-foreground tabular-nums">
                {audioTrack.muted ? "Muted" : `${Math.round(audioTrack.volume * 100)}%`}
              </span>
            </div>
            <Slider
              value={[audioTrack.muted ? 0 : audioTrack.volume]}
              onValueChange={(val) => {
                const value = Array.isArray(val) ? val[0] : val
                updateAudioTrack({ volume: value, muted: value === 0 })
              }}
              min={0}
              max={1}
              step={0.05}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Audio Start Offset</span>
              <span className="text-muted-foreground tabular-nums">
                {audioTrack.offset.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              aria-label="Audio start offset"
              min={0}
              max={Math.max(0, audioTrack.duration - 0.5)}
              step={0.1}
              value={audioTrack.offset}
              onChange={(e) =>
                updateAudioTrack({ offset: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AudioWaveformCanvas({
  dataUrl,
  width,
  height,
}: {
  dataUrl: string
  width: number
  height: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let active = true
    const canvas = canvasRef.current
    if (!canvas || !dataUrl || width <= 0 || height <= 0) return

    async function drawWaveform() {
      try {
        const response = await fetch(dataUrl)
        const arrayBuffer = await response.arrayBuffer()
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioContextClass()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        if (!active || !canvas) return

        const channelData = audioBuffer.getChannelData(0)
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, width, height)
        const step = Math.max(1, Math.ceil(channelData.length / width))
        const amp = height / 2

        ctx.fillStyle = "rgba(56, 189, 248, 0.4)"

        for (let i = 0; i < width; i++) {
          let min = 1.0
          let max = -1.0
          for (let j = 0; j < step; j++) {
            const datum = channelData[i * step + j]
            if (datum !== undefined) {
              if (datum < min) min = datum
              if (datum > max) max = datum
            }
          }
          const y1 = (1 + min) * amp
          const y2 = (1 + max) * amp
          ctx.fillRect(i, y1, 1.5, Math.max(1, y2 - y1))
        }
        audioCtx.close()
      } catch {
        // Fallback gracefully if audio decoding is unsupported or blocked
      }
    }

    drawWaveform()
    return () => {
      active = false
    }
  }, [dataUrl, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 size-full opacity-60"
    />
  )
}

function AudioTrackBar({
  audioTrack,
  fps,
  updateAudioTrack,
  frameStepPx,
}: {
  audioTrack: AudioTrack
  fps: number
  updateAudioTrack: (partial: Partial<AudioTrack>) => void
  frameStepPx: number
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<"move" | "offset" | "trimStart" | "trimEnd" | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const startXRef = useRef(0)
  const startFrameRef = useRef(audioTrack.startFrame)
  const startOffsetRef = useRef(audioTrack.offset)
  const startDurationRef = useRef(audioTrack.duration)
  const startTrimDurationRef = useRef(
    audioTrack.trimDuration ?? audioTrack.duration - audioTrack.offset
  )

  const activeDuration = Math.min(
    audioTrack.duration - audioTrack.offset,
    audioTrack.trimDuration ?? audioTrack.duration - audioTrack.offset
  )
  const audioSpanFrames = Math.max(1, Math.ceil(activeDuration * fps))
  const trackWidthPx = Math.max(48, audioSpanFrames * frameStepPx - 8)
  const trackLeftPx = audioTrack.startFrame * frameStepPx

  const handlePointerDown = (
    e: React.PointerEvent,
    type: "move" | "offset" | "trimStart" | "trimEnd"
  ) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    const effectiveType = type === "move" && e.shiftKey ? "offset" : type

    setDragType(effectiveType)
    setIsDragging(true)
    startXRef.current = e.clientX
    startFrameRef.current = audioTrack.startFrame
    startOffsetRef.current = audioTrack.offset
    startDurationRef.current = audioTrack.duration
    startTrimDurationRef.current =
      audioTrack.trimDuration ?? audioTrack.duration - audioTrack.offset
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragType) return
    const deltaX = e.clientX - startXRef.current

    if (dragType === "move") {
      const frameDelta = Math.round(deltaX / frameStepPx)
      const nextStartFrame = Math.max(0, startFrameRef.current + frameDelta)
      if (nextStartFrame !== audioTrack.startFrame) {
        updateAudioTrack({ startFrame: nextStartFrame })
      }
      setActiveTooltip(`Start: Frame ${nextStartFrame + 1}`)
    } else if (dragType === "offset" || dragType === "trimStart") {
      const secondsDelta = deltaX / 100
      const nextOffset = Math.max(
        0,
        Math.min(startDurationRef.current - 0.2, startOffsetRef.current + secondsDelta)
      )
      updateAudioTrack({ offset: nextOffset })
      setActiveTooltip(`Trim Start: ${nextOffset.toFixed(2)}s`)
    } else if (dragType === "trimEnd") {
      const secondsDelta = deltaX / (frameStepPx * fps)
      const maxPossibleDuration = startDurationRef.current - audioTrack.offset
      const nextTrimDuration = Math.max(
        0.5,
        Math.min(maxPossibleDuration, startTrimDurationRef.current + secondsDelta)
      )
      updateAudioTrack({ trimDuration: nextTrimDuration })
      setActiveTooltip(`Length: ${nextTrimDuration.toFixed(1)}s`)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
      setIsDragging(false)
      setDragType(null)
      setActiveTooltip(null)
    }
  }

  return (
    <div className="relative h-8 min-w-full rounded-md bg-muted/60 p-0.5 select-none">
      {/* Active dragging tooltip badge */}
      {isDragging && activeTooltip && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 rounded bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-md animate-in fade-in-0">
          {activeTooltip}
        </div>
      )}

      <div
        style={{
          left: `${trackLeftPx}px`,
          width: `${trackWidthPx}px`,
        }}
        onPointerDown={(e) => handlePointerDown(e, "move")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "group/track absolute top-0.5 bottom-0.5 flex items-center gap-1.5 overflow-hidden rounded bg-sky-500/25 text-sky-700 dark:bg-sky-500/35 dark:text-sky-200 border border-sky-500/50 px-2 text-[11px] font-medium shadow-sm transition-shadow",
          isDragging ? "cursor-grabbing ring-2 ring-primary" : "cursor-grab hover:border-sky-500/80"
        )}
      >
        <AudioWaveformCanvas
          dataUrl={audioTrack.dataUrl}
          width={trackWidthPx}
          height={28}
        />

        {/* Trim Start Handle (Left edge handle) */}
        <div
          title="Drag left handle to trim start (or Shift+Drag track)"
          onPointerDown={(e) => handlePointerDown(e, "trimStart")}
          className="absolute left-0 top-0 bottom-0 z-20 flex w-3 items-center justify-center cursor-ew-resize bg-sky-600/60 text-white opacity-0 transition-opacity hover:bg-sky-500 group-hover/track:opacity-100 rounded-l"
        >
          <div className="h-3.5 w-0.5 rounded-full bg-white/90" />
        </div>

        <HugeiconsIcon icon={VolumeHighIcon} className="relative z-10 size-3.5 shrink-0" />
        <span className="relative z-10 truncate font-semibold">{audioTrack.name}</span>
        <span className="relative z-10 ml-auto shrink-0 opacity-80 tabular-nums text-[10px]">
          F{audioTrack.startFrame + 1} • {activeDuration.toFixed(1)}s
        </span>

        {/* Trim Finish Handle (Right edge handle) */}
        <div
          title="Drag right handle to trim finish length"
          onPointerDown={(e) => handlePointerDown(e, "trimEnd")}
          className="absolute right-0 top-0 bottom-0 z-20 flex w-3 items-center justify-center cursor-ew-resize bg-sky-600/60 text-white opacity-0 transition-opacity hover:bg-sky-500 group-hover/track:opacity-100 rounded-r"
        >
          <div className="h-3.5 w-0.5 rounded-full bg-white/90" />
        </div>
      </div>
    </div>
  )
}

export function Timeline() {
  const frames = useFlipbook((s) => s.frames)
  const currentId = useFlipbook((s) => s.currentId)
  const selectFrame = useFlipbook((s) => s.selectFrame)
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
  const audioTrack = useFlipbook((s) => s.audioTrack)
  const setAudioTrack = useFlipbook((s) => s.setAudioTrack)
  const updateAudioTrack = useFlipbook((s) => s.updateAudioTrack)

  const currentIndex = frames.findIndex((f) => f.id === currentId)
  const dragIndex = useRef<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return
      const audio = new Audio(dataUrl)
      audio.onloadedmetadata = () => {
        setAudioTrack({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          duration: Number.isFinite(audio.duration) ? audio.duration : 0,
          startFrame: currentIndex >= 0 ? currentIndex : 0,
          offset: 0,
          volume: 1,
          muted: false,
        })
      }
    }
    reader.readAsDataURL(file)
    // Reset file input value so selecting the same file again triggers onChange
    e.target.value = ""
  }

  // Stepping frames with the hotkeys moves the selection, which would
  // otherwise walk straight off the end of the strip and out of sight.
  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-frame-id="${currentId}"]`)
    el?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }, [currentId, reducedMotion])

  // Audio track calculations
  // Each frame card is size-16 (64px) + gap-2 (8px) = 72px total width step per frame
  const FRAME_STEP_PX = 72

  return (
    <div data-tour="timeline" className="flex flex-col gap-2 border-t px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Upload audio file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />

      {/* Height and a floor on width, rather than a square: the onion skin
          toggle carries a label and must stay its natural width. */}
      <div data-tour="playback-fps" className="flex items-center gap-3 pointer-coarse:[&_[data-slot=button]]:h-11 pointer-coarse:[&_[data-slot=button]]:min-w-11 max-lg:[&_[data-slot=button]]:h-11 max-lg:[&_[data-slot=button]]:min-w-11">
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

        <span className="text-xs text-muted-foreground tabular-nums">
          {currentIndex + 1} / {frames.length}
        </span>

        <div className="mx-1 h-4 w-px bg-border" />

        <div
          role="radiogroup"
          aria-label="Frames per second"
          className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
        >
          {FPS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={fps === option}
              onClick={() => setFps(option)}
              className={cn(
                "rounded-[5px] px-2 py-0.5 text-xs tabular-nums transition-colors select-none pointer-coarse:px-3 pointer-coarse:py-2 max-lg:px-3 max-lg:py-2",
                fps === option
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">fps</span>

        <div className="mx-1 h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                data-tour="onion-skin"
                variant="ghost"
                size="sm"
                aria-pressed={onionSkin}
                data-cuelume-toggle
                onClick={toggleOnionSkin}
                className={cn(
                  "text-muted-foreground",
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

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Audio Track Toolbar Control */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={audioTrack ? "secondary" : "ghost"}
                size="sm"
                aria-label={audioTrack ? "Audio Settings" : "Add Audio"}
                onClick={() => {
                  if (!audioTrack) {
                    fileInputRef.current?.click()
                  }
                }}
                className={cn(
                  "gap-1.5 text-muted-foreground",
                  audioTrack && "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium"
                )}
              >
                <HugeiconsIcon icon={VolumeHighIcon} strokeWidth={1.8} />
                {audioTrack ? (
                  <span className="max-w-24 truncate">{audioTrack.name}</span>
                ) : (
                  "Add Audio"
                )}
              </Button>
            }
          />
          <TooltipContent>
            {audioTrack ? `Audio: ${audioTrack.name}` : "Add an audio track aligned to the timeline"}
          </TooltipContent>
        </Tooltip>

        {audioTrack && (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={audioTrack.muted ? "Unmute Audio" : "Mute Audio"}
                    onClick={() =>
                      updateAudioTrack({ muted: !audioTrack.muted })
                    }
                    className="text-muted-foreground"
                  >
                    <HugeiconsIcon
                      icon={audioTrack.muted ? VolumeOffIcon : VolumeHighIcon}
                      strokeWidth={1.8}
                    />
                  </Button>
                }
              />
              <TooltipContent>
                {audioTrack.muted ? "Unmute Audio" : "Mute Audio"}
              </TooltipContent>
            </Tooltip>

            <AudioSettingsPopover />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
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

      <div ref={stripRef} className="flex flex-col gap-1.5 overflow-x-auto pt-1 pb-1">
        {/* Frame Cards Strip */}
        <div className="flex items-center gap-2">
          {frames.map((frame, index) => (
            <button
              key={frame.id}
              type="button"
              data-frame-id={frame.id}
              draggable
              onDragStart={() => {
                dragIndex.current = index
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragIndex.current !== null && dragIndex.current !== index) {
                  setDropIndex(index)
                }
              }}
              onDragLeave={() => setDropIndex((d) => (d === index ? null : d))}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex.current !== null) {
                  reorderFrames(dragIndex.current, index)
                }
                dragIndex.current = null
                setDropIndex(null)
              }}
              onDragEnd={() => {
                dragIndex.current = null
                setDropIndex(null)
              }}
              onClick={() => selectFrame(frame.id)}
              aria-label={`Frame ${index + 1}`}
              aria-current={frame.id === currentId ? "true" : undefined}
              className={cn(
                "relative size-16 shrink-0 cursor-grab overflow-hidden rounded-lg bg-white ring-1 ring-black/10 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing dark:ring-white/15",
                frame.id === currentId && "ring-2 ring-primary dark:ring-primary",
                dropIndex === index && "ring-2 ring-ring"
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
                  className="size-16 shrink-0 rounded-lg border-dashed text-muted-foreground"
                >
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.8} />
                </Button>
              }
            />
            <TooltipContent>Add a blank frame</TooltipContent>
          </Tooltip>
        </div>

        {/* Audio Track Timeline Alignment & Interactive Editing Bar */}
        {audioTrack && (
          <AudioTrackBar
            audioTrack={audioTrack}
            fps={fps}
            updateAudioTrack={updateAudioTrack}
            frameStepPx={FRAME_STEP_PX}
          />
        )}
      </div>
    </div>
  )
}
