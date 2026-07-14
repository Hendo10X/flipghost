import type { Metadata } from "next"

import { DemoPlayer } from "@/components/landing/demo-player"
import { LandingNav } from "@/components/landing/landing-nav"

export const metadata: Metadata = {
  title: "Showcase | Flipghost",
  description:
    "A bouncing ball with squash and stretch, drawn frame by frame in Flipghost. Play it, scrub it, and open it in the workshop.",
}

export default function ShowcasePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-20">
        <div className="mb-8 flex flex-col gap-3 text-center">
          <h1 className="font-display text-3xl leading-[1.1] font-normal tracking-tight text-balance sm:text-4xl">
            A bouncing ball, twelve frames
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            The classic animation exercise: squash on impact, stretch through
            the fall, and a held beat at the apex. Pause it and flip on onion
            skinning to see how the ghosts guide each in-between.
          </p>
        </div>

        <DemoPlayer />
      </main>
    </div>
  )
}
