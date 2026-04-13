interface PathData {
  path: string
  color?: string
  width?: number
}

const CANVAS_SIZE = 1000
const DEFAULT_STROKE_COLOR = '#c8a832'
const DEFAULT_STROKE_WIDTH = 3

/**
 * Rasterize drawing JSON (SVG path data) to a base64 PNG string.
 * Handles both string[] and PathData[] formats.
 */
export function rasterizeDrawing(drawingJson: string, strokeColor?: string): string | null {
  try {
    const parsed = JSON.parse(drawingJson)
    if (!Array.isArray(parsed) || parsed.length === 0) return null

    const paths: PathData[] = parsed.map((p: string | PathData) =>
      typeof p === 'string' ? { path: p } : p,
    )

    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // White background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    for (const p of paths) {
      ctx.strokeStyle = p.color || strokeColor || DEFAULT_STROKE_COLOR
      ctx.lineWidth = p.width || DEFAULT_STROKE_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const path2d = new Path2D(p.path)
      ctx.stroke(path2d)
    }

    // Return base64 PNG data (without the data:image/png;base64, prefix)
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl.split(',')[1] || null
  } catch {
    return null
  }
}
