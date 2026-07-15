import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { frames, projects } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getDemo } from "@/lib/flipbook/demos"
import { getStagePreset, type FrameJSON } from "@/lib/flipbook/store"
import { Editor, type InitialProject } from "@/components/workshop/editor"

export const metadata: Metadata = {
  title: "Workshop | Flipghost",
}

/** One unreadable row should cost that frame, not the whole animation. */
function parseFrameJson(raw: string | null): FrameJSON | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as FrameJSON
  } catch {
    return null
  }
}

/**
 * Takes userId rather than resolving the session itself: the caller has to do
 * that anyway to redirect a signed-out visitor, and `redirect()` works by
 * throwing. Called from inside a `.catch()`, it would have had its own
 * redirect swallowed and been sent somewhere else entirely.
 */
async function loadProject(
  id: string,
  userId: string,
): Promise<InitialProject | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  if (!project) return null

  const frameRows = await db
    .select()
    .from(frames)
    .where(eq(frames.projectId, id))
    .orderBy(asc(frames.orderIndex))

  return {
    id: project.id,
    title: project.title,
    fps: project.fps,
    stagePresetId: project.resolution,
    frames: frameRows.map((row) => ({
      id: crypto.randomUUID(),
      json: parseFrameJson(row.canvasDataUrl),
      dataUrl: row.thumbnailUrl,
    })),
  }
}

export default async function WorkshopPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; new?: string; title?: string; demo?: string }>
}) {
  const { p, new: newSize, title, demo } = await searchParams
  let initialProject: InitialProject | null = null

  if (p) {
    const session = await auth.api
      .getSession({ headers: await headers() })
      .catch(() => null)
    // Outside the catch below, so it is the visitor who gets redirected here
    // and not the redirect itself that gets caught.
    if (!session) redirect("/signin")

    initialProject = await loadProject(p, session.user.id).catch(() => null)
    if (!initialProject) redirect("/projects")
  }

  // A "new" animation starts on a blank canvas at the chosen size and name.
  const initialNew =
    !initialProject && newSize
      ? {
          stagePresetId: getStagePreset(newSize).id,
          title: (title ?? "").trim().slice(0, 255) || "Untitled Animation",
        }
      : undefined

  const initialDemoId =
    !initialProject && !initialNew && demo && getDemo(demo)
      ? getDemo(demo)!.id
      : undefined

  return (
    <Editor
      initialProject={initialProject}
      initialNew={initialNew}
      initialDemoId={initialDemoId}
    />
  )
}
