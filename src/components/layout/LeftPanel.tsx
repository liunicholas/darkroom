'use client'

import { useState, useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { allPresets, applyPreset, PresetData } from '@/lib/presets/fujifilm-presets'

// Group presets by category
const groupedPresets = allPresets.reduce((acc, preset) => {
  if (!acc[preset.category]) {
    acc[preset.category] = []
  }
  acc[preset.category].push(preset)
  return acc
}, {} as Record<string, PresetData[]>)

const categoryLabels: Record<string, string> = {
  fujifilm: 'Fujifilm Film Simulations',
  cinema: 'Cinematic',
  bw: 'Black & White',
  vintage: 'Vintage Film',
  custom: 'Custom',
}

const categoryOrder = ['fujifilm', 'cinema', 'vintage', 'bw']

export function LeftPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['fujifilm']))

  const editState = useEditorStore((state) => state.editState)
  const applyPresetAction = useEditorStore((state) => state.applyPreset)
  const imageSource = useEditorStore((state) => state.imageSource)

  const handlePresetClick = useCallback((preset: PresetData) => {
    if (!imageSource) return

    setSelectedPreset(preset.name)
    const newState = applyPreset(editState, preset)
    applyPresetAction(newState)
  }, [editState, applyPresetAction, imageSource])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    setSelectedPreset(null)
    useEditorStore.getState().resetAllEdits()
  }, [])

  if (isCollapsed) {
    return (
      <div className="w-10 bg-dark-800 border-r border-dark-400 flex flex-col items-center py-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-600 rounded"
          title="Expand panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="w-64 bg-dark-800 border-r border-dark-400 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-400">
        <h2 className="text-sm font-display font-medium text-white">Presets</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 text-gray-400 hover:text-white hover:bg-dark-600 rounded"
          title="Collapse panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Reset button */}
      {selectedPreset && (
        <div className="px-3 pt-3">
          <button
            onClick={handleReset}
            className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-dark-600 rounded border border-dark-400 transition-colors"
          >
            Reset to Default
          </button>
        </div>
      )}

      {/* Presets list */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {categoryOrder.map((category) => {
          const presets = groupedPresets[category]
          if (!presets || presets.length === 0) return null

          const isExpanded = expandedCategories.has(category)

          return (
            <div key={category} className="mb-2">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
              >
                <span>{categoryLabels[category]}</span>
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Preset buttons */}
              {isExpanded && (
                <div className="space-y-0.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetClick(preset)}
                      disabled={!imageSource}
                      className={`
                        w-full px-3 py-2 text-left text-sm rounded-md transition-colors
                        ${!imageSource ? 'opacity-50 cursor-not-allowed' : ''}
                        ${selectedPreset === preset.name
                          ? 'bg-maroon/20 text-maroon border-l-2 border-maroon'
                          : 'text-gray-300 hover:bg-dark-600 hover:text-white border-l-2 border-transparent'
                        }
                      `}
                      title={preset.description}
                    >
                      <span className="block">{preset.name}</span>
                      <span className="block text-xs text-gray-500 truncate mt-0.5">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

      </div>

      {/* No image warning */}
      {!imageSource && (
        <div className="px-3 py-2 bg-dark-700 border-t border-dark-400">
          <p className="text-xs text-gray-500 text-center">
            Import an image to apply presets
          </p>
        </div>
      )}
    </div>
  )
}
