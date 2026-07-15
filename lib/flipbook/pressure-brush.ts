import { BaseBrush, Path, type Canvas, type Point, type TPointerEvent } from "fabric"
import { getStroke, type StrokeOptions, type Vec2 } from "perfect-freehand"

/** A sampled point, in the shape perfect-freehand wants: [x, y, pressure]. */
type InputPoint = [number, number, number]

/** Pressure to fall back on when the device does not report any. */
const FLAT_PRESSURE = 0.5

/**
 * Only a pen reports pressure worth trusting. Mice report 0.5 while a button
 * is held, and touchscreens commonly report 0 or a flat 1, so for those we let
 * perfect-freehand infer pressure from velocity instead.
 */
function readsPressure(e: TPointerEvent) {
  return (e as PointerEvent).pointerType === "pen"
}

function pressureOf(e: TPointerEvent) {
  const pressure = (e as PointerEvent).pressure
  return readsPressure(e) && pressure > 0 ? pressure : FLAT_PRESSURE
}

const avg = (a: number, b: number) => (a + b) / 2

/**
 * perfect-freehand returns the outline of the stroke as a polygon. Joining the
 * vertices with quadratic curves through their midpoints keeps the silhouette
 * smooth instead of faceted.
 */
function outlineToPathData(points: Vec2[]): string {
  const len = points.length
  if (len < 4) return ""

  let a = points[0]
  let b = points[1]
  const c = points[2]

  let d =
    `M${a[0].toFixed(2)},${a[1].toFixed(2)} ` +
    `Q${b[0].toFixed(2)},${b[1].toFixed(2)} ` +
    `${avg(b[0], c[0]).toFixed(2)},${avg(b[1], c[1]).toFixed(2)} T`

  for (let i = 2; i < len - 1; i++) {
    a = points[i]
    b = points[i + 1]
    d += `${avg(a[0], b[0]).toFixed(2)},${avg(a[1], b[1]).toFixed(2)} `
  }

  return `${d}Z`
}

/**
 * A brush whose width varies along the stroke.
 *
 * Fabric's PencilBrush emits a Path with a single strokeWidth, so it cannot
 * express pressure at all. This instead samples pressure per point, asks
 * perfect-freehand for the outline of the resulting variable-width stroke, and
 * commits that outline as a *filled* Path with no stroke. Smoothing comes from
 * the same pass, which is why there is no separate smoothing step.
 *
 * The emitted `path:created` event matches PencilBrush's, so the canvas wiring
 * and per-frame history do not know the difference. Paths from the old brush
 * keep rendering as they always did.
 */
export class PressureBrush extends BaseBrush {
  /** How strongly pressure narrows the stroke. 0 gives a uniform width. */
  thinning = 0.5

  /** How much to soften the outline's corners. */
  smoothing = 0.5

  /** How much to pull the stroke toward the pointer path. Higher is smoother. */
  streamline = 0.5

  private points: InputPoint[] = []

  /** Set per stroke: infer pressure from velocity when the device has none. */
  private simulate = true

  constructor(canvas: Canvas) {
    super(canvas)
  }

  private options(last: boolean): StrokeOptions {
    return {
      size: this.width,
      thinning: this.thinning,
      smoothing: this.smoothing,
      streamline: this.streamline,
      simulatePressure: this.simulate,
      last,
    }
  }

  private pathData(last: boolean) {
    return outlineToPathData(getStroke(this.points, this.options(last)))
  }

  onMouseDown(pointer: Point, { e }: { e: TPointerEvent }) {
    if (!this.canvas._isMainEvent(e)) return
    this.simulate = !readsPressure(e)
    // Captured immediately so that a tap with no movement still marks a dot.
    this.points = [[pointer.x, pointer.y, pressureOf(e)]]
    this._render()
  }

  onMouseMove(pointer: Point, { e }: { e: TPointerEvent }) {
    if (!this.canvas._isMainEvent(e)) return
    this.points.push([pointer.x, pointer.y, pressureOf(e)])
    this._render()
  }

  onMouseUp({ e }: { e: TPointerEvent }) {
    if (!this.canvas._isMainEvent(e)) return true
    this._finalizeAndAddPath()
    return false
  }

  /**
   * The whole outline is rebuilt on every move: a pressure stroke's silhouette
   * is not append-only the way a fixed-width line is, since a late point can
   * still reshape the tail.
   */
  _render(ctx: CanvasRenderingContext2D = this.canvas.contextTop) {
    const data = this.pathData(false)
    this.canvas.clearContext(ctx)
    if (!data) return
    this._saveAndTransform(ctx)
    this._setShadow()
    ctx.fillStyle = this.color
    ctx.fill(new Path2D(data))
    ctx.restore()
  }

  private _finalizeAndAddPath() {
    const data = this.pathData(true)
    this.canvas.clearContext(this.canvas.contextTop)
    this.points = []

    if (!data) {
      this.canvas.requestRenderAll()
      return
    }

    const path = new Path(data, {
      fill: this.color,
      stroke: null,
      strokeWidth: 0,
    })

    this.canvas.fire("before:path:created", { path })
    this.canvas.add(path)
    this.canvas.requestRenderAll()
    path.setCoords()
    this._resetShadow()
    this.canvas.fire("path:created", { path })
  }
}
