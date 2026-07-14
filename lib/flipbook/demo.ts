import { getStagePreset, SNAPSHOT_SIZE, type Frame, type FrameJSON } from "./store"

export const DEMO_TITLE = "Bouncing ball"
export const DEMO_STAGE_PRESET = "square"
export const DEMO_FPS = 12
export const DEMO_FRAME_COUNT = 12

const BALL_COLOR = "#0ea5e9"
const INK = "#1a1a1a"

/**
 * Builds the showcase animation: a ball bouncing in place with squash and
 * stretch, the classic flipbook exercise.
 *
 * Frames are authored with real Fabric objects and serialized with toJSON(),
 * so the result is a genuine, editable project rather than a canned video.
 * Browser-only: Fabric needs a DOM.
 */
export async function buildDemoFrames(): Promise<Frame[]> {
  const { StaticCanvas, Circle, Ellipse, Rect } = await import("fabric")
  const { width, height } = getStagePreset(DEMO_STAGE_PRESET)

  const radius = 105
  const groundY = Math.round(height * 0.78)
  const amplitude = Math.round(height * 0.46)
  const centerX = width / 2

  const stage = new StaticCanvas(undefined, { width, height })
  const frames: Frame[] = []

  try {
    for (let i = 0; i < DEMO_FRAME_COUNT; i++) {
      const t = i / DEMO_FRAME_COUNT
      // Height traces one full bounce, so frame 11 loops back into frame 0.
      const lift = Math.abs(Math.sin(Math.PI * t))
      const speed = Math.abs(Math.cos(Math.PI * t))
      const airborneHeight = amplitude * lift

      // Squash on contact, stretch when moving fast, round at the apex.
      const touching = airborneHeight < radius * 0.4
      const scaleX = touching ? 1.32 : 1 - 0.16 * speed
      const scaleY = touching ? 0.68 : 1 + 0.28 * speed

      stage.clear()

      stage.add(
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
        })
      )

      // The shadow tightens and darkens as the ball nears the ground.
      stage.add(
        new Ellipse({
          left: centerX,
          top: groundY,
          rx: radius * (0.95 - 0.4 * lift),
          ry: radius * (0.22 - 0.08 * lift),
          fill: INK,
          opacity: 0.18 * (1 - 0.55 * lift),
          originX: "center",
          originY: "center",
        })
      )

      stage.add(
        new Circle({
          left: centerX,
          // Rest the ball's underside on the ground line when it lands.
          top: groundY - airborneHeight - radius * scaleY,
          radius,
          scaleX,
          scaleY,
          fill: BALL_COLOR,
          originX: "center",
          originY: "center",
        })
      )

      stage.renderAll()

      frames.push({
        id: crypto.randomUUID(),
        json: stage.toJSON() as FrameJSON,
        dataUrl: stage.toDataURL({
          format: "png",
          multiplier: SNAPSHOT_SIZE / width,
        }),
      })
    }
  } finally {
    stage.dispose()
  }

  return frames
}
