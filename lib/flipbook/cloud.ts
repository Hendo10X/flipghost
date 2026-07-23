import { compositeLayerFrameDataUrls } from "./composite"
import { getStagePreset, normalizeProjectSnapshot, type ProjectSnapshot } from "./store"

export interface SaveProjectInput extends ProjectSnapshot {
  projectId: string | null
}

export async function saveProjectToCloud(
  input: SaveProjectInput
): Promise<{ id: string }> {
  const snapshot = normalizeProjectSnapshot(input)
  const preset = getStagePreset(snapshot.stagePresetId)
  const thumbnail = await compositeLayerFrameDataUrls(
    snapshot.layers,
    snapshot.currentFrameIndex,
    { width: preset.width, height: preset.height },
    { backgroundColor: "#ffffff" }
  )
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: input.projectId,
      title: input.title,
      fps: input.fps,
      stagePresetId: input.stagePresetId,
      frames: [
        {
          orderIndex: 0,
          json: JSON.stringify(snapshot),
          thumbnail,
        },
      ],
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
