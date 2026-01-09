'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import type { RadialGradientData, LinearGradientData } from '@/types/edit-state'

interface GradientHandlesProps {
  imageDisplay: { x: number; y: number; width: number; height: number }
  containerRef: React.RefObject<HTMLDivElement>
}

export function RadialGradientHandles({ imageDisplay, containerRef }: GradientHandlesProps) {
  const activeMaskId = useEditorStore((state) => state.editState.activeMaskId)
  const masks = useEditorStore((state) => state.editState.masks)
  const updateMask = useEditorStore((state) => state.updateMask)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const [dragging, setDragging] = useState<'center' | 'inner' | 'outer' | null>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startDataRef = useRef<RadialGradientData | null>(null)

  const activeMask = masks.find(m => m.id === activeMaskId)
  const gradientData = activeMask?.gradientData as RadialGradientData | undefined

  if (!activeMask || activeMask.type !== 'radialGradient' || !gradientData) {
    return null
  }

  // Convert normalized coordinates to screen coordinates
  const centerX = imageDisplay.x + gradientData.centerX * imageDisplay.width
  const centerY = imageDisplay.y + gradientData.centerY * imageDisplay.height
  const maxDim = Math.max(imageDisplay.width, imageDisplay.height)
  const innerRadius = gradientData.innerRadius * maxDim
  const outerRadius = gradientData.outerRadius * maxDim

  const handleMouseDown = (e: React.MouseEvent, handle: 'center' | 'inner' | 'outer') => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(handle)
    startPosRef.current = { x: e.clientX, y: e.clientY }
    startDataRef.current = { ...gradientData }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !containerRef.current || !startDataRef.current || !activeMaskId) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (dragging === 'center') {
      const newCenterX = (x - imageDisplay.x) / imageDisplay.width
      const newCenterY = (y - imageDisplay.y) / imageDisplay.height
      updateMask(activeMaskId, {
        gradientData: {
          ...startDataRef.current,
          centerX: Math.max(0, Math.min(1, newCenterX)),
          centerY: Math.max(0, Math.min(1, newCenterY)),
        },
      })
    } else {
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy) / maxDim

      if (dragging === 'inner') {
        updateMask(activeMaskId, {
          gradientData: {
            ...gradientData,
            innerRadius: Math.max(0, Math.min(distance, gradientData.outerRadius - 0.02)),
          },
        })
      } else if (dragging === 'outer') {
        updateMask(activeMaskId, {
          gradientData: {
            ...gradientData,
            outerRadius: Math.max(gradientData.innerRadius + 0.02, distance),
          },
        })
      }
    }
  }, [dragging, containerRef, imageDisplay, activeMaskId, updateMask, gradientData, centerX, centerY, maxDim])

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      pushHistory('Adjust radial gradient')
    }
    setDragging(null)
  }, [dragging, pushHistory])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Inner radius circle */}
      <div
        className="absolute rounded-full border-2 border-dashed border-white/60"
        style={{
          left: centerX - innerRadius,
          top: centerY - innerRadius,
          width: innerRadius * 2,
          height: innerRadius * 2,
        }}
      />
      {/* Outer radius circle */}
      <div
        className="absolute rounded-full border-2 border-white/60"
        style={{
          left: centerX - outerRadius,
          top: centerY - outerRadius,
          width: outerRadius * 2,
          height: outerRadius * 2,
        }}
      />

      {/* Center handle */}
      <div
        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-maroon shadow-lg cursor-move pointer-events-auto"
        style={{ left: centerX, top: centerY }}
        onMouseDown={(e) => handleMouseDown(e, 'center')}
      />

      {/* Inner radius handle */}
      <div
        className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 border-2 border-white shadow cursor-ew-resize pointer-events-auto"
        style={{ left: centerX + innerRadius, top: centerY }}
        onMouseDown={(e) => handleMouseDown(e, 'inner')}
      />

      {/* Outer radius handle */}
      <div
        className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-white shadow cursor-ew-resize pointer-events-auto"
        style={{ left: centerX + outerRadius, top: centerY }}
        onMouseDown={(e) => handleMouseDown(e, 'outer')}
      />
    </div>
  )
}

export function LinearGradientHandles({ imageDisplay, containerRef }: GradientHandlesProps) {
  const activeMaskId = useEditorStore((state) => state.editState.activeMaskId)
  const masks = useEditorStore((state) => state.editState.masks)
  const updateMask = useEditorStore((state) => state.updateMask)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const [dragging, setDragging] = useState<'start' | 'end' | 'line' | null>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startDataRef = useRef<LinearGradientData | null>(null)

  const activeMask = masks.find(m => m.id === activeMaskId)
  const gradientData = activeMask?.gradientData as LinearGradientData | undefined

  if (!activeMask || activeMask.type !== 'linearGradient' || !gradientData) {
    return null
  }

  // Convert normalized coordinates to screen coordinates
  const startX = imageDisplay.x + gradientData.startX * imageDisplay.width
  const startY = imageDisplay.y + gradientData.startY * imageDisplay.height
  const endX = imageDisplay.x + gradientData.endX * imageDisplay.width
  const endY = imageDisplay.y + gradientData.endY * imageDisplay.height

  const handleMouseDown = (e: React.MouseEvent, handle: 'start' | 'end' | 'line') => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(handle)
    startPosRef.current = { x: e.clientX, y: e.clientY }
    startDataRef.current = { ...gradientData }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !containerRef.current || !startDataRef.current || !activeMaskId) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newX = (x - imageDisplay.x) / imageDisplay.width
    const newY = (y - imageDisplay.y) / imageDisplay.height

    if (dragging === 'start') {
      updateMask(activeMaskId, {
        gradientData: {
          ...gradientData,
          startX: Math.max(0, Math.min(1, newX)),
          startY: Math.max(0, Math.min(1, newY)),
        },
      })
    } else if (dragging === 'end') {
      updateMask(activeMaskId, {
        gradientData: {
          ...gradientData,
          endX: Math.max(0, Math.min(1, newX)),
          endY: Math.max(0, Math.min(1, newY)),
        },
      })
    } else if (dragging === 'line') {
      const dx = (e.clientX - startPosRef.current.x) / imageDisplay.width
      const dy = (e.clientY - startPosRef.current.y) / imageDisplay.height

      updateMask(activeMaskId, {
        gradientData: {
          ...gradientData,
          startX: Math.max(0, Math.min(1, startDataRef.current.startX + dx)),
          startY: Math.max(0, Math.min(1, startDataRef.current.startY + dy)),
          endX: Math.max(0, Math.min(1, startDataRef.current.endX + dx)),
          endY: Math.max(0, Math.min(1, startDataRef.current.endY + dy)),
        },
      })
    }
  }, [dragging, containerRef, imageDisplay, activeMaskId, updateMask, gradientData])

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      pushHistory('Adjust linear gradient')
    }
    setDragging(null)
  }, [dragging, pushHistory])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Gradient line */}
      <svg className="absolute inset-0 overflow-visible">
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="white"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="pointer-events-auto cursor-move"
          onMouseDown={(e) => handleMouseDown(e as unknown as React.MouseEvent, 'line')}
        />
      </svg>

      {/* Start handle */}
      <div
        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-maroon shadow-lg cursor-move pointer-events-auto flex items-center justify-center"
        style={{ left: startX, top: startY }}
        onMouseDown={(e) => handleMouseDown(e, 'start')}
      >
        <span className="text-[8px] font-bold text-maroon">S</span>
      </div>

      {/* End handle */}
      <div
        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-maroon shadow-lg cursor-move pointer-events-auto flex items-center justify-center"
        style={{ left: endX, top: endY }}
        onMouseDown={(e) => handleMouseDown(e, 'end')}
      >
        <span className="text-[8px] font-bold text-maroon">E</span>
      </div>
    </div>
  )
}
