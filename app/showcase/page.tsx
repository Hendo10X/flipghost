import type { Metadata } from "next"

import { LandingNav } from "@/components/landing/landing-nav"
import { ShowcaseGrid } from "@/components/landing/showcase-grid"

export const metadata: Metadata = {
  title: "Showcase | Flipghost",
  description:
    "Animations built frame by frame in Flipghost. Hover to play, then open any of them in the workshop.",
}

export default function ShowcasePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-20">
        <div className="mb-10 flex flex-col gap-3 text-center">
          <h1 className="font-display text-3xl leading-[1.1] font-normal tracking-tight text-balance sm:text-4xl">
            Made in Flipghost
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            Every one of these is a real project, drawn frame by frame. Hover to
            play, then open one in the workshop and take it apart.
          </p>
        </div>

        <ShowcaseGrid />
      </main>
    </div>
  )
}
