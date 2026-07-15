import Link from "next/link"
import {
  ArrowRight01Icon,
  CloudSavingDone01Icon,
  Copy01Icon,
  Cursor01Icon,
  Delete02Icon,
  EraserIcon,
  GhostIcon,
  Loading03Icon,
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
import "./cloud-visual.css"

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
        <Panel className="flex min-h-64 items-center justify-center bg-muted/30">
          <div className="w-full max-w-[17rem] overflow-hidden rounded-xl border bg-background shadow-md">
            <div className="flex h-8 items-center gap-1.5 border-b px-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground/25"
                />
              ))}
              <span className="ml-1 truncate text-[10px] text-muted-foreground">
                Bouncing ball
              </span>
              {/* Both chips occupy the same slot and cross-fade on one cycle. */}
              <span className="relative ml-auto flex h-4 w-20 items-center justify-end">
                <span className="fg-status-saving absolute right-0 flex items-center gap-1 text-[10px] whitespace-nowrap text-muted-foreground">
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="size-2.5 animate-spin"
                    strokeWidth={2.5}
                  />
                  Saving…
                </span>
                <span className="fg-status-saved absolute right-0 flex items-center gap-1 text-[10px] whitespace-nowrap text-sky-600 dark:text-sky-400">
                  <HugeiconsIcon
                    icon={CloudSavingDone01Icon}
                    className="size-2.5"
                    strokeWidth={2.5}
                  />
                  Saved
                </span>
              </span>
            </div>

            <div className="relative h-40 bg-white">
              <span className="absolute bottom-10 left-1/2 h-0.5 w-3/5 -translate-x-1/2 rounded-full bg-black/10" />
              {/* Three layers: position, travel, squash — so no transform fights another. */}
              <span className="absolute bottom-10 left-1/2 -translate-x-1/2">
                <span className="fg-ball-lift block">
                  <span className="fg-ball-squash block size-10 origin-bottom rounded-full bg-sky-500" />
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between border-t px-3 py-2">
              <span className="text-[10px] text-muted-foreground">
                Edited just now
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                12 frames
              </span>
            </div>
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
