import type { Metadata } from "next"
import Link from "next/link"
import {
  Bug01Icon,
  Calendar03Icon,
  DiscordIcon,
  HelpCircleIcon,
  MessageMultiple01Icon,
  PaintBoardIcon,
  Bookmark01Icon,
  Megaphone01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { LandingNav } from "@/components/landing/landing-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Community | Flipghost",
  description:
    "The Flipghost Discord: critique threads, weekly prompts, brush swaps, and a room full of people drawing frame by frame.",
}

const DISCORD_URL = "https://discord.gg/pQRyMrGaf"

const CHANNELS: {
  name: string
  description: string
  icon: IconSvgElement
}[] = [
  {
    name: "show-your-loop",
    description:
      "Finished something? Post it. Six frames counts. This is the channel the rest of the server exists to feed.",
    icon: Megaphone01Icon,
  },
  {
    name: "critique",
    description:
      "Ask for notes and get them from people who have redrawn the same twelve frames more times than they will admit to.",
    icon: MessageMultiple01Icon,
  },
  {
    name: "work-in-progress",
    description:
      "The rough pass, the timing that is still wrong, and the one frame you cannot get right. No finished work required.",
    icon: Bookmark01Icon,
  },
  {
    name: "weekly-prompt",
    description:
      "One short brief every Monday. Twelve frames, one loop, no pressure and no prizes. Skip as many as you like.",
    icon: Calendar03Icon,
  },
  {
    name: "brush-swaps",
    description:
      "Share the settings behind a line you like, and pull someone else's straight into your own toolbar.",
    icon: PaintBoardIcon,
  },
  {
    name: "help",
    description:
      "Stuck on onion skinning, timing, export, or the workshop itself. Answered by people who use it daily.",
    icon: HelpCircleIcon,
  },
  {
    name: "bugs",
    description:
      "The frame that vanished, the export that stalled. The fastest route to someone who can actually fix it.",
    icon: Bug01Icon,
  },
]

const HOUSE_RULES = [
  {
    title: "Critique the work, never the person",
    body: "Say what you see and what you would try. Nobody needs to be told their drawing is bad, and nobody learns anything from hearing it.",
  },
  {
    title: "Beginners are the point",
    body: "Everyone here has drawn a walk cycle that slid across the floor. If you are one week in, you are exactly who this is for.",
  },
  {
    title: "Ask specifically",
    body: '"Does the timing read?" gets you a useful answer. "Thoughts?" gets you a thumbs up and nothing you can use.',
  },
  {
    title: "Credit what you build on",
    body: "If you reworked someone's prompt, brush, or loop, say so. It costs nothing and it is how a room like this stays worth being in.",
  },
]

function JoinButton({ className }: { className?: string }) {
  return (
    <Button
      render={
        <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" />
      }
      size="xl"
      className={className}
    >
      <HugeiconsIcon icon={DiscordIcon} strokeWidth={1.8} />
      Join the Discord
    </Button>
  )
}

export default function CommunityPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex max-w-xl flex-col items-start gap-6 duration-500 ease-out motion-reduce:animate-none">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
              Community
            </span>
            <h1 className="font-display text-4xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">
              A room full of people who draw
            </h1>
            <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
              Animation is quiet work, and mostly solitary. The Flipghost
              Discord is where you put the loop down in front of someone else
              and hear what they actually see in it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <JoinButton className="px-4" />
            <Button
              render={<Link href="/workshop" />}
              variant="outline"
              size="xl"
              className="px-4"
            >
              Open the workshop
            </Button>
          </div>
        </div>

        <section className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-16 flex flex-col gap-6 delay-150 duration-500 ease-out motion-reduce:animate-none sm:mt-20">
          <h2 className="text-xs font-medium">What is inside</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHANNELS.map((channel) => (
              <li
                key={channel.name}
                className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-md border bg-background text-foreground">
                  <HugeiconsIcon
                    icon={channel.icon}
                    className="size-4"
                    strokeWidth={1.8}
                  />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-mono text-sm font-medium">
                    #{channel.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                    {channel.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 flex flex-col gap-6 sm:mt-20">
          <h2 className="text-xs font-medium">How we behave in here</h2>
          <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {HOUSE_RULES.map((rule) => (
              <li key={rule.title} className="flex flex-col gap-1.5">
                <h3 className="text-sm font-medium text-balance">
                  {rule.title}
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
                  {rule.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 flex flex-col items-start gap-4 rounded-xl border bg-card p-6 shadow-sm sm:mt-20 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl leading-tight font-normal tracking-tight text-balance">
              Bring the loop you are stuck on
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
              It is free, it is small enough that you will be noticed, and
              nobody minds a work in progress.
            </p>
          </div>
          <JoinButton className="shrink-0 px-4" />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
