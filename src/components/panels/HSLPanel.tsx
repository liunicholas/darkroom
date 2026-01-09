'use client'

import { useState, useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Slider } from '@/components/controls/Slider'
import type { HSLColor } from '@/types/edit-state'

const HSL_COLORS: { id: HSLColor; label: string; color: string }[] = [
  { id: 'red', label: 'Red', color: '#ef4444' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'yellow', label: 'Yellow', color: '#eab308' },
  { id: 'green', label: 'Green', color: '#22c55e' },
  { id: 'aqua', label: 'Aqua', color: '#06b6d4' },
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'purple', label: 'Purple', color: '#a855f7' },
  { id: 'magenta', label: 'Magenta', color: '#ec4899' },
]

type AdjustmentType = 'hue' | 'saturation' | 'luminance'

export function HSLPanel() {
  const [activeTab, setActiveTab] = useState<AdjustmentType>('hue')
  const hsl = useEditorStore((state) => state.editState.hsl)
  const setHSLValue = useEditorStore((state) => state.setHSLValue)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const handleChange = useCallback((color: HSLColor, type: AdjustmentType, value: number) => {
    setHSLValue(color, type, value)
  }, [setHSLValue])

  const handleChangeEnd = useCallback(() => {
    pushHistory('Adjust HSL')
  }, [pushHistory])

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-dark-400">
        {(['hue', 'saturation', 'luminance'] as AdjustmentType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors
              ${activeTab === tab
                ? 'text-maroon border-b-2 border-maroon'
                : 'text-gray-400 hover:text-white'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Color sliders */}
      <div className="space-y-3">
        {HSL_COLORS.map(({ id, label, color }) => (
          <div key={id} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1">
              <Slider
                label={label}
                value={hsl[id][activeTab]}
                min={-100}
                max={100}
                onChange={(v) => handleChange(id, activeTab, v)}
                onChangeEnd={handleChangeEnd}
              />
            </div>
          </div>
        ))}
      </div>

      {/* All tab view - color grid */}
      <div className="pt-2 border-t border-dark-400">
        <div className="text-xs text-gray-500 mb-2">Quick adjust all colors</div>
        <div className="flex gap-1">
          {HSL_COLORS.map(({ id, color }) => {
            const hasChanges = hsl[id].hue !== 0 || hsl[id].saturation !== 0 || hsl[id].luminance !== 0
            return (
              <button
                key={id}
                className={`
                  w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
                  ${hasChanges ? 'border-maroon' : 'border-transparent'}
                `}
                style={{ backgroundColor: color }}
                title={`${id}: H${hsl[id].hue} S${hsl[id].saturation} L${hsl[id].luminance}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
