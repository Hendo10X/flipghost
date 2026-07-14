import Link from "next/link"
import { GhostIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 select-none">
          <HugeiconsIcon icon={GhostIcon} className="size-4" strokeWidth={2} />
          <span className="text-sm font-medium">Flipghost</span>
        </div>
        <Button
          render={<Link href="/signin" />}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          Sign in
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex max-w-2xl flex-col items-center gap-6 pb-24 text-center">
          <div className="flex flex-col gap-4">
            <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards text-5xl leading-[1.1] font-semibold tracking-tight text-balance duration-500 ease-out motion-reduce:animate-none sm:text-6xl">
              Flipbook animation, right in your browser
            </h1>
            <p className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mx-auto max-w-md text-sm leading-relaxed text-pretty text-muted-foreground delay-75 duration-500 ease-out motion-reduce:animate-none">
              Draw frame by frame, trace motion with onion skinning, and export
              looping GIFs or MP4s. No installs, no setup. Just open a canvas
              and start flipping.
            </p>
          </div>
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex items-center gap-3 delay-150 duration-500 ease-out motion-reduce:animate-none">
            <Button render={<Link href="/workshop" />} size="lg" className="px-4">
              Get started
            </Button>
            <Button
              render={<Link href="/signup" />}
              variant="outline"
              size="lg"
              className="px-4"
            >
              Sign up
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
