import type { Metadata } from "next"

import { LandingNav } from "@/components/landing/landing-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { formatPostDate, getPosts, MARBLE_CATEGORY } from "@/lib/marble"

export const metadata: Metadata = {
  title: "Changelog | Flipghost",
  description:
    "Every change to the workshop, written down: what moved, and when.",
}

/**
 * Unlike the blog and the tutorials, a changelog entry is read where it sits.
 * Nobody wants to open six pages to find out what shipped last month, so the
 * entries render in full against a dated rail and there is no [slug] route.
 */
export default async function ChangelogPage() {
  const entries = await getPosts(MARBLE_CATEGORY.changelog, { limit: 50 })

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <header className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex max-w-xl flex-col gap-2 duration-500 ease-out motion-reduce:animate-none">
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Changelog
          </span>
          <h1 className="font-display text-4xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">
            Every change, written down
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            Flipghost moves fast enough that the workshop you open next month
            will not be the one you opened today. This is exactly what moved,
            and when.
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="mt-16 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
            No entries yet. Until then, the shortest possible changelog is this:
            we built a canvas, a timeline, onion skinning, and an exporter, and
            we are still sanding the edges off all four.
          </p>
        ) : (
          <ol className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-16 flex flex-col delay-150 duration-500 ease-out motion-reduce:animate-none sm:mt-20">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-4 border-l pb-12 pl-6 last:border-l-transparent last:pb-0 sm:gap-6 sm:pl-8"
              >
                <div className="flex flex-col gap-1.5">
                  {/* Sits on the rule itself, so the eye can run the dates. */}
                  <span
                    aria-hidden
                    className="-ml-[1.8125rem] size-2 rounded-full border-2 border-background bg-border sm:-ml-[2.3125rem]"
                  />
                  <time
                    dateTime={entry.publishedAt}
                    className="text-xs tabular-nums text-muted-foreground"
                  >
                    {formatPostDate(entry.publishedAt)}
                  </time>
                  <h2 className="font-display text-xl leading-tight font-normal tracking-tight text-balance sm:text-2xl">
                    {entry.title}
                  </h2>
                  {entry.description ? (
                    <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                      {entry.description}
                    </p>
                  ) : null}
                </div>

                {/* Fumadocs' prose has no size modifier, but it scales off
                    --tw-prose-size. An entry is a note, not an essay, so it
                    reads a step down from a blog post. */}
                <div
                  className="prose [--tw-prose-size:0.9]"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
              </li>
            ))}
          </ol>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
