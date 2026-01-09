'use client'

import { useCallback, useState, useRef } from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  defaultValue?: number
  onChange: (value: number) => void
  onChangeEnd?: () => void
  formatValue?: (value: number) => string
  showZeroMark?: boolean
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  onChange,
  onChangeEnd,
  formatValue = (v) => v.toFixed(step < 1 ? 2 : 0),
  showZeroMark = true,
}: SliderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Calculate fill percentage
  const range = max - min
  const zeroPosition = ((0 - min) / range) * 100
  const valuePosition = ((value - min) / range) * 100

  // Handle double-click to reset
  const handleLabelDoubleClick = useCallback(() => {
    onChange(defaultValue)
    onChangeEnd?.()
  }, [defaultValue, onChange, onChangeEnd])

  // Handle value click to edit
  const handleValueClick = useCallback(() => {
    setInputValue(formatValue(value))
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [value, formatValue])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  // Handle input blur/submit
  const handleInputSubmit = useCallback(() => {
    const parsed = parseFloat(inputValue)
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed))
      onChange(clamped)
      onChangeEnd?.()
    }
    setIsEditing(false)
  }, [inputValue, min, max, onChange, onChangeEnd])

  // Handle input key press
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }, [handleInputSubmit])

  // Format display value
  const displayValue = formatValue(value)
  const showPositiveSign = value > 0 && min < 0

  return (
    <div className="space-y-1.5">
      {/* Label and value row */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs text-gray-300 cursor-pointer hover:text-white select-none"
          onDoubleClick={handleLabelDoubleClick}
          title="Double-click to reset"
        >
          {label}
        </span>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputSubmit}
            onKeyDown={handleInputKeyDown}
            className="w-14 px-1 py-0.5 text-xs text-right bg-dark-600 border border-maroon rounded text-white font-mono focus:outline-none"
          />
        ) : (
          <span
            className="text-xs text-white font-mono tabular-nums cursor-pointer hover:text-maroon"
            onClick={handleValueClick}
          >
            {showPositiveSign ? '+' : ''}{displayValue}
          </span>
        )}
      </div>

      {/* Slider track */}
      <div className="relative h-4 flex items-center group">
        {/* Background track */}
        <div className="absolute inset-x-0 h-1 bg-dark-500 rounded-full" />

        {/* Fill track */}
        {showZeroMark && min < 0 && max > 0 ? (
          // Centered at zero
          <div
            className="absolute h-1 bg-gradient-to-r from-maroon-muted to-maroon rounded-full"
            style={{
              left: value >= 0 ? `${zeroPosition}%` : `${valuePosition}%`,
              width: `${Math.abs(valuePosition - zeroPosition)}%`,
            }}
          />
        ) : (
          // Start from left
          <div
            className="absolute left-0 h-1 bg-gradient-to-r from-maroon-muted to-maroon rounded-full"
            style={{ width: `${valuePosition}%` }}
          />
        )}

        {/* Zero mark */}
        {showZeroMark && min < 0 && max > 0 && (
          <div
            className="absolute w-px h-2 bg-gray-500"
            style={{ left: `${zeroPosition}%` }}
          />
        )}

        {/* Native range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onMouseUp={() => onChangeEnd?.()}
          onTouchEnd={() => onChangeEnd?.()}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Custom thumb */}
        <div
          className="absolute w-3.5 h-3.5 bg-white border-2 border-maroon rounded-full shadow-accent-glow pointer-events-none transform -translate-x-1/2 group-hover:scale-105 group-active:bg-maroon"
          style={{ left: `${valuePosition}%` }}
        />
      </div>
    </div>
  )
}
