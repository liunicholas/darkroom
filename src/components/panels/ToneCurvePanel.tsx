'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import type { CurvePoint, ToneCurveState } from '@/types/edit-state'

type Channel = keyof ToneCurveState

const CHANNEL_COLORS: Record<Channel, string> = {
  rgb: '#ffffff',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
}

export function ToneCurvePanel() {
  const [activeChannel, setActiveChannel] = useState<Channel>('rgb')
  const toneCurve = useEditorStore((state) => state.editState.toneCurve)
  const setToneCurvePoints = useEditorStore((state) => state.setToneCurvePoints)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const points = toneCurve[activeChannel]

  const handlePointsChange = useCallback((newPoints: CurvePoint[]) => {
    setToneCurvePoints(activeChannel, newPoints)
  }, [activeChannel, setToneCurvePoints])

  const handleChangeEnd = useCallback(() => {
    pushHistory('Adjust tone curve')
  }, [pushHistory])

  return (
    <div className="space-y-3">
      {/* Channel tabs */}
      <div className="flex gap-1">
        {(['rgb', 'red', 'green', 'blue'] as Channel[]).map((channel) => (
          <button
            key={channel}
            onClick={() => setActiveChannel(channel)}
            className={`
              px-2 py-1 text-xs font-medium rounded transition-colors
              ${activeChannel === channel
                ? 'bg-dark-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }
            `}
            style={{
              color: activeChannel === channel ? CHANNEL_COLORS[channel] : undefined,
            }}
          >
            {channel.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Curve editor */}
      <CurveEditor
        points={points}
        onChange={handlePointsChange}
        onChangeEnd={handleChangeEnd}
        color={CHANNEL_COLORS[activeChannel]}
      />

      {/* Reset button */}
      <button
        onClick={() => {
          setToneCurvePoints(activeChannel, [{ x: 0, y: 0 }, { x: 1, y: 1 }])
          pushHistory('Reset tone curve')
        }}
        className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
      >
        Reset {activeChannel.toUpperCase()} Curve
      </button>
    </div>
  )
}

interface CurveEditorProps {
  points: CurvePoint[]
  onChange: (points: CurvePoint[]) => void
  onChangeEnd?: () => void
  color: string
}

function CurveEditor({ points, onChange, onChangeEnd, color }: CurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const size = 200

  // Draw curve
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, size, size)

    // Draw grid
    ctx.strokeStyle = '#2d2d2d'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const pos = (size * i) / 4
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, size)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(size, pos)
      ctx.stroke()
    }

    // Draw diagonal reference
    ctx.strokeStyle = '#3a3a3a'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(0, size)
    ctx.lineTo(size, 0)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw curve
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    // Simple linear interpolation for now
    const sortedPoints = [...points].sort((a, b) => a.x - b.x)

    for (let i = 0; i <= size; i++) {
      const x = i / size
      const y = interpolateCurve(sortedPoints, x)
      const canvasY = size - y * size

      if (i === 0) {
        ctx.moveTo(i, canvasY)
      } else {
        ctx.lineTo(i, canvasY)
      }
    }
    ctx.stroke()

    // Draw control points
    sortedPoints.forEach((point, i) => {
      const px = point.x * size
      const py = size - point.y * size

      ctx.beginPath()
      ctx.arc(px, py, 6, 0, Math.PI * 2)
      ctx.fillStyle = draggingIndex === i ? color : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [points, color, draggingIndex, size])

  // Handle mouse interactions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / size
    const y = 1 - (e.clientY - rect.top) / size

    // Check if clicking on existing point
    const sortedPoints = [...points].sort((a, b) => a.x - b.x)
    const clickedIndex = sortedPoints.findIndex((p) => {
      const dx = p.x - x
      const dy = p.y - y
      return Math.sqrt(dx * dx + dy * dy) < 0.05
    })

    if (clickedIndex >= 0) {
      setDraggingIndex(clickedIndex)
    } else {
      // Add new point
      const newPoints = [...points, { x, y }].sort((a, b) => a.x - b.x)
      onChange(newPoints)
      setDraggingIndex(newPoints.findIndex((p) => p.x === x && p.y === y))
    }
  }, [points, onChange, size])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingIndex === null) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / size))
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / size))

    const newPoints = [...points]
    // Don't allow moving first/last points horizontally
    if (draggingIndex === 0) {
      newPoints[draggingIndex] = { x: 0, y }
    } else if (draggingIndex === points.length - 1) {
      newPoints[draggingIndex] = { x: 1, y }
    } else {
      newPoints[draggingIndex] = { x, y }
    }

    onChange(newPoints.sort((a, b) => a.x - b.x))
  }, [draggingIndex, points, onChange, size])

  const handleMouseUp = useCallback(() => {
    if (draggingIndex !== null) {
      setDraggingIndex(null)
      onChangeEnd?.()
    }
  }, [draggingIndex, onChangeEnd])

  // Handle double-click to remove point
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / size
    const y = 1 - (e.clientY - rect.top) / size

    const clickedIndex = points.findIndex((p) => {
      const dx = p.x - x
      const dy = p.y - y
      return Math.sqrt(dx * dx + dy * dy) < 0.05
    })

    // Don't remove first or last point
    if (clickedIndex > 0 && clickedIndex < points.length - 1) {
      const newPoints = points.filter((_, i) => i !== clickedIndex)
      onChange(newPoints)
      onChangeEnd?.()
    }
  }, [points, onChange, onChangeEnd, size])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full aspect-square rounded-md border border-dark-400 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      <div className="absolute bottom-1 left-1 text-[10px] text-gray-500">Shadows</div>
      <div className="absolute bottom-1 right-1 text-[10px] text-gray-500">Highlights</div>
    </div>
  )
}

// Simple linear interpolation
function interpolateCurve(points: CurvePoint[], x: number): number {
  if (points.length === 0) return x
  if (points.length === 1) return points[0].y

  // Find surrounding points
  let i = 0
  while (i < points.length - 1 && points[i + 1].x < x) {
    i++
  }

  if (i >= points.length - 1) return points[points.length - 1].y

  const p1 = points[i]
  const p2 = points[i + 1]

  // Linear interpolation
  const t = (x - p1.x) / (p2.x - p1.x)
  return p1.y + t * (p2.y - p1.y)
}
