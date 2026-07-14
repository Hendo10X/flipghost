import { del, get, set } from "idb-keyval"

import type { Frame } from "./store"

const LOCAL_KEY = "flipghost:local"

/** The slice of editor state worth persisting between sessions. */
export interface ProjectSnapshot {
  title: string
  frames: Frame[]
  currentId: string
  fps: number
  onionSkin: boolean
  onionBefore: number
  onionAfter: number
  onionOpacity: number
  stagePresetId: string
  brushColor: string
  brushSize: number
}

export function snapshotFromState(state: ProjectSnapshot): ProjectSnapshot {
  return {
    title: state.title,
    frames: state.frames,
    currentId: state.currentId,
    fps: state.fps,
    onionSkin: state.onionSkin,
    onionBefore: state.onionBefore,
    onionAfter: state.onionAfter,
    onionOpacity: state.onionOpacity,
    stagePresetId: state.stagePresetId,
    brushColor: state.brushColor,
    brushSize: state.brushSize,
  }
}

/** Shallow compare, so new snapshot fields are covered automatically. */
export function snapshotChanged(a: ProjectSnapshot, b: ProjectSnapshot) {
  return (Object.keys(a) as (keyof ProjectSnapshot)[]).some((key) => a[key] !== b[key])
}

export async function loadLocalSnapshot(): Promise<ProjectSnapshot | null> {
  try {
    const snapshot = await get<ProjectSnapshot>(LOCAL_KEY)
    if (!snapshot || !Array.isArray(snapshot.frames) || !snapshot.frames.length) {
      return null
    }
    return snapshot
  } catch {
    return null
  }
}

export async function saveLocalSnapshot(snapshot: ProjectSnapshot) {
  try {
    await set(LOCAL_KEY, snapshot)
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
