import type { RadialGradientData, LinearGradientData } from '@/types/edit-state'

export function generateRadialGradientMask(
  width: number,
  height: number,
  data: RadialGradientData
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!

  const centerX = data.centerX * width
  const centerY = data.centerY * height
  const maxDim = Math.max(width, height)
  const innerRadius = data.innerRadius * maxDim
  const outerRadius = data.outerRadius * maxDim

  // Create radial gradient
  const gradient = ctx.createRadialGradient(
    centerX, centerY, innerRadius,
    centerX, centerY, outerRadius
  )

  if (data.inverted) {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)')
  } else {
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  }

  ctx.save()

  // Apply rotation and aspect ratio if needed
  if (data.rotation !== 0 || data.aspectRatio !== 1) {
    ctx.translate(centerX, centerY)
    ctx.rotate((data.rotation * Math.PI) / 180)
    ctx.scale(1, 1 / data.aspectRatio)
    ctx.translate(-centerX, -centerY)
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  return canvas
}

export function generateLinearGradientMask(
  width: number,
  height: number,
  data: LinearGradientData
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!

  const startX = data.startX * width
  const startY = data.startY * height
  const endX = data.endX * width
  const endY = data.endY * height

  // Calculate perpendicular gradient direction
  const dx = endX - startX
  const dy = endY - startY
  const length = Math.sqrt(dx * dx + dy * dy)

  // Create linear gradient
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY)

  // Feather amount controls the transition width
  const featherStart = Math.max(0, 0.5 - data.feather / 2)
  const featherEnd = Math.min(1, 0.5 + data.feather / 2)

  if (data.inverted) {
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(featherStart, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(featherEnd, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  } else {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(featherStart, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(featherEnd, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 1)')
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas
}
