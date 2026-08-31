import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { frames, projects } from "@/db/schema"
import { auth } from "@/lib/auth"

const MAX_FRAMES = 240

interface FramePayload {
  orderIndex: number
  json: string | null
  thumbnail: string | null
}

export async function POST(request: Request) {
  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null)
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (
    !body ||
    typeof body.title !== "string" ||
    typeof body.fps !== "number" ||
    typeof body.stagePresetId !== "string" ||
    !Array.isArray(body.frames)
  ) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (body.frames.length === 0 || body.frames.length > MAX_FRAMES) {
    return Response.json({ error: "Invalid frame count" }, { status: 400 })
  }

  const title = body.title.slice(0, 255) || "Untitled Animation"
  const framePayloads = body.frames as FramePayload[]
  const userId = session.user.id
  let projectId: string
  let replacingFrames = false

  const audioTrackStr = body.audioTrack ? JSON.stringify(body.audioTrack) : null

  if (typeof body.projectId === "string" && body.projectId) {
    const updated = await db
      .update(projects)
      .set({
        title,
        fps: Math.round(body.fps),
        resolution: body.stagePresetId.slice(0, 32),
        audioTrack: audioTrackStr,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, body.projectId), eq(projects.userId, userId)))
      .returning({ id: projects.id })
    if (updated.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }
    projectId = updated[0].id
    replacingFrames = true
  } else {
    const created = await db
      .insert(projects)
      .values({
        userId,
        title,
        fps: Math.round(body.fps),
        resolution: body.stagePresetId.slice(0, 32),
        audioTrack: audioTrackStr,
        updatedAt: new Date(),
      })
      .returning({ id: projects.id })
    projectId = created[0].id
  }

  // The frames table doubles as blob storage for the MVP: the Fabric JSON
  // lives in canvas_data_url and the PNG snapshot in thumbnail_url. Swap
  // these for S3/R2 object URLs later without changing the schema.
  const rows = framePayloads.map((frame, index) => ({
    projectId,
    orderIndex: Number.isFinite(frame.orderIndex) ? frame.orderIndex : index,
    canvasDataUrl: frame.json ?? null,
    thumbnailUrl: frame.thumbnail ?? null,
  }))

  // Replacing a project's frames has to be atomic. This used to be a bare
  // delete followed by a separate insert: if the insert then failed or timed
  // out — likely, since it is one multi-megabyte statement of base64 PNGs —
  // the delete had already committed and the project was left with zero
  // frames. Permanent loss, on a save that fires every 1.5s. db.batch() runs
  // both statements in a single transaction, so a failed insert rolls the
  // delete back and the previous frames stay intact. A brand-new project has
  // nothing to delete, so it just inserts.
  if (replacingFrames) {
    await db.batch([
      db.delete(frames).where(eq(frames.projectId, projectId)),
      db.insert(frames).values(rows),
    ])
  } else {
    await db.insert(frames).values(rows)
  }

  return Response.json({ id: projectId })
}
