import type { Frame } from "./store"

export interface SaveProjectInput {
  projectId: string | null
  title: string
  fps: number
  stagePresetId: string
  frames: Frame[]
}

export async function saveProjectToCloud(
  input: SaveProjectInput
): Promise<{ id: string }> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: input.projectId,
      title: input.title,
      fps: input.fps,
      stagePresetId: input.stagePresetId,
      frames: input.frames.map((frame, index) => ({
        orderIndex: index,
        json: frame.json ? JSON.stringify(frame.json) : null,
        thumbnail: frame.dataUrl,
      })),
    }),
  })
  if (!response.ok) {
    throw new Error(`Save failed (${response.status})`)
  }
  return response.json()
}

export async function deleteProjectFromCloud(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, { method: "DELETE" })
  if (!response.ok) {
    throw new Error(`Delete failed (${response.status})`)
  }
}
