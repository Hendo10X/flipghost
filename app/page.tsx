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
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex items-center gap-3 delay-150 duration-500 ease-out motion-reduce:animate-none">
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
