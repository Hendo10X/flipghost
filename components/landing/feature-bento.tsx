"use client"

import {
  CloudUploadIcon,
  Film01Icon,
  GhostIcon,
  Gif01Icon,
  PaintBrush02Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import BarChart from "@/components/animata/graphs/bar-chart"
import Counter from "@/components/animata/text/counter"
import Ticker from "@/components/animata/text/ticker"
import TypingText from "@/components/animata/text/typing-text"
import { cn } from "@/lib/utils"

function BentoCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "group/bento relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card p-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium">{children}</div>
}

/** Onion skinning: three stacked ghosts that spread apart on hover. */
function OnionCard() {
  return (
    <BentoCard className="sm:col-span-2">
      <CardLabel>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={GhostIcon} className="size-3.5" strokeWidth={1.8} />
          Onion skinning
        </span>
      </CardLabel>
      <p className="mt-1 text-xs text-pretty text-muted-foreground">
        See the frames either side of the one you&apos;re drawing.
      </p>

      <div className="relative mt-auto flex h-20 items-center justify-center">
        <span className="absolute size-12 rounded-full bg-red-500/30 transition-transform duration-300 ease-out group-hover/bento:-translate-x-9 motion-reduce:transform-none" />
        <span className="absolute size-12 rounded-full bg-green-500/30 transition-transform duration-300 ease-out group-hover/bento:translate-x-9 motion-reduce:transform-none" />
        <span className="absolute size-12 rounded-full bg-sky-500" />
      </div>
    </BentoCard>
  )
}

function FramesCard() {
  return (
    <BentoCard>
      <CardLabel>Frames per project</CardLabel>
      <div className="mt-auto text-4xl font-semibold tabular-nums">
        <Counter targetValue={240} format={(v) => `${Math.ceil(v)}`} />
      </div>
      <p className="text-xs text-muted-foreground">up to, per animation</p>
    </BentoCard>
  )
}

function ExportCard() {
  return (
    <BentoCard>
      <CardLabel>Export</CardLabel>
      <div className="mt-auto flex flex-col gap-2">
        {[
          { icon: Gif01Icon, label: "GIF" },
          { icon: Film01Icon, label: "MP4" },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium"
          >
            <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={1.8} />
            {label}
          </span>
        ))}
      </div>
    </BentoCard>
  )
}

/** Playback speed, shown as the fps the timeline can run at. */
function FpsCard() {
  return (
    <BentoCard>
      <CardLabel>Playback</CardLabel>
      <div className="mt-auto flex items-baseline gap-1">
        <div className="text-3xl font-semibold text-sky-500 tabular-nums">
          <Ticker value="24" />
        </div>
        <span className="text-xs text-muted-foreground">fps</span>
      </div>
      <p className="text-xs text-muted-foreground">12, 24 or 30</p>
    </BentoCard>
  )
}

function CanvasSizesCard() {
  return (
    <BentoCard className="sm:col-span-2">
      <CardLabel>Any canvas</CardLabel>
      <p className="mt-1 text-xs text-pretty text-muted-foreground">
        Square, widescreen, vertical, or print sizes.
      </p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        {["1:1", "16:9", "9:16", "A4", "A3"].map((size) => (
          <span
            key={size}
            className="rounded-md border px-2 py-1 text-[11px] font-medium tabular-nums"
          >
            {size}
          </span>
        ))}
      </div>
    </BentoCard>
  )
}

function CloudCard() {
  return (
    <BentoCard className="sm:col-span-2">
      <CardLabel>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon
            icon={CloudUploadIcon}
            className="size-3.5"
            strokeWidth={1.8}
          />
          Saved as you draw
        </span>
      </CardLabel>
      <div className="mt-auto pt-3 font-mono text-xs text-sky-600 dark:text-sky-400">
        <TypingText text="All changes saved" waitTime={2600} alwaysVisibleCount={0} />
      </div>
    </BentoCard>
  )
}

/** Frame timing, as a stand-in for the timeline's rhythm. */
function TimelineCard() {
  return (
    <BentoCard className="sm:col-span-2">
      <CardLabel>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={PlayIcon} className="size-3.5" strokeWidth={1.8} />
          Timeline
        </span>
      </CardLabel>
      <div className="mt-2">
        <BarChart
          height={64}
          items={[30, 55, 80, 100, 80, 55, 30, 55].map((progress, i) => ({
            progress,
            label: `${i + 1}`,
            className: "rounded-md bg-sky-500/80",
          }))}
        />
      </div>
    </BentoCard>
  )
}

function BrushCard() {
  return (
    <BentoCard>
      <CardLabel>
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon
            icon={PaintBrush02Icon}
            className="size-3.5"
            strokeWidth={1.8}
          />
          Brush
        </span>
      </CardLabel>
      <div className="mt-auto flex items-end gap-2">
        {["size-1.5", "size-2.5", "size-3.5", "size-5"].map((size, i) => (
          <span
            key={i}
            className={cn(
              "rounded-full bg-foreground transition-transform duration-200 ease-out group-hover/bento:scale-110 motion-reduce:transform-none",
              size
            )}
          />
        ))}
      </div>
    </BentoCard>
  )
}

export function FeatureBento() {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-4">
      <OnionCard />
      <FramesCard />
      <ExportCard />
      <TimelineCard />
      <FpsCard />
      <BrushCard />
      <CanvasSizesCard />
      <CloudCard />
    </div>
  )
}
