"use client"

import {
  Film01Icon,
  GhostIcon,
  PencilEdit02Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import StackedSections from "@/components/animata/scroll/stacked-sections"
import { cn } from "@/lib/utils"

interface Step {
  step: string
  title: string
  description: string
  icon: typeof GhostIcon
  visual: React.ReactNode
}

/** A ball resting on the ground line — the first mark on a blank canvas. */
function DrawVisual() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto text-black/15">
      <line
        x1="16"
        y1="62"
        x2="104"
        y2="62"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="60" cy="48" r="13" className="fill-sky-500" />
    </svg>
  )
}

/** The same ball flanked by its tinted neighbours. */
function GhostVisual() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto text-black/15">
      <line
        x1="16"
        y1="62"
        x2="104"
        y2="62"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="34" cy="40" r="13" className="fill-red-500/30" />
      <circle cx="86" cy="40" r="13" className="fill-green-500/30" />
      <circle cx="60" cy="48" r="13" className="fill-sky-500" />
    </svg>
  )
}

/** A filmstrip mid-playback. */
function PlayVisual() {
  return (
    <svg viewBox="0 0 120 80" className="h-full w-auto text-black/15">
      {[0, 1, 2, 3].map((i) => {
        const lift = Math.abs(Math.sin(Math.PI * (i / 4)))
        return (
          <g key={i}>
            <rect
              x={8 + i * 28}
              y="20"
              width="24"
              height="40"
              rx="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx={20 + i * 28}
              cy={52 - lift * 20}
              r="6"
              className="fill-sky-500"
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Two output chips. */
function ExportVisual() {
  return (
    <div className="flex h-full items-center gap-2">
      {["GIF", "MP4"].map((label) => (
        <span
          key={label}
          className="rounded-lg bg-black/[0.06] px-3 py-2 font-mono text-xs font-medium text-black/70"
        >
          {label}
        </span>
      ))}
    </div>
  )
}

const STEPS: Step[] = [
  {
    step: "01",
    title: "Draw a frame",
    description:
      "Open a canvas and put down your first mark. A brush, an eraser, and nothing else in the way.",
    icon: PencilEdit02Icon,
    visual: <DrawVisual />,
  },
  {
    step: "02",
    title: "Ghost the next one",
    description:
      "Onion skinning drops the neighbouring frames underneath, tinted, so every in-between lands on the arc.",
    icon: GhostIcon,
    visual: <GhostVisual />,
  },
  {
    step: "03",
    title: "Flip it back",
    description:
      "Play the strip at 12, 24 or 30 fps. Scrub, reorder, and duplicate until the motion reads right.",
    icon: PlayIcon,
    visual: <PlayVisual />,
  },
  {
    step: "04",
    title: "Take it with you",
    description:
      "Render a looping GIF or an MP4 straight in the browser, at the full resolution of your canvas.",
    icon: Film01Icon,
    visual: <ExportVisual />,
  },
]

function StepCard({ step, last }: { step: Step; last: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 overflow-hidden rounded-2xl border bg-card p-6 shadow-lg sm:flex-row sm:items-center sm:p-8",
        // The last card is the one left pinned, so give it the accent.
        last && "border-sky-500/40"
      )}
    >
      <div className="flex flex-1 flex-col gap-2">
        <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
          {step.step}
          <HugeiconsIcon icon={step.icon} className="size-3.5" strokeWidth={1.8} />
        </span>
        <h3 className="font-display text-xl leading-tight font-normal tracking-tight text-balance sm:text-2xl">
          {step.title}
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
          {step.description}
        </p>
      </div>
      <div className="flex h-28 shrink-0 items-center justify-center rounded-xl bg-white px-6 ring-1 ring-black/10 sm:w-56">
        {step.visual}
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <StackedSections stackOffset={56} paneGap="gap-4">
      {STEPS.map((step, i) => (
        <StepCard key={step.step} step={step} last={i === STEPS.length - 1} />
      ))}
    </StackedSections>
  )
}
