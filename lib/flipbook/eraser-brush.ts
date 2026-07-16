import { PencilBrush, type Canvas, type TSimplePathData } from "fabric"

export class EraserBrush extends PencilBrush {
  private isDrawingOnMain = false

  constructor(canvas: Canvas) {
    super(canvas)
    // Make the brush itself transparent so nothing renders on the top canvas
    this.color = "rgba(0,0,0,0)"
  }

  // 1. When drawing starts, prepare to paint directly onto the main canvas context
  public onMouseDown(pointer: any, options: any) {
    super.onMouseDown(pointer, options)
    this.isDrawingOnMain = true
  }

 // 2. Intercept active movement to draw directly on the main canvas with destination-out
  public onMouseMove(pointer: any, options: any) {
    if (!this.isDrawingOnMain) return
    super.onMouseMove(pointer, options)

    const ctx = this.canvas.getContext() // Gets the actual main canvas context
    const points = this._points

    if (points.length > 1) {
      ctx.save()
      
      // --- ALIGN COORDINATES TO MATCH ZOOM, PAN, AND RETINA SCALING ---
      const vpt = this.canvas.viewportTransform
      const dpr = this.canvas.enableRetinaScaling ? (window.devicePixelRatio || 1) : 1
      
      // Reset the context's matrix to match Retina scaling, then apply Zoom/Pan transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5])
      // ----------------------------------------------------------------

      // Configure eraser physics directly on the aligned rendering context
      ctx.globalCompositeOperation = "destination-out"
      ctx.strokeStyle = "#000000" // Opaque color is required to subtract alpha
      ctx.lineWidth = this.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      // Draw the brush stroke segment from the last point to the new point
      ctx.beginPath()
      const p1 = points[points.length - 2]
      const p2 = points[points.length - 1]
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()

      ctx.restore()
    }
  }

  public onMouseUp(options: any) {
    this.isDrawingOnMain = false
    return super.onMouseUp(options)
  }

  // 3. Keep createPath identical so the final path object commits as a permanent mask
  public createPath(pathData: TSimplePathData) {
    const path = super.createPath(pathData)
    path.set({
      globalCompositeOperation: "destination-out",
      stroke: "#000000",
      fill: null,
      selectable: false,
      evented: false,
      perPixelTargetFind: false,
    })
    return path
  }
}