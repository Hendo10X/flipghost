import { create } from "zustand"

/** Snapshot width for thumbnails, onion skins and playback preview. */
export const SNAPSHOT_SIZE = 720

export const FPS_OPTIONS = [12, 24, 30] as const

/** Most frames that can be ghosted on each side of the current one. */
export const ONION_MAX = 3

export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 8

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

/** Ghost opacity for the nth neighbouring frame (1 = adjacent). */
export function onionStepOpacity(base: number, step: number) {
  return base * Math.pow(0.55, step - 1)
}

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

/**
 * `eyedropper` is a mode rather than a tool you stay in: the next click on the
 * canvas takes a colour and hands you straight back to the brush. It is not in
 * the toolbar rail for that reason — it lives in the colour popover, which is
 * where you are standing when you want it.
 */
// `bucket` has flood-fill canvas logic in canvas-stage but no toolbar button
// yet, so it is not reachable from the UI — that wiring is issue #21. Included
// here so the existing `tool === "bucket"` guards type-check.
export type Tool = "brush" | "eraser" | "select" | "eyedropper" | "bucket"

export type FrameJSON = Record<string, unknown>

export interface Frame {
  id: string
  /** Serialized Fabric.js canvas state, null for a blank frame. */
  json: FrameJSON | null
  /** PNG snapshot (transparent background) used for thumbs/onion/playback. */
  dataUrl: string | null
}

export interface AudioTrack {
  id: string
  name: string
  /** Data URL (base64) or Blob URL for audio playback */
  dataUrl: string
  /** Full original duration in seconds */
  duration: number
  /** Frame index where audio playback starts (0-indexed) */
  startFrame: number
  /** Start offset inside the audio file in seconds */
  offset: number
  /** Active trimmed duration in seconds (optional) */
  trimDuration?: number
  /** Volume level 0.0 to 1.0 */
  volume: number
  /** Whether the audio track is muted */
  muted: boolean
}

/**
 * One undoable step: the whole frame list plus which frame was open.
 *
 * Holding the entire list sounds expensive but is close to free. Every
 * mutation below rebuilds the array while reusing the frame objects it did
 * not touch, so a step costs one array of pointers. Nothing is cloned, and
 * the snapshots share their unchanged frames with the live state.
 */
interface HistoryEntry {
  frames: Frame[]
  currentId: string
}

const HISTORY_LIMIT = 50

function blankFrame(): Frame {
  return { id: crypto.randomUUID(), json: null, dataUrl: null }
}

function entryOf(state: { frames: Frame[]; currentId: string }): HistoryEntry {
  return { frames: state.frames, currentId: state.currentId }
}

/**
 * Wraps a change so it can be undone, recording where we were before it.
 * Any new edit drops the redo stack, which is the usual branching rule.
 */
function recording(
  state: { frames: Frame[]; currentId: string; past: HistoryEntry[] },
  next: { frames: Frame[]; currentId?: string }
) {
  return {
    ...next,
    past: [...state.past, entryOf(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
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
  /** How many frames before/after the current one to ghost (0-3). */
  onionBefore: number
  onionAfter: number
  /** Opacity of the nearest ghost; further ones fall off from here. */
  onionOpacity: number
  /** Viewport zoom, where 1 fits the stage to the viewport. */
  zoom: number
  tool: Tool
  brushColor: string
  brushSize: number
  stagePresetId: string
  /** Data URL of an image waiting to be placed on the canvas. */
  pendingImport: string | null
  /** Audio clips on the single timeline lane. Empty when no audio added. */
  audioClips: AudioTrack[]
  /** Cloud project id once saved; null means local scratch work. */
  projectId: string | null
  cloudStatus: "idle" | "saving" | "saved" | "error"
  /** Undo/redo stacks over the frame list. See {@link HistoryEntry}. */
  past: HistoryEntry[]
  future: HistoryEntry[]

  tourOpen: boolean
  tourStep: number
  startTour: () => void
  nextTourStep: (maxSteps?: number) => void
  prevTourStep: () => void
  closeTour: () => void

  setProjectId: (id: string | null) => void
  setCloudStatus: (status: "idle" | "saving" | "saved" | "error") => void
  setStagePreset: (id: string) => void
  requestImport: (dataUrl: string) => void
  clearPendingImport: () => void
  addAudioClip: (clip: AudioTrack) => void
  updateAudioClip: (id: string, partial: Partial<AudioTrack>) => void
  removeAudioClip: (id: string) => void
  duplicateAudioClip: (id: string) => void
  splitAudioClip: (id: string, atFrame: number) => void
  setTitle: (title: string) => void
  setTool: (tool: Tool) => void
  setBrushColor: (color: string) => void
  setBrushSize: (size: number) => void
  setFps: (fps: number) => void
  setPlaying: (playing: boolean) => void
  toggleOnionSkin: () => void
  setOnionBefore: (count: number) => void
  setOnionAfter: (count: number) => void
  setOnionOpacity: (opacity: number) => void
  setZoom: (zoom: number) => void

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
  onionBefore: 1,
  onionAfter: 1,
  onionOpacity: 0.3,
  zoom: 1,
  tool: "brush",
  brushColor: "#1a1a1a",
  brushSize: 8,
  stagePresetId: "square",
  pendingImport: null,
  audioClips: [],
  projectId: null,
  cloudStatus: "idle",
  past: [],
  future: [],
  tourOpen: false,
  tourStep: 0,

  startTour: () => set({ tourOpen: true, tourStep: 0 }),
  nextTourStep: (maxSteps = 9) =>
    set((s) => {
      if (s.tourStep < maxSteps - 1) {
        return { tourStep: s.tourStep + 1 }
      }
      try {
        window.localStorage.setItem("flipghost:tour-completed:v1", "true")
      } catch {}
      return { tourOpen: false }
    }),
  prevTourStep: () => set((s) => ({ tourStep: Math.max(0, s.tourStep - 1) })),
  closeTour: () => {
    try {
      window.localStorage.setItem("flipghost:tour-completed:v1", "true")
    } catch {}
    set({ tourOpen: false })
  },

  setProjectId: (projectId) => set({ projectId }),
  setCloudStatus: (cloudStatus) => set({ cloudStatus }),
  setStagePreset: (id) =>
    set({ stagePresetId: getStagePreset(id).id }),
  requestImport: (dataUrl) => set({ pendingImport: dataUrl }),
  clearPendingImport: () => set({ pendingImport: null }),
  addAudioClip: (clip) => set((s) => ({ audioClips: [...s.audioClips, clip] })),
  updateAudioClip: (id, partial) =>
    set((s) => ({
      audioClips: s.audioClips.map((c) =>
        c.id === id ? { ...c, ...partial } : c
      ),
    })),
  removeAudioClip: (id) =>
    set((s) => ({ audioClips: s.audioClips.filter((c) => c.id !== id) })),

  /** The played length of a clip in seconds, after start-offset and trim. */
  duplicateAudioClip: (id) =>
    set((s) => {
      const src = s.audioClips.find((c) => c.id === id)
      if (!src) return s
      const played = Math.min(
        src.duration - src.offset,
        src.trimDuration ?? src.duration - src.offset
      )
      // Drop the copy right after the original so they don't overlap.
      const spanFrames = Math.max(1, Math.ceil(played * get().fps))
      const copy: AudioTrack = {
        ...src,
        id: crypto.randomUUID(),
        startFrame: src.startFrame + spanFrames,
      }
      return { audioClips: [...s.audioClips, copy] }
    }),

  splitAudioClip: (id, atFrame) =>
    set((s) => {
      const src = s.audioClips.find((c) => c.id === id)
      if (!src) return s
      const played = Math.min(
        src.duration - src.offset,
        src.trimDuration ?? src.duration - src.offset
      )
      const spanFrames = Math.max(1, Math.ceil(played * get().fps))
      // Only split when the cut lands strictly inside the clip.
      if (atFrame <= src.startFrame || atFrame >= src.startFrame + spanFrames) {
        return s
      }
      const firstLen = (atFrame - src.startFrame) / get().fps
      const left: AudioTrack = { ...src, trimDuration: firstLen }
      const right: AudioTrack = {
        ...src,
        id: crypto.randomUUID(),
        startFrame: atFrame,
        offset: src.offset + firstLen,
        trimDuration: played - firstLen,
      }
      return {
        audioClips: s.audioClips
          .map((c) => (c.id === id ? left : c))
          .concat(right),
      }
    }),
  setTitle: (title) => set({ title }),
  setTool: (tool) => set({ tool }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setFps: (fps) => set({ fps }),
  setPlaying: (playing) => set({ playing }),
  toggleOnionSkin: () => set((s) => ({ onionSkin: !s.onionSkin })),
  setOnionBefore: (count) =>
    set({ onionBefore: clamp(Math.round(count), 0, ONION_MAX) }),
  setOnionAfter: (count) =>
    set({ onionAfter: clamp(Math.round(count), 0, ONION_MAX) }),
  setOnionOpacity: (opacity) =>
    set({ onionOpacity: clamp(opacity, 0.05, 0.8) }),
  setZoom: (zoom) => set({ zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX) }),

  selectFrame: (id) => {
    if (get().frames.some((f) => f.id === id)) set({ currentId: id })
  },

  addFrame: () =>
    set((s) => {
      const index = s.frames.findIndex((f) => f.id === s.currentId)
      const frame = blankFrame()
      const frames = [...s.frames]
      frames.splice(index + 1, 0, frame)
      return recording(s, { frames, currentId: frame.id })
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
      return recording(s, { frames, currentId: copy.id })
    }),

  deleteFrame: () =>
    set((s) => {
      const index = s.frames.findIndex((f) => f.id === s.currentId)

      // Deleting the only frame leaves a blank one rather than no canvas.
      if (s.frames.length === 1) {
        const frame = blankFrame()
        return recording(s, { frames: [frame], currentId: frame.id })
      }
      const frames = s.frames.filter((f) => f.id !== s.currentId)
      const next = frames[Math.min(index, frames.length - 1)]
      return recording(s, { frames, currentId: next.id })
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
      return recording(s, { frames })
    }),

  commitFrame: (id, json, dataUrl) =>
    set((s) => {
      const frame = s.frames.find((f) => f.id === id)
      if (!frame) return s
      return recording(s, {
        frames: s.frames.map((f) => (f.id === id ? { ...f, json, dataUrl } : f)),
      })
    }),

  setFrameSnapshot: (id, dataUrl) =>
    set((s) => ({
      frames: s.frames.map((f) => (f.id === id ? { ...f, dataUrl } : f)),
    })),

  clearFrame: () =>
    set((s) => {
      const frame = s.frames.find((f) => f.id === s.currentId)
      if (!frame || (!frame.json && !frame.dataUrl)) return s
      return {
        ...recording(s, {
          frames: s.frames.map((f) =>
            f.id === s.currentId ? { ...f, json: null, dataUrl: null } : f
          ),
        }),
        revision: s.revision + 1,
      }
    }),

  /**
   * Steps back one edit, whatever it was: a stroke, a cleared frame, or a
   * frame added, duplicated, reordered, or deleted. Restoring `currentId`
   * alongside the frames means undo lands you on the frame that changed
   * rather than silently altering one you cannot see.
   */
  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s
      const past = [...s.past]
      const entry = past.pop()!
      return {
        frames: entry.frames,
        currentId: entry.currentId,
        past,
        future: [...s.future, entryOf(s)].slice(-HISTORY_LIMIT),
        revision: s.revision + 1,
      }
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s
      const future = [...s.future]
      const entry = future.pop()!
      return {
        frames: entry.frames,
        currentId: entry.currentId,
        past: [...s.past, entryOf(s)].slice(-HISTORY_LIMIT),
        future,
        revision: s.revision + 1,
      }
    }),
}))
