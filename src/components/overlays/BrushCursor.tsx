'use client'

import { useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'

interface BrushCursorProps {
  containerRef: React.RefObject<HTMLDivElement>
  imageDisplay: { x: number; y: number; width: number; height: number } | null
  imageWidth: number
  imageHeight: number
}

export function BrushCursor({ containerRef, imageDisplay, imageWidth, imageHeight }: BrushCursorProps) {
  const activeTool = useEditorStore((state) => state.activeTool)
  const brushSettings = useEditorStore((state) => state.brushSettings)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isInside, setIsInside] = useState(false)

  // Calculate display size of brush based on zoom
  const displayBrushSize = imageDisplay
    ? (brushSettings.size / imageWidth) * imageDisplay.width
    : brushSettings.size

  useEffect(() => {
    const container = containerRef.current
    if (!container || activeTool !== 'brush') return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }

    const handleMouseEnter = () => setIsInside(true)
    const handleMouseLeave = () => setIsInside(false)

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [containerRef, activeTool])

  if (activeTool !== 'brush' || !mousePos || !isInside) {
    return null
  }

  const innerSize = displayBrushSize * (brushSettings.hardness / 100)

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: mousePos.x - displayBrushSize / 2,
        top: mousePos.y - displayBrushSize / 2,
        width: displayBrushSize,
        height: displayBrushSize,
      }}
    >
      {/* Outer circle (full brush size) */}
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: brushSettings.mode === 'add' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 100, 100, 0.8)',
          borderWidth: 1.5,
        }}
      />
      {/* Inner circle (hardness) */}
      {brushSettings.hardness < 100 && (
        <div
          className="absolute rounded-full border border-dashed"
          style={{
            left: '50%',
            top: '50%',
            width: innerSize,
            height: innerSize,
            transform: 'translate(-50%, -50%)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            borderWidth: 1,
          }}
        />
      )}
      {/* Center dot */}
      <div
        className="absolute rounded-full bg-white"
        style={{
          left: '50%',
          top: '50%',
          width: 3,
          height: 3,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}
