import type { FabricObject } from "fabric"

import { getStagePreset, SNAPSHOT_SIZE, type Frame, type FrameJSON } from "./store"

const INK = "#1a1a1a"
const ACCENT = "#0ea5e9"

type FabricModule = typeof import("fabric")

interface FrameContext {
  /** Frame index, 0-based. */
  i: number
  /** Total frames in the loop. */
  count: number
  /** Loop position, 0 to just under 1. */
  t: number
  width: number
  height: number
  fabric: FabricModule
}

export interface DemoSpec {
  id: string
  title: string
  description: string
  fps: number
  frameCount: number
  stagePresetId: string
  /** Objects drawn on frame `i`. Frame `count` must loop back into frame 0. */
  frame: (ctx: FrameContext) => FabricObject[]
}

export const DEMOS: DemoSpec[] = [
  {
    id: "bouncing-ball",
    title: "Bouncing ball",
    description: "Squash on impact, stretch through the fall.",
    fps: 12,
    frameCount: 12,
    stagePresetId: "square",
    frame: ({ t, width, height, fabric }) => {
      const { Circle, Ellipse, Rect } = fabric
      const radius = 105
      const groundY = Math.round(height * 0.78)
      const amplitude = Math.round(height * 0.46)
      const centerX = width / 2

      const lift = Math.abs(Math.sin(Math.PI * t))
      const speed = Math.abs(Math.cos(Math.PI * t))
      const airborne = amplitude * lift

      // Squash only on the contact frame; stretch while moving fast.
      const touching = airborne < radius * 0.4
      const scaleX = touching ? 1.32 : 1 - 0.16 * speed
      const scaleY = touching ? 0.68 : 1 + 0.28 * speed

      return [
        new Rect({
          left: width * 0.12,
          top: groundY,
          width: width * 0.76,
          height: 6,
          rx: 3,
          fill: INK,
          opacity: 0.12,
          originX: "left",
          originY: "center",
        }),
        new Ellipse({
          left: centerX,
          top: groundY,
          rx: radius * (0.95 - 0.4 * lift),
          ry: radius * (0.22 - 0.08 * lift),
          fill: INK,
          opacity: 0.18 * (1 - 0.55 * lift),
          originX: "center",
          originY: "center",
        }),
        new Circle({
          left: centerX,
          top: groundY - airborne - radius * scaleY,
          radius,
          scaleX,
          scaleY,
          fill: ACCENT,
          originX: "center",
          originY: "center",
        }),
      ]
    },
  },
  {
    id: "pendulum",
    title: "Pendulum",
    description: "Easing into the extremes, fastest through the middle.",
    fps: 12,
    frameCount: 16,
    stagePresetId: "square",
    frame: ({ t, width, height, fabric }) => {
      const { Circle, Line } = fabric
      const pivotX = width / 2
      const pivotY = height * 0.16
      const length = height * 0.56
      const bobRadius = 68

      // A full there-and-back swing across the loop.
      const angle = (Math.PI / 4) * Math.cos(2 * Math.PI * t)
      const bobX = pivotX + Math.sin(angle) * length
      const bobY = pivotY + Math.cos(angle) * length

      return [
        new Line([pivotX, pivotY, bobX, bobY], {
          stroke: INK,
          strokeWidth: 6,
          opacity: 0.45,
        }),
        new Circle({
          left: pivotX,
          top: pivotY,
          radius: 12,
          fill: INK,
          originX: "center",
          originY: "center",
        }),
        new Circle({
          left: bobX,
          top: bobY,
          radius: bobRadius,
          fill: ACCENT,
          originX: "center",
          originY: "center",
        }),
      ]
    },
  },
  {
    id: "wave",
    title: "Wave",
    description: "A row of dots offset in phase, rolling left to right.",
    fps: 24,
    frameCount: 16,
    stagePresetId: "square",
    frame: ({ t, width, height, fabric }) => {
      const { Circle } = fabric
      const dots = 7
      const amplitude = height * 0.2
      const centerY = height / 2
      const spacing = width / (dots + 1)

      return Array.from({ length: dots }, (_, k) => {
        const phase = t + k / dots
        const offset = Math.sin(2 * Math.PI * phase)
        return new Circle({
          left: spacing * (k + 1),
          top: centerY + offset * amplitude,
          radius: 34,
          fill: k % 2 === 0 ? ACCENT : INK,
          opacity: k % 2 === 0 ? 1 : 0.75,
          originX: "center",
          originY: "center",
        })
      })
    },
  },
  {
    id: "orbit",
    title: "Orbit",
    description: "Three satellites tracing a shared circle.",
    fps: 24,
    frameCount: 18,
    stagePresetId: "square",
    frame: ({ t, width, height, fabric }) => {
      const { Circle } = fabric
      const centerX = width / 2
      const centerY = height / 2
      const orbit = Math.min(width, height) * 0.3

      const objects: FabricObject[] = [
        new Circle({
          left: centerX,
          top: centerY,
          radius: orbit,
          fill: "",
          stroke: INK,
          strokeWidth: 4,
          opacity: 0.15,
          originX: "center",
          originY: "center",
        }),
        new Circle({
          left: centerX,
          top: centerY,
          radius: 40,
          fill: INK,
          originX: "center",
          originY: "center",
        }),
      ]

      for (let k = 0; k < 3; k++) {
        const angle = 2 * Math.PI * (t + k / 3)
        objects.push(
          new Circle({
            left: centerX + Math.cos(angle) * orbit,
            top: centerY + Math.sin(angle) * orbit,
            radius: 30,
            fill: ACCENT,
            originX: "center",
            originY: "center",
          })
        )
      }

      return objects
    },
  },
  {
    id: "morph",
    title: "Square to circle",
    description: "Corners rounding off as the shape spins.",
    fps: 24,
    frameCount: 16,
    stagePresetId: "square",
    frame: ({ t, width, height, fabric }) => {
      const { Rect } = fabric
      const size = Math.min(width, height) * 0.42
      // Corners round fully at the halfway point, then square back up.
      const roundness = (size / 2) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t))

      return [
        new Rect({
          left: width / 2,
          top: height / 2,
          width: size,
          height: size,
          rx: roundness,
          ry: roundness,
          angle: 360 * t,
          fill: ACCENT,
          originX: "center",
          originY: "center",
        }),
      ]
    },
  },
]

export function getDemo(id: string): DemoSpec | undefined {
  return DEMOS.find((demo) => demo.id === id)
}

/**
 * Renders a demo into real editor frames.
 *
 * Objects are authored with Fabric and serialized with toJSON(), so every
 * demo is a genuine editable project rather than a canned video.
 * Browser-only: Fabric needs a DOM.
 */
export async function buildDemoFrames(
  spec: DemoSpec,
  snapshotWidth: number = SNAPSHOT_SIZE
): Promise<Frame[]> {
  const fabric = await import("fabric")
  const { width, height } = getStagePreset(spec.stagePresetId)
  const stage = new fabric.StaticCanvas(undefined, { width, height })
  const frames: Frame[] = []

  try {
    for (let i = 0; i < spec.frameCount; i++) {
      stage.clear()
      const objects = spec.frame({
        i,
        count: spec.frameCount,
        t: i / spec.frameCount,
        width,
        height,
        fabric,
      })
      objects.forEach((object) => stage.add(object))
      stage.renderAll()

      frames.push({
        id: crypto.randomUUID(),
        json: stage.toJSON() as FrameJSON,
        dataUrl: stage.toDataURL({
          format: "png",
          multiplier: snapshotWidth / width,
        }),
      })
    }
  } finally {
    stage.dispose()
  }

  return frames
}
