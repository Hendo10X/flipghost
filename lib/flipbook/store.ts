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

export interface FrameLayer {
  id: string
  name: string
  /** Stored bottom-to-top; hidden layers are skipped when the frame renders. */
  hidden: boolean
  locked: boolean
  opacity: number
  json: FrameJSON | null
}

export interface Frame {
  id: string
  /** Serialized Fabric.js canvas state, null for a blank frame. */
  json: FrameJSON | null
  /** PNG snapshot (transparent background) used for thumbs/onion/playback. */
  dataUrl: string | null
  layers?: FrameLayer[]
  activeLayerId?: string
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
const SAVED_LAYERS_PROP = "fgLayers"
const SAVED_ACTIVE_LAYER_PROP = "fgActiveLayerId"

function blankLayer(index = 1): FrameLayer {
  return {
    id: crypto.randomUUID(),
    name: `Layer ${index}`,
    hidden: false,
    locked: false,
    opacity: 1,
    json: null,
  }
}

function blankFrame(layers?: FrameLayer[], activeLayerId?: string): Frame {
  const frameLayers =
    layers?.map((layer) => ({ ...layer, json: null })) ?? [blankLayer()]
  return {
    id: crypto.randomUUID(),
    json: null,
    dataUrl: null,
    layers: frameLayers,
    activeLayerId: activeLayerId ?? frameLayers[frameLayers.length - 1].id,
  }
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

function cloneJSON<T>(value: T): T {
  return structuredClone(value)
}

function jsonObjects(json: FrameJSON | null): Record<string, unknown>[] {
  const objects = json?.objects
  return Array.isArray(objects) ? (objects as Record<string, unknown>[]) : []
}

function withObjects(
  base: FrameJSON | null,
  objects: Record<string, unknown>[]
): FrameJSON | null {
  if (objects.length === 0) return null
  return { ...(base ?? {}), objects }
}

export function ensureFrameLayers(frame: Frame): Frame {
  if (frame.layers?.length) {
    const activeLayerId =
      frame.activeLayerId && frame.layers.some((layer) => layer.id === frame.activeLayerId)
        ? frame.activeLayerId
        : frame.layers[frame.layers.length - 1].id
    return { ...frame, activeLayerId }
  }

  const savedLayers = frame.json?.[SAVED_LAYERS_PROP]
  if (Array.isArray(savedLayers) && savedLayers.length) {
    const layers = savedLayers as FrameLayer[]
    const savedActive = frame.json?.[SAVED_ACTIVE_LAYER_PROP]
    const activeLayerId =
      typeof savedActive === "string" &&
      layers.some((layer) => layer.id === savedActive)
        ? savedActive
        : layers[layers.length - 1].id
    return {
      ...frame,
      layers,
      activeLayerId,
    }
  }

  const layer = blankLayer()
  return {
    ...frame,
    layers: [{ ...layer, json: frame.json }],
    activeLayerId: layer.id,
  }
}

function layerTemplate(frame: Frame): FrameLayer[] {
  return (ensureFrameLayers(frame).layers ?? []).map((layer) => ({
    ...layer,
    json: null,
  }))
}

function alignFrameLayers(
  frame: Frame,
  template: FrameLayer[],
  activeLayerId?: string
): Frame {
  const normalized = ensureFrameLayers(frame)
  const existing = normalized.layers ?? []
  const layers = template.map((layer, index) => {
    const match = existing.find((item) => item.id === layer.id) ?? existing[index]
    return {
      ...layer,
      json: match?.json ? cloneJSON(match.json) : null,
    }
  })
  return withComposite({
    ...normalized,
    layers,
    activeLayerId: activeLayerId ?? normalized.activeLayerId ?? layers[layers.length - 1].id,
  }, null)
}

export function normalizeFramesLayers(frames: Frame[]): Frame[] {
  if (!frames.length) return [blankFrame()]
  const normalized = frames.map(ensureFrameLayers)
  const source = normalized.reduce((best, frame) =>
    (frame.layers?.length ?? 0) > (best.layers?.length ?? 0) ? frame : best
  )
  const template = layerTemplate(source)
  const activeLayerId =
    source.activeLayerId && template.some((layer) => layer.id === source.activeLayerId)
      ? source.activeLayerId
      : template[template.length - 1].id
  return normalized.map((frame) => alignFrameLayers(frame, template, activeLayerId))
}

export function frameJSONForStorage(frame: Frame): FrameJSON | null {
  const normalized = ensureFrameLayers(frame)
  const json = layeredFrameJSON(normalized) ?? {}
  return {
    ...json,
    [SAVED_LAYERS_PROP]: normalized.layers ?? [],
    [SAVED_ACTIVE_LAYER_PROP]: normalized.activeLayerId,
  }
}

export function layerCount(frame: Frame): number {
  return ensureFrameLayers(frame).layers?.length ?? 1
}

export function activeLayerIndex(frame: Frame): number {
  const normalized = ensureFrameLayers(frame)
  const index =
    normalized.layers?.findIndex((layer) => layer.id === normalized.activeLayerId) ?? 0
  return index >= 0 ? index : 0
}

export function activeLayer(frame: Frame): FrameLayer | null {
  const normalized = ensureFrameLayers(frame)
  return (
    normalized.layers?.find((layer) => layer.id === normalized.activeLayerId) ??
    normalized.layers?.[0] ??
    null
  )
}

export function layeredFrameJSON(frame: Frame): FrameJSON | null {
  const normalized = ensureFrameLayers(frame)
  const layers = normalized.layers ?? []
  if (!layers.length) return normalized.json

  const base = normalized.json ?? layers.find((layer) => layer.json)?.json ?? null
  const objects = layers.flatMap((layer) => {
    if (layer.hidden) return []
    return jsonObjects(layer.json).map((object) => {
      const baseOpacity =
        typeof object.opacity === "number" && Number.isFinite(object.opacity)
          ? object.opacity
          : 1
      return {
        ...cloneJSON(object),
        opacity: baseOpacity * layer.opacity,
        fgLayerId: layer.id,
        fgBaseOpacity: baseOpacity,
      }
    })
  })
  return withObjects(base, objects)
}

function withComposite(frame: Frame, dataUrl: string | null = frame.dataUrl): Frame {
  return {
    ...frame,
    json: layeredFrameJSON(frame),
    dataUrl,
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
  /** Audio track aligned to the timeline, null if no audio added. */
  audioTrack: AudioTrack | null
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
  setAudioTrack: (audio: AudioTrack | null) => void
  updateAudioTrack: (partial: Partial<AudioTrack>) => void
  removeAudioTrack: () => void
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
  commitFrame: (
    id: string,
    json: FrameJSON | null,
    dataUrl: string | null,
    layers?: FrameLayer[]
  ) => void
  /** Refresh a frame's snapshot without touching history (after undo/redo). */
  setFrameSnapshot: (id: string, dataUrl: string | null) => void
  clearFrame: () => void
  addLayer: () => void
  duplicateLayer: () => void
  deleteLayer: () => void
  renameLayer: (id: string, name: string) => void
  selectLayer: (id: string) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  toggleLayerHidden: (id: string) => void
  toggleLayerLocked: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void
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
  audioTrack: null,
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
  setAudioTrack: (audioTrack) => set({ audioTrack }),
  updateAudioTrack: (partial) =>
    set((s) => ({
      audioTrack: s.audioTrack ? { ...s.audioTrack, ...partial } : null,
    })),
  removeAudioTrack: () => set({ audioTrack: null }),
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
      const current = ensureFrameLayers(s.frames[index])
      const frame = blankFrame(layerTemplate(current), current.activeLayerId)
      const frames = [...s.frames]
      frames.splice(index + 1, 0, frame)
      return recording(s, { frames, currentId: frame.id })
    }),

  duplicateFrame: () =>
    set((s) => {
      const index = s.frames.findIndex((f) => f.id === s.currentId)
      const source = ensureFrameLayers(s.frames[index])
      const copy: Frame = {
        id: crypto.randomUUID(),
        json: source.json ? structuredClone(source.json) : null,
        dataUrl: source.dataUrl,
        layers: source.layers?.map((layer) => ({
          ...layer,
          json: layer.json ? cloneJSON(layer.json) : null,
        })),
        activeLayerId: source.activeLayerId,
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
        const current = ensureFrameLayers(s.frames[0])
        const frame = blankFrame(layerTemplate(current), current.activeLayerId)
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

  commitFrame: (id, json, dataUrl, layers) =>
    set((s) => {
      const frame = s.frames.find((f) => f.id === id)
      if (!frame) return s
      return recording(s, {
        frames: s.frames.map((f) =>
          f.id === id ? { ...ensureFrameLayers(f), json, dataUrl, layers } : f
        ),
      })
    }),

  setFrameSnapshot: (id, dataUrl) =>
    set((s) => ({
      frames: s.frames.map((f) => (f.id === id ? { ...f, dataUrl } : f)),
    })),

  clearFrame: () =>
    set((s) => {
      const frame = ensureFrameLayers(
        s.frames.find((f) => f.id === s.currentId) ?? blankFrame()
      )
      const layer = activeLayer(frame)
      if (!layer || layer.locked || (!layer.json && !frame.dataUrl)) return s
      const layers = frame.layers?.map((item) =>
        item.id === layer.id ? { ...item, json: null } : item
      )
      const nextFrame = withComposite({ ...frame, layers }, null)
      return {
        ...recording(s, {
          frames: s.frames.map((f) => (f.id === s.currentId ? nextFrame : f)),
        }),
        revision: s.revision + 1,
      }
    }),

  addLayer: () =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      const layer = blankLayer((frame.layers?.length ?? 0) + 1)
      const template = [...layerTemplate(frame), layer]
      return {
        ...recording(s, {
          frames: s.frames.map((f) => alignFrameLayers(f, template, layer.id)),
        }),
        revision: s.revision + 1,
      }
    }),

  duplicateLayer: () =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      const layers = frame.layers ?? []
      const index = layers.findIndex((layer) => layer.id === frame.activeLayerId)
      const source = layers[index]
      if (!source) return s
      const copyId = crypto.randomUUID()
      const template = [...layerTemplate(frame)]
      template.splice(index + 1, 0, {
        ...template[index],
        id: copyId,
        name: `${source.name} copy`,
        json: null,
      })
      return {
        ...recording(s, {
          frames: s.frames.map((f) => {
            const normalized = ensureFrameLayers(f)
            const frameLayers = normalized.layers ?? []
            const sourceLayer =
              frameLayers.find((layer) => layer.id === source.id) ?? frameLayers[index]
            const nextLayers = template.map((layer) => ({
              ...layer,
              json:
                layer.id === copyId
                  ? sourceLayer?.json
                    ? cloneJSON(sourceLayer.json)
                    : null
                  : frameLayers.find((item) => item.id === layer.id)?.json ?? null,
            }))
            return withComposite({
              ...normalized,
              layers: nextLayers,
              activeLayerId: copyId,
            }, null)
          }),
        }),
        revision: s.revision + 1,
      }
    }),

  deleteLayer: () =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      const layers = frame.layers ?? []
      if (layers.length <= 1) {
        const layer = { ...layers[0], json: null, hidden: false, locked: false, opacity: 1 }
        return {
          ...recording(s, {
            frames: s.frames.map((f) =>
              withComposite({ ...ensureFrameLayers(f), layers: [layer], activeLayerId: layer.id }, null)
            ),
          }),
          revision: s.revision + 1,
        }
      }
      const index = layers.findIndex((layer) => layer.id === frame.activeLayerId)
      const template = layerTemplate(frame).filter((layer) => layer.id !== frame.activeLayerId)
      const nextActiveId = template[Math.min(Math.max(index, 0), template.length - 1)].id
      return {
        ...recording(s, {
          frames: s.frames.map((f) => alignFrameLayers(f, template, nextActiveId)),
        }),
        revision: s.revision + 1,
      }
    }),

  renameLayer: (id, name) =>
    set((s) => {
      const trimmed = name.trim()
      if (!trimmed) return s
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      const template = layerTemplate(frame).map((layer) =>
        layer.id === id ? { ...layer, name: trimmed } : layer
      )
      return recording(s, {
        frames: s.frames.map((f) => alignFrameLayers(f, template)),
      })
    }),

  selectLayer: (id) =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      if (!frame.layers?.some((layer) => layer.id === id)) return s
      return {
        frames: s.frames.map((f) =>
          ensureFrameLayers({ ...f, activeLayerId: id })
        ),
        currentId: s.currentId,
      }
    }),

  reorderLayers: (fromIndex, toIndex) =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      const layers = [...(frame.layers ?? [])]
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= layers.length ||
        toIndex >= layers.length
      ) {
        return s
      }
      const [moved] = layers.splice(fromIndex, 1)
      layers.splice(toIndex, 0, moved)
      const template = layers.map((layer) => ({ ...layer, json: null }))
      return {
        ...recording(s, {
          frames: s.frames.map((f) => {
            const aligned = alignFrameLayers(f, template, frame.activeLayerId)
            // A reorder is a global layer-stack change, but it must not wipe the
            // neighbouring frames' cached snapshots: doing so blanks their onion
            // skins. Only the current frame gets re-snapshotted when the canvas
            // reloads it.
            return f.id === s.currentId
              ? aligned
              : { ...aligned, dataUrl: f.dataUrl }
          }),
        }),
        revision: s.revision + 1,
      }
    }),

  toggleLayerHidden: (id) =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      const template = layerTemplate(frame).map((layer) =>
        layer.id === id ? { ...layer, hidden: !layer.hidden } : layer
      )
      return {
        ...recording(s, {
          frames: s.frames.map((f) => alignFrameLayers(f, template, frame.activeLayerId)),
        }),
        revision: s.revision + 1,
      }
    }),

  toggleLayerLocked: (id) =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      const template = layerTemplate(frame).map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      )
      return {
        ...recording(s, {
          frames: s.frames.map((f) => alignFrameLayers(f, template, frame.activeLayerId)),
        }),
        revision: s.revision + 1,
      }
    }),

  setLayerOpacity: (id, opacity) =>
    set((s) => {
      const frame = ensureFrameLayers(s.frames.find((f) => f.id === s.currentId)!)
      if (!frame.layers?.some((layer) => layer.id === id)) return s
      // Opacity is per-frame, so only the current frame is rebuilt. Other
      // frames keep their layers and snapshots untouched, which keeps their
      // onion skins intact instead of reloading or blanking them.
      const layers = (frame.layers ?? []).map((layer) =>
        layer.id === id ? { ...layer, opacity: clamp(opacity, 0.05, 1) } : layer
      )
      const nextFrame = withComposite({ ...frame, layers }, null)
      return {
        ...recording(s, {
          frames: s.frames.map((f) => (f.id === s.currentId ? nextFrame : f)),
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
