import type { BrushSettings } from '@/types/edit-state'

export class BrushEngine {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  private lastPoint: { x: number; y: number } | null = null
  private isDrawing = false

  constructor(width: number, height: number) {
    this.canvas = new OffscreenCanvas(width, height)
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    // Initialize with transparent black (no mask)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    this.ctx.fillRect(0, 0, width, height)
  }

  startStroke(x: number, y: number, settings: BrushSettings): void {
    this.isDrawing = true
    this.lastPoint = { x, y }
    this.paint(x, y, settings)
  }

  continueStroke(x: number, y: number, settings: BrushSettings): void {
    if (!this.isDrawing || !this.lastPoint) return

    // Calculate distance and interpolate for smooth strokes
    const dx = x - this.lastPoint.x
    const dy = y - this.lastPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Paint points along the line for smooth strokes
    const spacing = Math.max(1, settings.size * 0.1)
    const steps = Math.ceil(distance / spacing)

    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const px = this.lastPoint.x + dx * t
      const py = this.lastPoint.y + dy * t
      this.paint(px, py, settings)
    }

    this.lastPoint = { x, y }
  }

  endStroke(): void {
    this.isDrawing = false
    this.lastPoint = null
  }

  private paint(x: number, y: number, settings: BrushSettings): void {
    const { size, hardness, flow, mode } = settings
    const radius = size / 2

    // Create radial gradient for soft brush
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius)

    // Calculate alpha based on flow (1-100 -> 0.01-1.0)
    const alpha = flow / 100

    if (hardness >= 100) {
      // Hard brush - solid circle
      gradient.addColorStop(0, mode === 'add' ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`)
      gradient.addColorStop(1, mode === 'add' ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`)
    } else {
      // Soft brush - gradient falloff
      const hardnessRatio = hardness / 100
      const innerRadius = hardnessRatio

      if (mode === 'add') {
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
        gradient.addColorStop(innerRadius, `rgba(255, 255, 255, ${alpha})`)
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
      } else {
        // For subtract mode, we paint with black (which represents no mask)
        gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`)
        gradient.addColorStop(innerRadius, `rgba(0, 0, 0, ${alpha})`)
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`)
      }
    }

    this.ctx.globalCompositeOperation = mode === 'add' ? 'lighter' : 'destination-out'
    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over'
  }

  getMaskCanvas(): OffscreenCanvas {
    return this.canvas
  }

  getMaskData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
  }

  setMaskData(imageData: ImageData): void {
    this.ctx.putImageData(imageData, 0, 0)
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  resize(width: number, height: number): void {
    // Create new canvas and copy old data
    const oldCanvas = this.canvas
    const oldData = this.ctx.getImageData(0, 0, oldCanvas.width, oldCanvas.height)

    this.canvas = new OffscreenCanvas(width, height)
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    // Scale old mask to new size
    const tempCanvas = new OffscreenCanvas(oldCanvas.width, oldCanvas.height)
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(oldData, 0, 0)

    this.ctx.drawImage(tempCanvas, 0, 0, width, height)
  }
}
