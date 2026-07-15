import type { Metadata } from "next"

import { LandingNav } from "@/components/landing/landing-nav"
import { ShowcaseGrid } from "@/components/landing/showcase-grid"
import { SiteFooter } from "@/components/landing/site-footer"

export const metadata: Metadata = {
  title: "Showcase | Flipghost",
  description:
    "Animations built frame by frame in Flipghost. Hover to play, then open any of them in the workshop.",
}

export default function ShowcasePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <header className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex max-w-xl flex-col gap-2 duration-500 ease-out motion-reduce:animate-none">
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Showcase
          </span>
          <h1 className="font-display text-4xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">
            Made in Flipghost
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            Every one of these is a real project, drawn frame by frame. Hover to
            play, then open one in the workshop and take it apart.
          </p>
        </header>

        <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-16 delay-150 duration-500 ease-out motion-reduce:animate-none sm:mt-20">
          <ShowcaseGrid />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
