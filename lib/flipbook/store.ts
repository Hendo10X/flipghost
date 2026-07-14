import { create } from "zustand"

/** Snapshot width for thumbnails, onion skins and playback preview. */
export const SNAPSHOT_SIZE = 720

export const FPS_OPTIONS = [12, 24, 30] as const

export interface StagePreset {
  id: string
  label: string
  width: number
  height: number
}

/** Logical canvas sizes. Drawing coordinates and exports both use these. */
export const STAGE_PRESETS: StagePreset[] = [
  { id: "square", label: "Square (1:1)", width: 1080, height: 1080 },
  { id: "landscape", label: "Landscape (16:9)", width: 1920, height: 1080 },
  { id: "portrait", label: "Portrait (9:16)", width: 1080, height: 1920 },
  { id: "a4-portrait", label: "A4 Portrait", width: 1240, height: 1754 },
  { id: "a4-landscape", label: "A4 Landscape", width: 1754, height: 1240 },
  { id: "a3-portrait", label: "A3 Portrait", width: 1754, height: 2480 },
  { id: "a3-landscape", label: "A3 Landscape", width: 2480, height: 1754 },
]

export function getStagePreset(id: string): StagePreset {
  return STAGE_PRESETS.find((p) => p.id === id) ?? STAGE_PRESETS[0]
}

export type Tool = "brush" | "eraser"

export type FrameJSON = Record<string, unknown>

export interface Frame {
  id: string
  /** Serialized Fabric.js canvas state, null for a blank frame. */
  json: FrameJSON | null
  /** PNG snapshot (transparent background) used for thumbs/onion/playback. */
  dataUrl: string | null
}

interface FrameHistory {
  past: (FrameJSON | null)[]
  future: (FrameJSON | null)[]
}

const HISTORY_LIMIT = 50

function blankFrame(): Frame {
  return { id: crypto.randomUUID(), json: null, dataUrl: null }
}

function historyFor(
  histories: Record<string, FrameHistory>,
  id: string
): FrameHistory {
  return histories[id] ?? { past: [], future: [] }
}

interface FlipbookState {
  title: string
  frames: Frame[]
  currentId: string
  /**
   * Bumped whenever frame content changes outside the canvas
   * (undo/redo/clear) so the canvas knows to reload from the store.
   */
  revision: number
  fps: number
  playing: boolean
  onionSkin: boolean
  tool: Tool
  brushColor: string
  brushSize: number
  stagePresetId: string
  /** Data URL of an image waiting to be placed on the canvas. */
  pendingImport: string | null
  histories: Record<string, FrameHistory>

  setStagePreset: (id: string) => void
  requestImport: (dataUrl: string) => void
  clearPendingImport: () => void
  setTitle: (title: string) => void
  setTool: (tool: Tool) => void
  setBrushColor: (color: string) => void
  setBrushSize: (size: number) => void
  setFps: (fps: number) => void
  setPlaying: (playing: boolean) => void
  toggleOnionSkin: () => void

  selectFrame: (id: string) => void
  addFrame: () => void
  duplicateFrame: () => void
  deleteFrame: () => void
  reorderFrames: (fromIndex: number, toIndex: number) => void

  /** Record a canvas-driven change (stroke drawn, stroke erased). */
  commitFrame: (id: string, json: FrameJSON, dataUrl: string | null) => void
  /** Refresh a frame's snapshot without touching history (after undo/redo). */
  setFrameSnapshot: (id: string, dataUrl: string | null) => void
  clearFrame: () => void
  undo: () => void
  redo: () => void
}

const initialFrame = blankFrame()

export const useFlipbook = create<FlipbookState>((set, get) => ({
  title: "Untitled Animation",
  frames: [initialFrame],
  currentId: initialFrame.id,
  revision: 0,
  fps: 12,
  playing: false,
  onionSkin: true,
  tool: "brush",
  brushColor: "#1a1a1a",
  brushSize: 8,
  stagePresetId: "square",
  pendingImport: null,
  histories: {},

  setStagePreset: (id) =>
    set({ stagePresetId: getStagePreset(id).id }),
  requestImport: (dataUrl) => set({ pendingImport: dataUrl }),
  clearPendingImport: () => set({ pendingImport: null }),
  setTitle: (title) => set({ title }),
  setTool: (tool) => set({ tool }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setFps: (fps) => set({ fps }),
  setPlaying: (playing) => set({ playing }),
  toggleOnionSkin: () => set((s) => ({ onionSkin: !s.onionSkin })),

  selectFrame: (id) => {
    if (get().frames.some((f) => f.id === id)) set({ currentId: id })
  },

  addFrame: () =>
    set((s) => {
      const index = s.frames.findIndex((f) => f.id === s.currentId)
      const frame = blankFrame()
      const frames = [...s.frames]
      frames.splice(index + 1, 0, frame)
      return { frames, currentId: frame.id }
    }),

  duplicateFrame: () =>
    set((s) => {
      const index = s.frames.findIndex((f) => f.id === s.currentId)
      const source = s.frames[index]
      const copy: Frame = {
        id: crypto.randomUUID(),
        json: source.json ? structuredClone(source.json) : null,
        dataUrl: source.dataUrl,
      }
      const frames = [...s.frames]
      frames.splice(index + 1, 0, copy)
      return { frames, currentId: copy.id }
    }),

  deleteFrame: () =>
    set((s) => {
      const index = s.frames.findIndex((f) => f.id === s.currentId)
      const histories = { ...s.histories }
      delete histories[s.currentId]

      if (s.frames.length === 1) {
        const frame = blankFrame()
        return { frames: [frame], currentId: frame.id, histories }
      }
      const frames = s.frames.filter((f) => f.id !== s.currentId)
      const next = frames[Math.min(index, frames.length - 1)]
      return { frames, currentId: next.id, histories }
    }),

  reorderFrames: (fromIndex, toIndex) =>
    set((s) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= s.frames.length ||
        toIndex >= s.frames.length
      ) {
        return s
      }
      const frames = [...s.frames]
      const [moved] = frames.splice(fromIndex, 1)
      frames.splice(toIndex, 0, moved)
      return { frames }
    }),

  commitFrame: (id, json, dataUrl) =>
    set((s) => {
      const frame = s.frames.find((f) => f.id === id)
      if (!frame) return s
      const history = historyFor(s.histories, id)
      const past = [...history.past, frame.json].slice(-HISTORY_LIMIT)
      return {
        frames: s.frames.map((f) => (f.id === id ? { ...f, json, dataUrl } : f)),
        histories: { ...s.histories, [id]: { past, future: [] } },
      }
    }),

  setFrameSnapshot: (id, dataUrl) =>
    set((s) => ({
      frames: s.frames.map((f) => (f.id === id ? { ...f, dataUrl } : f)),
    })),

  clearFrame: () =>
    set((s) => {
      const frame = s.frames.find((f) => f.id === s.currentId)
      if (!frame || (!frame.json && !frame.dataUrl)) return s
      const history = historyFor(s.histories, s.currentId)
      const past = [...history.past, frame.json].slice(-HISTORY_LIMIT)
      return {
        frames: s.frames.map((f) =>
          f.id === s.currentId ? { ...f, json: null, dataUrl: null } : f
        ),
        histories: { ...s.histories, [s.currentId]: { past, future: [] } },
        revision: s.revision + 1,
      }
    }),

  undo: () =>
    set((s) => {
      const history = historyFor(s.histories, s.currentId)
      if (history.past.length === 0) return s
      const frame = s.frames.find((f) => f.id === s.currentId)
      if (!frame) return s
      const past = [...history.past]
      const previous = past.pop()!
      return {
        frames: s.frames.map((f) =>
          f.id === s.currentId ? { ...f, json: previous, dataUrl: null } : f
        ),
        histories: {
          ...s.histories,
          [s.currentId]: { past, future: [...history.future, frame.json] },
        },
        revision: s.revision + 1,
      }
    }),

  redo: () =>
    set((s) => {
      const history = historyFor(s.histories, s.currentId)
      if (history.future.length === 0) return s
      const frame = s.frames.find((f) => f.id === s.currentId)
      if (!frame) return s
      const future = [...history.future]
      const next = future.pop()!
      return {
        frames: s.frames.map((f) =>
          f.id === s.currentId ? { ...f, json: next, dataUrl: null } : f
        ),
        histories: {
          ...s.histories,
          [s.currentId]: { past: [...history.past, frame.json], future },
        },
        revision: s.revision + 1,
      }
    }),
}))
