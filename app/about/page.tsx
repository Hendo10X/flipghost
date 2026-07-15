import type { Metadata } from "next"
import Link from "next/link"
import {
  GhostIcon,
  Globe02Icon,
  PenTool01Icon,
  Target01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { LandingNav } from "@/components/landing/landing-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "About | Flipghost",
  description:
    "Why we built a flipbook in a browser, who is building it, and what we are trying not to turn it into.",
}

interface Principle {
  title: string
  description: string
  icon: IconSvgElement
}

const PRINCIPLES: Principle[] = [
  {
    title: "Frame by frame, on purpose",
    description:
      "The oldest way to animate and still the most direct. Nothing sits between the drawing and the motion, so nothing can flatter a drawing that is not working yet.",
    icon: PenTool01Icon,
  },
  {
    title: "A URL is the whole install",
    description:
      "No licence server, no forty minute setup before the first line. If you have a browser and a spare ten minutes, you have everything you need to start.",
    icon: Globe02Icon,
  },
  {
    title: "Your work stays yours",
    description:
      "No watermark on your frames, no holding exports hostage behind a plan. The export you get is the animation you drew.",
    icon: Target01Icon,
  },
  {
    title: "The ghost is the point",
    description:
      "Onion skinning is the heart of the tool, and an onion skin is a ghost of the frame before. The name picked itself.",
    icon: GhostIcon,
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <header className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex max-w-xl flex-col gap-2 duration-500 ease-out motion-reduce:animate-none">
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
            About
          </span>
          <h1 className="font-display text-4xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">
            Why we built a flipbook in a browser
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            Animation software has spent thirty years getting more powerful and
            less inviting. Flipghost is a small argument that the fastest way to
            learn to animate is still to draw one frame, then draw the next one.
          </p>
        </header>

        {/* Capped tighter than the page around it: this is the only part of
            About that is read as prose rather than scanned. */}
        <section className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-16 flex max-w-2xl flex-col gap-4 delay-150 duration-500 ease-out motion-reduce:animate-none sm:mt-20">
          <h2 className="text-xs font-medium">The long version</h2>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-pretty text-muted-foreground">
            <p>
              Every animation tool worth using is now aimed at someone who
              already knows how to animate. They are extraordinary at what they
              do, and they all ask the same thing first: install this, learn
              this, decide what kind of project this is, and then, eventually,
              draw. The gap between wanting to animate and animating has quietly
              become the hardest part of animating.
            </p>
            <p>
              A flipbook has no such gap. You draw a thing, you draw it again
              slightly moved, and it lives. That is the entire mechanism, and it
              has not needed improving since 1868. What it has needed is somewhere
              to live that does not require a licence key, and a way to see the
              frame before the one you are on.
            </p>
            <p>
              So Flipghost is deliberately small. A canvas, a timeline, onion
              skinning, and an exporter. Every feature past those four has to
              survive the same question: does this help someone finish a loop
              today, or does it help someone imagine finishing one? We have said
              no to a lot of good ideas on that basis, and the tool is better for
              it.
            </p>
            <p>
              It is built by a small team that draws, which mostly means every
              feature gets used in anger before it ships, and the ones that
              annoy us do not survive the week.
            </p>
          </div>
        </section>

        <section className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-16 flex flex-col gap-6 delay-200 duration-500 ease-out motion-reduce:animate-none sm:mt-20">
          <h2 className="text-xs font-medium">What we hold to</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((principle) => (
              <li
                key={principle.title}
                className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-md border bg-background text-foreground">
                  <HugeiconsIcon
                    icon={principle.icon}
                    className="size-4"
                    strokeWidth={1.8}
                  />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-medium">{principle.title}</h3>
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                    {principle.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 flex flex-col gap-4 border-t pt-8 sm:mt-20">
          <p className="max-w-lg text-sm leading-relaxed text-pretty text-muted-foreground">
            That is the summary. The workshop is the actual argument, and it
            takes about ten minutes to find out whether we are right.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button render={<Link href="/workshop" />} size="xl" className="px-4">
              Open the workshop
            </Button>
            <Button
              render={<Link href="/showcase" />}
              variant="outline"
              size="xl"
              className="px-4"
            >
              Browse the showcase
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
