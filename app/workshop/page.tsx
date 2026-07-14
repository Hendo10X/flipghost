import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { and, asc, eq } from "drizzle-orm"

import { db } from "@/db"
import { frames, projects } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getStagePreset, type FrameJSON } from "@/lib/flipbook/store"
import { Editor, type InitialProject } from "@/components/workshop/editor"

export const metadata: Metadata = {
  title: "Workshop | Flipghost",
}

async function loadProject(id: string): Promise<InitialProject | null> {
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)
  if (!session) redirect("/signin")

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
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
      json: row.canvasDataUrl ? (JSON.parse(row.canvasDataUrl) as FrameJSON) : null,
      dataUrl: row.thumbnailUrl,
    })),
  }
}

export default async function WorkshopPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; new?: string }>
}) {
  const { p, new: newSize } = await searchParams
  let initialProject: InitialProject | null = null

  if (p) {
    initialProject = await loadProject(p).catch(() => null)
    if (!initialProject) redirect("/projects")
  }

  // A "new" animation starts on a blank canvas at the chosen size.
  const initialStagePresetId =
    !initialProject && newSize ? getStagePreset(newSize).id : undefined

  return (
    <Editor
      initialProject={initialProject}
      initialStagePresetId={initialStagePresetId}
    />
  )
}
