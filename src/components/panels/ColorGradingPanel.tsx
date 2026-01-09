'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Slider } from '@/components/controls/Slider'
import type { ColorWheelValue } from '@/types/edit-state'

type WheelType = 'shadows' | 'midtones' | 'highlights' | 'global'

export function ColorGradingPanel() {
  const colorGrading = useEditorStore((state) => state.editState.colorGrading)
  const setColorGradingWheel = useEditorStore((state) => state.setColorGradingWheel)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const handleWheelChange = useCallback((wheel: WheelType, value: Partial<ColorWheelValue>) => {
    setColorGradingWheel(wheel, value)
  }, [setColorGradingWheel])

  const handleChangeEnd = useCallback(() => {
    pushHistory('Adjust color grading')
  }, [pushHistory])

  return (
    <div className="space-y-4">
      {/* Color wheels grid */}
      <div className="grid grid-cols-2 gap-4">
        <ColorWheel
          label="Shadows"
          value={colorGrading.shadows}
          onChange={(v) => handleWheelChange('shadows', v)}
          onChangeEnd={handleChangeEnd}
        />
        <ColorWheel
          label="Midtones"
          value={colorGrading.midtones}
          onChange={(v) => handleWheelChange('midtones', v)}
          onChangeEnd={handleChangeEnd}
        />
        <ColorWheel
          label="Highlights"
          value={colorGrading.highlights}
          onChange={(v) => handleWheelChange('highlights', v)}
          onChangeEnd={handleChangeEnd}
        />
        <ColorWheel
          label="Global"
          value={colorGrading.global}
          onChange={(v) => handleWheelChange('global', v)}
          onChangeEnd={handleChangeEnd}
        />
      </div>

      {/* Blending and Balance sliders */}
      <div className="pt-3 border-t border-dark-400 space-y-3">
        <Slider
          label="Blending"
          value={colorGrading.blending}
          min={0}
          max={100}
          defaultValue={50}
          onChange={(v) => setColorGradingWheel('blending', v as any)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Balance"
          value={colorGrading.balance}
          min={-100}
          max={100}
          onChange={(v) => setColorGradingWheel('balance', v as any)}
          onChangeEnd={handleChangeEnd}
        />
      </div>
    </div>
  )
}

interface ColorWheelProps {
  label: string
  value: ColorWheelValue
  onChange: (value: Partial<ColorWheelValue>) => void
  onChangeEnd?: () => void
}

function ColorWheel({ label, value, onChange, onChangeEnd }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const size = 100

  // Draw color wheel
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 4

    // Clear
    ctx.clearRect(0, 0, size, size)

    // Draw hue wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = ((angle - 2) * Math.PI) / 180
      const endAngle = ((angle + 2) * Math.PI) / 180

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, '#2d2d2d')
      gradient.addColorStop(0.5, `hsl(${angle}, 50%, 50%)`)
      gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`)
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // Draw indicator
    const indicatorAngle = (value.hue * Math.PI) / 180
    const indicatorRadius = (value.saturation / 100) * (radius - 8)
    const indicatorX = centerX + Math.cos(indicatorAngle) * indicatorRadius
    const indicatorY = centerY + Math.sin(indicatorAngle) * indicatorRadius

    // Outer ring
    ctx.beginPath()
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Inner dot
    ctx.beginPath()
    ctx.arc(indicatorX, indicatorY, 4, 0, Math.PI * 2)
    ctx.fillStyle = `hsl(${value.hue}, ${value.saturation}%, 50%)`
    ctx.fill()
  }, [value, size])

  // Handle mouse interactions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    updateFromMouse(e)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      updateFromMouse(e)
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      onChangeEnd?.()
    }
  }, [isDragging, onChangeEnd])

  const updateFromMouse = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = size / 2
    const centerY = size / 2
    const x = e.clientX - rect.left - centerX
    const y = e.clientY - rect.top - centerY

    const angle = Math.atan2(y, x)
    const hue = ((angle * 180) / Math.PI + 360) % 360
    const distance = Math.sqrt(x * x + y * y)
    const maxRadius = size / 2 - 12
    const saturation = Math.min(100, (distance / maxRadius) * 100)

    onChange({ hue, saturation })
  }, [onChange, size])

  // Double-click to reset
  const handleDoubleClick = useCallback(() => {
    onChange({ hue: 0, saturation: 0 })
    onChangeEnd?.()
  }, [onChange, onChangeEnd])

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      <span className="mt-2 text-xs text-gray-400">{label}</span>
    </div>
  )
}
