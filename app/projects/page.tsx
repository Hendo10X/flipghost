import type { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { desc, eq, inArray } from "drizzle-orm"
import { GhostIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { db } from "@/db"
import { frames, projects } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getStagePreset } from "@/lib/flipbook/store"
import { Button } from "@/components/ui/button"
import { NewAnimationButton } from "@/components/projects/new-animation-button"
import { ProjectCard } from "@/components/projects/project-card"
import { UserAvatar } from "@/components/user-avatar"

export const metadata: Metadata = {
  title: "My animations | Flipghost",
}

const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

export default async function ProjectsPage() {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)
  if (!session) redirect("/signin")

  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      fps: projects.fps,
      resolution: projects.resolution,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.updatedAt))

  const thumbnails = new Map<string, string | null>()
  if (rows.length > 0) {
    const firstFrames = await db
      .select({
        projectId: frames.projectId,
        thumbnailUrl: frames.thumbnailUrl,
      })
      .from(frames)
      .where(
        inArray(
          frames.projectId,
          rows.map((r) => r.id)
        )
      )
      .orderBy(frames.orderIndex)
    for (const frame of firstFrames) {
      if (!thumbnails.has(frame.projectId)) {
        thumbnails.set(frame.projectId, frame.thumbnailUrl)
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium select-none"
        >
          <HugeiconsIcon icon={GhostIcon} className="size-4" strokeWidth={2} />
          Flipghost
        </Link>
        <div className="flex items-center gap-3">
          <NewAnimationButton />
          <Link
            href="/profile"
            aria-label="Profile and settings"
            className="flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar seed={session.user.id} size={28} className="rounded-full" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-16">
        <h1 className="mb-6 text-lg font-semibold tracking-tight">
          My animations
        </h1>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
            <p className="text-sm text-pretty text-muted-foreground">
              Nothing here yet. Draw something and hit Save in the workshop.
            </p>
            <Button render={<Link href="/workshop" />} size="lg" className="px-3">
              Open the workshop
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                thumbnail={thumbnails.get(project.id) ?? null}
                meta={`${getStagePreset(project.resolution).label} · ${project.fps} fps`}
                updatedAt={dateFormat.format(project.updatedAt)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
