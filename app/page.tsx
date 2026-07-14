import Link from "next/link"

import { Button } from "@/components/ui/button"
import { HeroDemo } from "@/components/landing/hero-demo"
import { LandingNav } from "@/components/landing/landing-nav"

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pt-12 pb-20 sm:pt-16">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-4">
            <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards font-display text-5xl leading-[1.1] font-normal tracking-tight text-balance duration-500 ease-out motion-reduce:animate-none sm:text-6xl">
              Flipbook animation, right in your browser
            </h1>
            <p className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mx-auto max-w-md text-base leading-relaxed text-pretty text-muted-foreground delay-75 duration-500 ease-out motion-reduce:animate-none">
              Draw frame by frame, trace motion with onion skinning, and export
              looping GIFs or MP4s. No installs, no setup. Just open a canvas
              and start flipping.
            </p>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex items-center gap-3 delay-150 duration-500 ease-out motion-reduce:animate-none">
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

        <HeroDemo className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-backwards mt-14 w-full delay-300 duration-700 ease-out motion-reduce:animate-none" />
      </main>
    </div>
  )
}
