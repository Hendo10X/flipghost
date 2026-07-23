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
export type Tool = "brush" | "eraser" | "select" | "eyedropper"

export type FrameJSON = Record<string, unknown>

export interface Frame {
  id: string
  /** Serialized Fabric.js canvas state, null for a blank frame cell. */
  json: FrameJSON | null
  /** PNG snapshot (transparent background) used for thumbs/onion/playback. */
  dataUrl: string | null
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  frames: Frame[]
}

interface HistoryEntry {
  layers: Layer[]
  currentLayerId: string
  currentFrameIndex: number
}

const HISTORY_LIMIT = 50

function blankFrame(): Frame {
  return { id: crypto.randomUUID(), json: null, dataUrl: null }
}

function blankLayer(name: string, frameCount: number): Layer {
  return {
    id: crypto.randomUUID(),
    name,
    visible: true,
    frames: Array.from({ length: frameCount }, () => blankFrame()),
  }
}

function cloneFrame(frame: Frame, regenerateId = false): Frame {
  return {
    id: regenerateId ? crypto.randomUUID() : frame.id,
    json: frame.json ? structuredClone(frame.json) : null,
    dataUrl: frame.dataUrl,
  }
}

function cloneLayer(layer: Layer, regenerateFrameIds = false): Layer {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    frames: layer.frames.map((frame) => cloneFrame(frame, regenerateFrameIds)),
  }
}

function ensureLayerFrames(layer: Layer, frameCount: number): Layer {
  if (layer.frames.length === frameCount) return layer
  if (layer.frames.length > frameCount) {
    return { ...layer, frames: layer.frames.slice(0, frameCount) }
  }
  return {
    ...layer,
    frames: [...layer.frames, ...Array.from({ length: frameCount - layer.frames.length }, () => blankFrame())],
  }
}

function layersWithFrameCount(layers: Layer[], frameCount: number) {
  return layers.map((layer) => ensureLayerFrames(layer, frameCount))
}

function uniqueFrameIds(layers: Layer[]) {
  const seen = new Set<string>()
  return layers.map((layer) => ({
    ...layer,
    frames: layer.frames.map((frame) => {
      if (seen.has(frame.id)) {
        return { ...frame, id: crypto.randomUUID() }
      }
      seen.add(frame.id)
      return frame
    }),
  }))
}

function currentLayerIndex(state: { layers: Layer[]; currentLayerId: string }) {
  return Math.max(0, state.layers.findIndex((layer) => layer.id === state.currentLayerId))
}

function frameCountOf(layers: Layer[]) {
  return layers[0]?.frames.length ?? 0
}

function cellAt(layer: Layer | undefined, index: number) {
  return layer?.frames[index] ?? null
}

function entryOf(state: {
  layers: Layer[]
  currentLayerId: string
  currentFrameIndex: number
}): HistoryEntry {
  return {
    layers: state.layers.map((layer) => cloneLayer(layer)),
    currentLayerId: state.currentLayerId,
    currentFrameIndex: state.currentFrameIndex,
  }
}

function recording(
  state: {
    layers: Layer[]
    currentLayerId: string
    currentFrameIndex: number
    past: HistoryEntry[]
  },
  next: {
    layers: Layer[]
    currentLayerId?: string
    currentFrameIndex?: number
  }
) {
  return {
    ...next,
    past: [...state.past, entryOf(state)].slice(-HISTORY_LIMIT),
    future: [],
  }
}

function makeLayerName(baseName: string, layers: Layer[]) {
  const existing = new Set(layers.map((layer) => layer.name))
  if (!existing.has(baseName)) return baseName
  let index = 2
  while (existing.has(`${baseName} ${index}`)) index += 1
  return `${baseName} ${index}`
}

function insertAt<T>(items: T[], index: number, item: T) {
  const next = [...items]
  next.splice(index, 0, item)
  return next
}

function moveAt<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export interface ProjectSnapshot {
  title: string
  layers: Layer[]
  currentLayerId: string
  currentFrameIndex: number
  fps: number
  onionSkin: boolean
  onionBefore: number
  onionAfter: number
  onionOpacity: number
  stagePresetId: string
  brushColor: string
  brushSize: number
}

export function normalizeProjectSnapshot(
  snapshot: Partial<ProjectSnapshot> & {
    layers?: Layer[]
  }
): ProjectSnapshot {
  const layers = snapshot.layers?.length
    ? snapshot.layers.map((layer) => cloneLayer(layer))
    : [blankLayer("Layer 1", 1)]
  const frameCount = Math.max(1, frameCountOf(layers))
  const normalizedLayers = uniqueFrameIds(layersWithFrameCount(layers, frameCount))
  const firstLayer = normalizedLayers[0]
  const currentLayerId =
    normalizedLayers.find((layer) => layer.id === snapshot.currentLayerId)?.id ??
    firstLayer.id
  const currentFrameIndex = clamp(
    Math.round(snapshot.currentFrameIndex ?? 0),
    0,
    frameCount - 1
  )

  return {
    title: snapshot.title?.trim() || "Untitled Animation",
    layers: normalizedLayers,
    currentLayerId,
    currentFrameIndex,
    fps: Number.isFinite(snapshot.fps) ? Math.round(snapshot.fps!) : 12,
    onionSkin: snapshot.onionSkin ?? true,
    onionBefore: clamp(Math.round(snapshot.onionBefore ?? 1), 0, ONION_MAX),
    onionAfter: clamp(Math.round(snapshot.onionAfter ?? 1), 0, ONION_MAX),
    onionOpacity: clamp(snapshot.onionOpacity ?? 0.3, 0.05, 0.8),
    stagePresetId: getStagePreset(snapshot.stagePresetId ?? "square").id,
    brushColor: snapshot.brushColor ?? "#1a1a1a",
    brushSize: Math.max(1, Math.round(snapshot.brushSize ?? 8)),
  }
}

export function snapshotFromState(state: ProjectSnapshot): ProjectSnapshot {
  return normalizeProjectSnapshot(state)
}

/** Shallow compare, so new snapshot fields are covered automatically. */
export function snapshotChanged(a: ProjectSnapshot, b: ProjectSnapshot) {
  return (Object.keys(a) as (keyof ProjectSnapshot)[]).some((key) => a[key] !== b[key])
}

interface FlipbookState extends ProjectSnapshot {
  /** Bumped whenever frame content changes outside the canvas. */
  revision: number
  playing: boolean
  /** Viewport zoom, where 1 fits the stage to the viewport. */
  zoom: number
  tool: Tool
  /** Data URL of an image waiting to be placed on the canvas. */
  pendingImport: string | null
  /** Cloud project id once saved; null means local scratch work. */
  projectId: string | null
  cloudStatus: "idle" | "saving" | "saved" | "error"
  /** Undo/redo stacks over the layer stack. */
  past: HistoryEntry[]
  future: HistoryEntry[]

  setProjectId: (id: string | null) => void
  setCloudStatus: (status: "idle" | "saving" | "saved" | "error") => void
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
  setOnionBefore: (count: number) => void
  setOnionAfter: (count: number) => void
  setOnionOpacity: (opacity: number) => void
  setZoom: (zoom: number) => void

  selectLayer: (id: string) => void
  selectFrame: (index: number) => void
  setLayerName: (id: string, name: string) => void
  toggleLayerVisibility: (id: string) => void
  addLayer: () => void
  duplicateLayer: () => void
  deleteLayer: () => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  addFrame: () => void
  duplicateFrame: () => void
  deleteFrame: () => void
  reorderFrames: (fromIndex: number, toIndex: number) => void

  /** Record a canvas-driven change (stroke drawn, stroke erased). */
  commitFrame: (
    layerId: string,
    frameIndex: number,
    json: FrameJSON,
    dataUrl: string | null
  ) => void
  /** Refresh a frame's snapshot without touching history (after undo/redo). */
  setFrameSnapshot: (layerId: string, frameIndex: number, dataUrl: string | null) => void
  clearFrame: () => void
  undo: () => void
  redo: () => void
}

function activeCellState(state: FlipbookState) {
  const layerIndex = currentLayerIndex(state)
  return {
    layerIndex,
    layer: state.layers[layerIndex],
    cell: cellAt(state.layers[layerIndex], state.currentFrameIndex),
  }
}

const initialLayer = blankLayer("Layer 1", 1)

export const useFlipbook = create<FlipbookState>((set, get) => ({
  title: "Untitled Animation",
  layers: [initialLayer],
  currentLayerId: initialLayer.id,
  currentFrameIndex: 0,
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
  projectId: null,
  cloudStatus: "idle",
  past: [],
  future: [],

  setProjectId: (projectId) => set({ projectId }),
  setCloudStatus: (cloudStatus) => set({ cloudStatus }),
  setStagePreset: (id) => set({ stagePresetId: getStagePreset(id).id }),
  requestImport: (dataUrl) => set({ pendingImport: dataUrl }),
  clearPendingImport: () => set({ pendingImport: null }),
  setTitle: (title) => set({ title }),
  setTool: (tool) => set({ tool }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setFps: (fps) => set({ fps }),
  setPlaying: (playing) => set({ playing }),
  toggleOnionSkin: () => set((s) => ({ onionSkin: !s.onionSkin })),
  setOnionBefore: (count) => set({ onionBefore: clamp(Math.round(count), 0, ONION_MAX) }),
  setOnionAfter: (count) => set({ onionAfter: clamp(Math.round(count), 0, ONION_MAX) }),
  setOnionOpacity: (opacity) => set({ onionOpacity: clamp(opacity, 0.05, 0.8) }),
  setZoom: (zoom) => set({ zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX) }),

  selectLayer: (id) => {
    if (get().layers.some((layer) => layer.id === id)) set({ currentLayerId: id })
  },

  selectFrame: (index) => {
    if (index >= 0 && index < frameCountOf(get().layers)) {
      set({ currentFrameIndex: index })
    }
  },

  setLayerName: (id, name) =>
    set((s) => {
      const nextName = name.trim().slice(0, 40)
      const layers = s.layers.map((layer) =>
        layer.id === id ? { ...layer, name: nextName } : layer
      )
      return recording(s, { layers })
    }),

  toggleLayerVisibility: (id) =>
    set((s) => {
      const layers = s.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
      return recording(s, { layers })
    }),

  addLayer: () =>
    set((s) => {
      const next = blankLayer(makeLayerName(`Layer ${s.layers.length + 1}`, s.layers), frameCountOf(s.layers) || 1)
      const layerIndex = currentLayerIndex(s)
      return recording(s, {
        layers: insertAt(s.layers, layerIndex + 1, next),
        currentLayerId: next.id,
      })
    }),

  duplicateLayer: () =>
    set((s) => {
      const layerIndex = currentLayerIndex(s)
      const source = s.layers[layerIndex]
      const copy = cloneLayer(source, true)
      copy.id = crypto.randomUUID()
      copy.name = makeLayerName(`${source.name} copy`, s.layers)
      return recording(s, {
        layers: insertAt(s.layers, layerIndex + 1, copy),
        currentLayerId: copy.id,
      })
    }),

  deleteLayer: () =>
    set((s) => {
      if (s.layers.length === 1) {
        const layer = blankLayer("Layer 1", frameCountOf(s.layers) || 1)
        return recording(s, {
          layers: [layer],
          currentLayerId: layer.id,
        })
      }
      const layerIndex = currentLayerIndex(s)
      const nextLayers = s.layers.filter((layer) => layer.id !== s.currentLayerId)
      const nextLayer = nextLayers[Math.min(layerIndex, nextLayers.length - 1)]
      return recording(s, {
        layers: nextLayers,
        currentLayerId: nextLayer.id,
      })
    }),

  reorderLayers: (fromIndex, toIndex) =>
    set((s) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= s.layers.length ||
        toIndex >= s.layers.length
      ) {
        return s
      }
      const layers = moveAt(s.layers, fromIndex, toIndex)
      return {
        ...recording(s, { layers }),
        revision: s.revision + 1,
      }
    }),

  addFrame: () =>
    set((s) => {
      const frameIndex = Math.max(0, s.currentFrameIndex)
      const layers = s.layers.map((layer) => {
        const frames = [...layer.frames]
        frames.splice(frameIndex + 1, 0, blankFrame())
        return { ...layer, frames }
      })
      return {
        ...recording(s, {
          layers,
          currentFrameIndex: frameIndex + 1,
        }),
        revision: s.revision + 1,
      }
    }),

  duplicateFrame: () =>
    set((s) => {
      const frameIndex = Math.max(0, s.currentFrameIndex)
      const layers = s.layers.map((layer) => {
        const source = layer.frames[frameIndex] ?? blankFrame()
        const copy = cloneFrame(source, true)
        const frames = [...layer.frames]
        frames.splice(frameIndex + 1, 0, copy)
        return { ...layer, frames }
      })
      return {
        ...recording(s, {
          layers,
          currentFrameIndex: frameIndex + 1,
        }),
        revision: s.revision + 1,
      }
    }),

  deleteFrame: () =>
    set((s) => {
      const frameCount = frameCountOf(s.layers)
      const frameIndex = Math.max(0, Math.min(s.currentFrameIndex, frameCount - 1))
      if (frameCount <= 1) {
        const layers = s.layers.map((layer) => ({
          ...layer,
          frames: [blankFrame()],
        }))
        return {
          ...recording(s, {
            layers,
            currentFrameIndex: 0,
          }),
          revision: s.revision + 1,
        }
      }
      const layers = s.layers.map((layer) => ({
        ...layer,
        frames: layer.frames.filter((_, index) => index !== frameIndex),
      }))
      return {
        ...recording(s, {
          layers,
          currentFrameIndex: Math.min(frameIndex, frameCount - 2),
        }),
        revision: s.revision + 1,
      }
    }),

  reorderFrames: (fromIndex, toIndex) =>
    set((s) => {
      const frameCount = frameCountOf(s.layers)
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= frameCount ||
        toIndex >= frameCount
      ) {
        return s
      }
      const layers = s.layers.map((layer) => ({
        ...layer,
        frames: moveAt(layer.frames, fromIndex, toIndex),
      }))
      const currentFrameIndex =
        s.currentFrameIndex === fromIndex
          ? toIndex
          : s.currentFrameIndex > fromIndex && s.currentFrameIndex <= toIndex
            ? s.currentFrameIndex - 1
            : s.currentFrameIndex < fromIndex && s.currentFrameIndex >= toIndex
              ? s.currentFrameIndex + 1
              : s.currentFrameIndex
      return {
        ...recording(s, { layers, currentFrameIndex }),
        revision: s.revision + 1,
      }
    }),

  commitFrame: (layerId, frameIndex, json, dataUrl) =>
    set((s) => {
      const layerIndex = s.layers.findIndex((layer) => layer.id === layerId)
      if (layerIndex < 0) return s
      const layer = s.layers[layerIndex]
      if (frameIndex < 0 || frameIndex >= layer.frames.length) return s
      const layers = s.layers.map((entry) =>
        entry.id === layerId
          ? {
              ...entry,
              frames: entry.frames.map((frame, index) =>
                index === frameIndex ? { ...frame, json, dataUrl } : frame
              ),
            }
          : entry
      )
      return {
        ...recording(s, { layers }),
        revision: s.revision + 1,
      }
    }),

  setFrameSnapshot: (layerId, frameIndex, dataUrl) =>
    set((s) => ({
      layers: s.layers.map((entry) =>
        entry.id === layerId
          ? {
              ...entry,
              frames: entry.frames.map((frame, index) =>
                index === frameIndex ? { ...frame, dataUrl } : frame
              ),
            }
          : entry
      ),
    })),

  clearFrame: () =>
    set((s) => {
      const { layer, cell } = activeCellState(s)
      if (!layer || (!cell?.json && !cell?.dataUrl)) return s
      const layers = s.layers.map((entry) =>
        entry.id === layer.id
          ? {
              ...entry,
              frames: entry.frames.map((frame, index) =>
                index === s.currentFrameIndex
                  ? { ...frame, json: null, dataUrl: null }
                  : frame
              ),
            }
          : entry
      )
      return {
        ...recording(s, { layers }),
        revision: s.revision + 1,
      }
    }),

  /**
   * Steps back one edit, whatever it was: a stroke, a cleared frame, or a
   * frame/layer added, duplicated, reordered, or deleted.
   */
  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s
      const past = [...s.past]
      const entry = past.pop()!
      return {
        layers: entry.layers,
        currentLayerId: entry.currentLayerId,
        currentFrameIndex: entry.currentFrameIndex,
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
        layers: entry.layers,
        currentLayerId: entry.currentLayerId,
        currentFrameIndex: entry.currentFrameIndex,
        past: [...s.past, entryOf(s)].slice(-HISTORY_LIMIT),
        future,
        revision: s.revision + 1,
      }
    }),
}))
