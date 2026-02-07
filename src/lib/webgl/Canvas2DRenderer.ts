import type { EditState } from '@/types/edit-state'

/**
 * Canvas 2D fallback renderer for environments without WebGL2 support.
 * Renders the original image with basic brightness/contrast adjustments via CSS filters.
 * Advanced effects (tone curves, HSL, color grading, grain, vignette) are not supported.
 */
export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement | OffscreenCanvas
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  private image: ImageBitmap | HTMLImageElement | HTMLCanvasElement | null = null

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D not supported')
    }
    this.ctx = ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  }

  setImage(image: ImageBitmap | HTMLImageElement | HTMLCanvasElement): void {
    this.image = image
  }

  render(editState: EditState): void {
    if (!this.image) return
    const ctx = this.ctx
    const { width, height } = this.canvas

    ctx.clearRect(0, 0, width, height)

    // Apply basic adjustments via CSS filter string
    const { basic } = editState
    const brightness = Math.pow(2, basic.exposure) // exposure in stops
    const contrast = 1 + basic.contrast / 100
    const saturate = 1 + basic.saturation / 100

    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`
    ctx.drawImage(this.image, 0, 0, width, height)
    ctx.filter = 'none'
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
  }

  dispose(): void {
    this.image = null
  }
}
