import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { projects } from "@/db/schema"
import { auth } from "@/lib/auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api
    .getSession({ headers: request.headers })
    .catch(() => null)
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const deleted = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, session.user.id)))
    .returning({ id: projects.id })

  if (deleted.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json({ ok: true })
}
