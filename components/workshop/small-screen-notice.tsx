import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"

/**
 * Shown instead of the editor on phones. Tablets are a first-class target and
 * get the real workshop, so this only covers screens too narrow to hold the
 * canvas and the timeline at once. CSS-gated rather than JS-gated so it paints
 * immediately, with no flash of a cramped workshop.
 */
export function SmallScreenNotice() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 px-6 text-center md:hidden">
      <Link href="/">
        <Wordmark />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl leading-tight font-normal tracking-tight text-balance">
          The workshop needs more room
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">
          Drawing frame by frame wants the canvas and the timeline on screen at
          the same time. Open Flipghost on a tablet or anything larger to start
          animating.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button render={<Link href="/showcase" />} size="lg" className="px-4">
          Browse the showcase
        </Button>
        <Button
          render={<Link href="/" />}
          variant="outline"
          size="lg"
          className="px-4"
        >
          Back home
        </Button>
      </div>
    </div>
  )
}
