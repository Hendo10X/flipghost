import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { LandingNav } from "@/components/landing/landing-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { Button } from "@/components/ui/button"

export interface ComingSoonItem {
  title: string
  description: string
  icon: IconSvgElement
}

/**
 * Shared shell for pages that are announced but not built yet. Every one of
 * them says the same thing, so they should say it the same way: a live badge,
 * a display heading, the shape of what is coming, and a way back into the
 * parts of Flipghost that do exist.
 */
export function ComingSoon({
  eyebrow = "Coming soon",
  title,
  description,
  itemsHeading,
  items,
  note,
}: {
  eyebrow?: string
  title: string
  description: string
  itemsHeading: string
  items: ComingSoonItem[]
  note: string
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex max-w-xl flex-col items-start gap-6 duration-500 ease-out motion-reduce:animate-none">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
              {eyebrow}
            </span>
            <h1 className="font-display text-4xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              render={<Link href="/workshop" />}
              size="lg"
              className="px-4"
            >
              Open the workshop
            </Button>
            <Button
              render={<Link href="/showcase" />}
              variant="outline"
              size="lg"
              className="px-4"
            >
              Browse the showcase
            </Button>
          </div>
        </div>

        <section className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-16 flex flex-col gap-6 delay-150 duration-500 ease-out motion-reduce:animate-none sm:mt-20">
          <h2 className="text-xs font-medium">{itemsHeading}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-md border bg-background text-foreground">
                  <HugeiconsIcon
                    icon={item.icon}
                    className="size-4"
                    strokeWidth={1.8}
                  />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 border-t pt-6">
          <p className="max-w-lg text-sm leading-relaxed text-pretty text-muted-foreground">
            {note}
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
