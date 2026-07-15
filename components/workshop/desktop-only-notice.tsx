import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"

/**
 * Shown instead of the editor on small screens. CSS-gated rather than
 * JS-gated so it paints immediately, with no flash of a cramped workshop.
 */
export function DesktopOnlyNotice() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 px-6 text-center md:hidden">
      <Link href="/">
        <Wordmark />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl leading-tight font-normal tracking-tight text-balance">
          The workshop needs a desktop
        </h1>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">
          Drawing frame by frame wants a pointer, a keyboard, and room for the
          timeline. Open Flipghost on a larger screen to start animating.
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
