import Link from "next/link"

import { LandingNav } from "@/components/landing/landing-nav"
import { LostFrame } from "@/components/landing/lost-frame"
import { SiteFooter } from "@/components/landing/site-footer"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 pt-14 pb-20 text-center sm:pt-20">
        <span className="font-mono text-xs tracking-wide text-muted-foreground">
          frame 404
        </span>

        <h1 className="mt-4 font-display text-4xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">
          This frame was never drawn
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
          The page you asked for drifted off somewhere between 403 and 405.
          Onion skinning shows roughly where it should have been, but the layer
          underneath is empty.
        </p>

        <LostFrame className="mt-12 w-full" />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/" />} size="xl" className="px-4">
            Back home
          </Button>
          <Button
            render={<Link href="/workshop" />}
            variant="outline"
            size="xl"
            className="px-4"
          >
            Draw it yourself
          </Button>
        </div>

        <p className="mt-8 max-w-sm text-xs leading-relaxed text-pretty text-muted-foreground">
          If you are the one who was meant to draw this page, that is between
          you and your timeline.
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
