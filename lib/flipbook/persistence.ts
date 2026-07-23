import { del, get, set } from "idb-keyval"

import { normalizeProjectSnapshot, type ProjectSnapshot } from "./store"

const LOCAL_KEY = "flipghost:local"

function isLegacySnapshot(snapshot: unknown): snapshot is {
  title: string
  frames: Array<{
    id: string
    json: unknown
    dataUrl: string | null
  }>
  currentId: string
  fps: number
  onionSkin: boolean
  onionBefore: number
  onionAfter: number
  onionOpacity: number
  stagePresetId: string
  brushColor: string
  brushSize: number
} {
  return (
    !!snapshot &&
    typeof snapshot === "object" &&
    Array.isArray((snapshot as { frames?: unknown }).frames) &&
    typeof (snapshot as { currentId?: unknown }).currentId === "string"
  )
}

/** The slice of editor state worth persisting between sessions. */
export type StoredProjectSnapshot = ProjectSnapshot

export function snapshotFromState(state: ProjectSnapshot): ProjectSnapshot {
  return normalizeProjectSnapshot(state)
}

/** Shallow compare, so new snapshot fields are covered automatically. */
export function snapshotChanged(a: ProjectSnapshot, b: ProjectSnapshot) {
  return (Object.keys(a) as (keyof ProjectSnapshot)[]).some((key) => a[key] !== b[key])
}

export async function loadLocalSnapshot(): Promise<ProjectSnapshot | null> {
  try {
    const snapshot = await get<unknown>(LOCAL_KEY)
    if (!snapshot) return null
    if (isLegacySnapshot(snapshot)) {
      const layers = [
        {
          id: crypto.randomUUID(),
          name: "Layer 1",
          visible: true,
          frames: snapshot.frames.map((frame) => ({
            id: frame.id,
            json: frame.json as Record<string, unknown> | null,
            dataUrl: frame.dataUrl,
          })),
        },
      ]
      const legacy = normalizeProjectSnapshot({
        title: snapshot.title,
        layers,
        currentLayerId: layers[0].id,
        currentFrameIndex: Math.max(
          0,
          layers[0].frames.findIndex((frame) => frame.id === snapshot.currentId)
        ),
        fps: snapshot.fps,
        onionSkin: snapshot.onionSkin,
        onionBefore: snapshot.onionBefore,
        onionAfter: snapshot.onionAfter,
        onionOpacity: snapshot.onionOpacity,
        stagePresetId: snapshot.stagePresetId,
        brushColor: snapshot.brushColor,
        brushSize: snapshot.brushSize,
      })
      return legacy
    }
    const normalized = normalizeProjectSnapshot(snapshot as ProjectSnapshot)
    return normalized.layers.length > 0 ? normalized : null
  } catch {
    return null
  }
}

export async function saveLocalSnapshot(snapshot: ProjectSnapshot) {
  try {
    await set(LOCAL_KEY, normalizeProjectSnapshot(snapshot))
  } catch {
    // Quota or private-mode failures shouldn't break drawing.
  }
}

export async function clearLocalSnapshot() {
  try {
    await del(LOCAL_KEY)
  } catch {
    // Ignore.
  }
}
