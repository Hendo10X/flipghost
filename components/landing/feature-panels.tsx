import Link from "next/link"
import {
  Album01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  Cursor01Icon,
  Delete02Icon,
  EraserIcon,
  GhostIcon,
  PencilEdit02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { STAGE_PRESETS } from "@/lib/flipbook/store"
import { HOTKEY_ACTIONS, HOTKEY_DEFAULTS, formatHotkey } from "@/lib/hotkeys"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ExportProgress } from "@/components/landing/export-progress"
import { Panel, Section } from "@/components/landing/section"

/** Two-column feature layout; the visual can lead on wide screens. */
function Split({
  children,
  reverse,
}: {
  children: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-8 md:grid-cols-2",
        reverse && "md:[&>*:first-child]:order-2"
      )}
    >
      {children}
    </div>
  )
}

function Copy({
  eyebrow,
  title,
  description,
  points,
}: {
  eyebrow: string
  title: string
  description: string
  points?: string[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
        {eyebrow}
      </span>
      <h2 className="font-display text-2xl leading-tight font-normal tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
        {description}
      </p>
      {points && (
        <ul className="mt-3 flex flex-col gap-2">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="mt-0.5 size-3.5 shrink-0 text-sky-500"
                strokeWidth={2}
              />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Section 2 — onion skinning, shown as a stack of tinted ghosts. */
export function OnionSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <Split>
        <Copy
          eyebrow="Onion skinning"
          title="Draw between the ghosts"
          description="The frames either side of your current one sit underneath it, tinted and dimmed, so every in-between lands where it should."
          points={[
            "Red for the frames behind, green for the ones ahead",
            "Ghost up to three frames on each side",
            "Dial the opacity to taste",
          ]}
        />
        <Panel className="flex aspect-[4/3] items-center justify-center bg-white p-0 dark:bg-white">
          <div className="relative flex h-40 w-full items-center justify-center">
            <span className="absolute size-20 -translate-x-16 rounded-full bg-red-500/25" />
            <span className="absolute size-20 translate-x-16 rounded-full bg-green-500/25" />
            <span className="absolute size-20 rounded-full bg-sky-500" />
          </div>
        </Panel>
      </Split>
    </section>
  )
}

/** Section 3 — the toolbox. */
export function ToolboxSection() {
  const tools = [
    { icon: Cursor01Icon, label: "Select" },
    { icon: PencilEdit02Icon, label: "Brush" },
    { icon: EraserIcon, label: "Eraser" },
  ]
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <Split reverse>
        <Copy
          eyebrow="Toolbox"
          title="Only the tools you reach for"
          description="A brush, an eraser, a colour, and a way to move things. Nothing to learn, nothing in the way."
        />
        <Panel className="flex gap-4">
          <div className="flex flex-col items-center gap-1 rounded-lg border p-1.5">
            {tools.map(({ icon, label }, i) => (
              <span
                key={label}
                title={label}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md",
                  i === 1 ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                <HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.8} />
              </span>
            ))}
            <span className="my-1 h-px w-6 bg-border" />
            <span className="size-4 rounded-full bg-sky-500 ring-1 ring-black/10 dark:ring-white/20" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-3">
            {[2, 4, 7, 11].map((h) => (
              <span
                key={h}
                style={{ height: h }}
                className="w-full rounded-full bg-foreground/80"
              />
            ))}
          </div>
        </Panel>
      </Split>
    </section>
  )
}

/** Section 4 — the timeline. */
export function TimelineSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <Split>
        <Copy
          eyebrow="Timeline"
          title="Your flipbook, laid out flat"
          description="Every frame in a strip you can scrub, reorder, duplicate, or delete. Drag one and the rest shuffle around it."
          points={[
            "Drag and drop to reorder",
            "Duplicate a frame to build on it",
            "Play back at 12, 24 or 30 fps",
          ]}
        />
        <Panel>
          <div className="flex items-center gap-2 border-b pb-3">
            {[
              { icon: PlusSignIcon, label: "Add" },
              { icon: Copy01Icon, label: "Duplicate" },
              { icon: Delete02Icon, label: "Delete" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] text-muted-foreground"
              >
                <HugeiconsIcon icon={icon} className="size-3" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
          {/* No overflow-hidden here: it clipped the frames' 1px ring along
              the bottom. The Panel already crops the strip at its edge. */}
          <div className="flex gap-2 pt-3">
            {Array.from({ length: 7 }, (_, i) => {
              // Frames of one bounce, so the strip reads as motion.
              const lift = Math.abs(Math.sin(Math.PI * (i / 7)))
              const touching = lift < 0.05
              return (
                <span
                  key={i}
                  className={cn(
                    "relative size-12 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-black/10",
                    i === 2 && "ring-2 ring-sky-500"
                  )}
                >
                  <svg viewBox="0 0 48 48" className="size-full text-black/15">
                    <line
                      x1="8"
                      y1="38"
                      x2="40"
                      y2="38"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <ellipse
                      cx="24"
                      cy={36 - lift * 20}
                      rx={touching ? 9 : 7}
                      ry={touching ? 5 : 7}
                      className="fill-sky-500"
                    />
                  </svg>
                  <span className="absolute bottom-0.5 left-1 text-[9px] text-black/40 tabular-nums">
                    {i + 1}
                  </span>
                </span>
              )
            })}
          </div>
        </Panel>
      </Split>
    </section>
  )
}

/** Section 5 — export. */
export function ExportSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <Split reverse>
        <Copy
          eyebrow="Export"
          title="Finish in the browser"
          description="Rendering happens on your machine, not a server queue. Hit export and your file downloads at full resolution."
        />
        <Panel>
          <ExportProgress />
        </Panel>
      </Split>
    </section>
  )
}

/** Section 6 — canvas presets. */
export function CanvasSection() {
  return (
    <Section
      eyebrow="Canvas"
      title="Sized for wherever it lands"
      description="Start square for a feed, widescreen for a title card, or A4 if it's going to paper. Exports render at the preset's full resolution."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {STAGE_PRESETS.map((preset) => {
          const wide = preset.width >= preset.height
          return (
            <div
              key={preset.id}
              className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 shadow-sm"
            >
              <span className="flex h-12 items-center justify-center">
                <span
                  className={cn(
                    "rounded border-2 border-foreground/25",
                    wide ? "h-8 w-12" : "h-12 w-8"
                  )}
                />
              </span>
              <span className="text-center text-[11px] font-medium">
                {preset.label.replace(/\s*\(.*\)/, "")}
              </span>
              <span className="text-center text-[10px] text-muted-foreground tabular-nums">
                {preset.width}×{preset.height}
              </span>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

/**
 * Each saved project previews its own animation, so the dashboard reads as
 * four different pieces of work rather than four identical dots.
 */
const PROJECT_THUMBS: { name: string; visual: React.ReactNode }[] = [
  {
    name: "Bouncing ball",
    visual: (
      <svg viewBox="0 0 40 40" className="size-full text-black/15">
        <line
          x1="7"
          y1="31"
          x2="33"
          y2="31"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse cx="20" cy="27" rx="8" ry="5" className="fill-sky-500" />
      </svg>
    ),
  },
  {
    name: "Pendulum",
    visual: (
      <svg viewBox="0 0 40 40" className="size-full text-black/25">
        <line
          x1="20"
          y1="7"
          x2="29"
          y2="26"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="7" r="2" fill="currentColor" />
        <circle cx="29" cy="28" r="6" className="fill-sky-500" />
      </svg>
    ),
  },
  {
    name: "Wave",
    visual: (
      <svg viewBox="0 0 40 40" className="size-full">
        {[7, 15, 23, 31].map((cx, i) => (
          <circle
            key={cx}
            cx={cx}
            cy={[26, 16, 24, 12][i]}
            r="3.5"
            className="fill-sky-500"
          />
        ))}
      </svg>
    ),
  },
  {
    name: "Orbit",
    visual: (
      <svg viewBox="0 0 40 40" className="size-full text-black/20">
        <circle
          cx="20"
          cy="20"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="20" cy="20" r="4" fill="currentColor" />
        <circle cx="32" cy="20" r="3.5" className="fill-sky-500" />
        <circle cx="12" cy="30" r="3.5" className="fill-sky-500" />
      </svg>
    ),
  },
]

/** Section 7 — cloud projects. */
export function CloudSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <Split>
        <Copy
          eyebrow="Your animations"
          title="Pick up where you left off"
          description="Sign in and every project saves itself as you draw, then waits for you on any machine you open next."
          points={[
            "Autosaves while you work",
            "Open any project from your dashboard",
            "Import a reference image to trace",
          ]}
        />
        <Panel>
          <div className="flex items-center gap-2 border-b pb-3">
            <HugeiconsIcon icon={Album01Icon} className="size-4" strokeWidth={1.8} />
            <span className="text-xs font-medium">My animations</span>
            <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
              4 projects
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3">
            {PROJECT_THUMBS.map(({ name, visual }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <span className="flex aspect-square items-center justify-center rounded-md bg-white p-2 ring-1 ring-black/10">
                  {visual}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </Split>
    </section>
  )
}

/** Section 8 — hotkeys, read from the real defaults. */
export function HotkeysSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <Split reverse>
        <Copy
          eyebrow="Hotkeys"
          title="Hands stay on the keys"
          description="Every tool and every frame is one keystroke away, and you can rebind any of them to whatever your hands already know."
        />
        <Panel className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {HOTKEY_ACTIONS.map(({ action, label }) => (
            <div key={action} className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">
                {label}
              </span>
              <kbd className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-primary px-1.5 font-mono text-[11px] font-medium text-primary-foreground">
                {formatHotkey(HOTKEY_DEFAULTS[action])}
              </kbd>
            </div>
          ))}
        </Panel>
      </Split>
    </section>
  )
}

/** Section 9 — closing call to action. */
export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-8 pb-24">
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
        <HugeiconsIcon
          icon={GhostIcon}
          className="size-8 text-muted-foreground"
          strokeWidth={1.5}
        />
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-2xl leading-tight font-normal tracking-tight text-balance sm:text-3xl">
            Open a canvas and start flipping
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
            No installs, no setup, no account needed to try it. Your first frame
            is one click away.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/signup" />} size="lg" className="px-4">
            Get started
          </Button>
          <Button
            render={<Link href="/workshop" />}
            variant="outline"
            size="lg"
            className="px-4"
          >
            Try the editor
          </Button>
        </div>
      </div>
    </section>
  )
}
