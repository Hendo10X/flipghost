import Image from "next/image"
import Link from "next/link"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { LandingNav } from "@/components/landing/landing-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { PostMeta } from "@/components/marble/writing-index"
import type { MarblePost } from "@/lib/marble"

/**
 * One published post, for both /blog/[slug] and /tutorials/[slug]. The column
 * is capped at max-w-2xl rather than the max-w-5xl the rest of the site uses,
 * because this is the only page on Flipghost that is read a paragraph at a
 * time and long lines make the eye lose its place.
 */
export function Article({
  post,
  backHref,
  backLabel,
}: {
  post: MarblePost
  backHref: string
  backLabel: string
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            className="size-4"
            strokeWidth={1.8}
          />
          {backLabel}
        </Link>

        <article className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-8 duration-500 ease-out motion-reduce:animate-none">
          <header className="flex flex-col gap-3">
            <h1 className="font-display text-3xl leading-[1.1] font-normal tracking-tight text-balance sm:text-4xl">
              {post.title}
            </h1>
            {post.description ? (
              <p className="text-base leading-relaxed text-pretty text-muted-foreground">
                {post.description}
              </p>
            ) : null}
            <PostMeta post={post} className="mt-1" />
          </header>

          {post.coverImage ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border bg-muted">
              <Image
                src={post.coverImage}
                alt=""
                fill
                sizes="(min-width: 768px) 42rem, 100vw"
                priority
                className="object-cover"
              />
            </div>
          ) : null}

          {/* Marble's editor emits sanitised HTML, so it is injected rather
              than parsed. prose comes from the fumadocs preset that /docs
              already uses, which keeps articles and docs reading alike;
              cms-prose covers what that plugin leaves to fumadocs' own MDX
              pipeline, which CMS HTML never passes through. */}
          <div
            className="prose cms-prose mt-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.authors.length > 0 ? (
            <footer className="mt-12 flex flex-wrap items-center gap-4 border-t pt-6">
              {post.authors.map((author) => (
                <div key={author.id} className="flex items-center gap-2.5">
                  {author.image ? (
                    <Image
                      src={author.image}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 rounded-full border object-cover"
                    />
                  ) : null}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{author.name}</span>
                    {author.role ? (
                      <span className="text-xs text-muted-foreground">
                        {author.role}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </footer>
          ) : null}
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
