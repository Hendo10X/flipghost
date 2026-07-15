import Image from "next/image"
import Link from "next/link"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { LandingNav } from "@/components/landing/landing-nav"
import { SiteFooter } from "@/components/landing/site-footer"
import { formatPostDate, readingTime, type MarblePost } from "@/lib/marble"

/**
 * The blog and the tutorials are the same page with different words in it: a
 * heading, then everything Marble has published in that category. Changelog is
 * deliberately not built on this, because an entry there is read in place
 * rather than opened.
 */
export function WritingIndex({
  eyebrow,
  title,
  description,
  posts,
  basePath,
  emptyMessage,
}: {
  eyebrow: string
  title: string
  description: string
  posts: MarblePost[]
  basePath: string
  emptyMessage: string
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-14 pb-20 sm:pt-20">
        <header className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards flex max-w-xl flex-col gap-2 duration-500 ease-out motion-reduce:animate-none">
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
            {eyebrow}
          </span>
          <h1 className="font-display text-4xl leading-[1.1] font-normal tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mt-16 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ul className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards mt-16 grid gap-6 delay-150 duration-500 ease-out motion-reduce:animate-none sm:mt-20 sm:grid-cols-2">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} basePath={basePath} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

function PostCard({ post, basePath }: { post: MarblePost; basePath: string }) {
  return (
    <Link
      href={`${basePath}/${post.slug}`}
      className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {post.coverImage ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-1.5">
        <h2 className="text-sm font-medium text-pretty">{post.title}</h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          {post.description}
        </p>
      </div>

      <PostMeta post={post} />
    </Link>
  )
}

export function PostMeta({
  post,
  className = "",
}: {
  post: MarblePost
  className?: string
}) {
  return (
    <div
      className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <time dateTime={post.publishedAt} className="tabular-nums">
        {formatPostDate(post.publishedAt)}
      </time>
      <span aria-hidden>·</span>
      <span className="flex items-center gap-1">
        <HugeiconsIcon icon={Clock01Icon} className="size-3" strokeWidth={1.8} />
        <span className="tabular-nums">{readingTime(post.content)} min</span>
      </span>
    </div>
  )
}
