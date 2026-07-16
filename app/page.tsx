import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FeatureBento } from "@/components/landing/feature-bento"
import {
  CanvasSection,
  CloudSection,
  CtaSection,
  ExportSection,
  HotkeysSection,
  OnionSection,
  TimelineSection,
  ToolboxSection,
} from "@/components/landing/feature-panels"
import { HeroDemo } from "@/components/landing/hero-demo"
import { HowItWorks } from "@/components/landing/how-it-works"
import { LandingNav } from "@/components/landing/landing-nav"
import { Section } from "@/components/landing/section"
import { ShowcaseGrid } from "@/components/landing/showcase-grid"
import { SiteFooter } from "@/components/landing/site-footer"

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-12 pb-8 sm:pt-16">
          <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
            <div className="flex flex-col gap-4">
              <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards font-display text-5xl leading-[1.1] font-normal tracking-tight text-balance duration-500 ease-out motion-reduce:animate-none sm:text-6xl">
                Flipbook animation, right in your browser
              </h1>
              <p className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mx-auto max-w-md text-base leading-relaxed text-pretty text-muted-foreground delay-75 duration-500 ease-out motion-reduce:animate-none">
                Draw frame by frame, trace motion with onion skinning, and
                export looping GIFs or MP4s. No installs, no setup. Just open a
                canvas and start flipping.
              </p>
            </div>
            {/* The workshop starts at md — below that app/workshop renders the
                "needs more room" notice instead. So the hero has to change its
                mind at the same breakpoint, or it spends the whole phone
                viewport recommending a thing the phone cannot open.

                Both sets are in the markup and CSS picks one, matching how the
                workshop itself gates. display:none keeps the hidden pair out
                of the accessibility tree and out of tab order, so this reads
                as one pair of buttons, not two. */}
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex flex-col items-center gap-3 delay-150 duration-500 ease-out motion-reduce:animate-none">
              {/* Phones. The showcase is the thing that genuinely works here:
                  the demos play. Signing up still makes sense — the account is
                  what carries the work to a laptop — it just should not be the
                  loudest promise on a screen that cannot draw. */}
              {/* Wraps rather than sits in one row: the two labels come to
                  ~307px of the ~327px a 375px phone has, and a 320px screen
                  has no chance. */}
              <div className="flex flex-wrap items-center justify-center gap-3 md:hidden">
                <Button
                  render={<Link href="/showcase" />}
                  size="xl"
                  className="px-4"
                >
                  Browse the showcase
                </Button>
                <Button
                  render={<Link href="/signup" />}
                  variant="outline"
                  size="xl"
                  className="px-4"
                >
                  Get started
                </Button>
              </div>

              {/* Tablet and up, where the editor actually opens. */}
              <div className="hidden items-center gap-3 md:flex">
                <Button render={<Link href="/signup" />} size="xl" className="px-4">
                  Get started
                </Button>
                <Button
                  render={<Link href="/workshop" />}
                  variant="outline"
                  size="xl"
                  className="px-4"
                >
                  Try the editor
                </Button>
              </div>

              {/* Said here, before the account, rather than after it. Someone
                  who signs up on a phone should already know why. */}
              <p className="text-xs text-pretty text-muted-foreground md:hidden">
                Drawing needs a tablet or larger. Sign up and your work will be
                waiting.
              </p>
            </div>
          </div>

          <HeroDemo className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-backwards mt-14 w-full delay-300 duration-700 ease-out motion-reduce:animate-none" />
        </div>

        {/* 1 — Showcase */}
        <Section
          eyebrow="Showcase"
          title="Made in Flipghost"
          description="Real projects, drawn frame by frame. Hover to play, then open one in the workshop and take it apart."
        >
          <ShowcaseGrid />
        </Section>

        {/* 2 — Interactive feature grid */}
        <Section
          eyebrow="Features"
          title="Everything in the workshop"
          description="The whole tool, on one screen. No panels to hunt through, no modes to learn."
        >
          <FeatureBento />
        </Section>

        {/* 3 — Stacked walkthrough */}
        <Section
          eyebrow="How it works"
          title="Four steps, start to finish"
          description="From a blank canvas to a file you can post, without leaving the tab."
        >
          <HowItWorks />
        </Section>

        {/* 4-10 */}
        <OnionSection />
        <ToolboxSection />
        <TimelineSection />
        <ExportSection />
        <CanvasSection />
        <CloudSection />
        <HotkeysSection />
        <CtaSection />
      </main>

      <SiteFooter />
    </div>
  )
}
