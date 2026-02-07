'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { CollapsibleSection } from '@/components/panels/CollapsibleSection'
import { BasicPanel } from '@/components/panels/BasicPanel'
import { ToneCurvePanel } from '@/components/panels/ToneCurvePanel'
import { HSLPanel } from '@/components/panels/HSLPanel'
import { ColorGradingPanel } from '@/components/panels/ColorGradingPanel'
import { EffectsPanel } from '@/components/panels/EffectsPanel'
import { DetailPanel } from '@/components/panels/DetailPanel'
import { MaskingPanel } from '@/components/panels/MaskingPanel'
import { CropPanel } from '@/components/panels/CropPanel'
import { AIEditSection } from '@/components/panels/AIEditSection'
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
  cinema: 'Cinematic',
  bw: 'Black & White',
  vintage: 'Vintage Film',
  custom: 'Your Presets',
}

const categoryOrder = ['custom', 'cinema', 'vintage', 'bw']

export function RightPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['cinema']))

  const editState = useEditorStore((state) => state.editState)
  const applyPresetAction = useEditorStore((state) => state.applyPreset)
  const imageSource = useEditorStore((state) => state.imageSource)
  const images = useEditorStore((state) => state.images)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)
  const filterFlag = useEditorStore((state) => state.filterFlag)
  const filterRating = useEditorStore((state) => state.filterRating)
  const customPresets = useEditorStore((state) => state.customPresets)
  const addCustomPreset = useEditorStore((state) => state.addCustomPreset)
  const removeCustomPreset = useEditorStore((state) => state.removeCustomPreset)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)

  // The sidebar should only be interactive when the current image is visible on the canvas
  const isImageVisible = useMemo(() => {
    if (!imageSource) return false
    const currentImg = images[currentImageIndex]
    if (!currentImg) return false
    if (filterFlag !== 'all') {
      if (filterFlag === 'unflagged' && currentImg.flagStatus !== 'none') return false
      if (filterFlag === 'picked' && currentImg.flagStatus !== 'picked') return false
      if (filterFlag === 'rejected' && currentImg.flagStatus !== 'rejected') return false
    }
    if (filterRating > 0 && currentImg.rating < filterRating) return false
    return true
  }, [imageSource, images, currentImageIndex, filterFlag, filterRating])

  const [savePresetModalOpen, setSavePresetModalOpen] = useState(false)
  const [savePresetName, setSavePresetName] = useState('')
  const [panelWidth, setPanelWidth] = useState(320) // 320px = w-80
  const isResizing = useRef(false)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    const startX = e.clientX
    const startWidth = panelWidth

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      // Dragging left increases width (panel is on the right side)
      const newWidth = Math.max(320, startWidth + (startX - e.clientX))
      setPanelWidth(newWidth)
    }

    const onMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [panelWidth])

  const handlePresetClick = useCallback((preset: PresetData) => {
    if (!isImageVisible) return

    setSelectedPreset(preset.name)
    const newState = applyPreset(editState, preset)
    applyPresetAction(newState)
  }, [editState, applyPresetAction, isImageVisible])

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

  const handleSaveCurrentAsPreset = useCallback(() => {
    setSavePresetName('')
    setSavePresetModalOpen(true)
  }, [])

  const confirmSaveCurrentPreset = useCallback(() => {
    if (!savePresetName.trim()) return

    // Extract non-default basic values
    const basic: Partial<typeof editState.basic> = {}
    for (const [key, value] of Object.entries(editState.basic)) {
      if (value !== 0) {
        (basic as Record<string, number>)[key] = value
      }
    }

    // Extract non-default HSL values
    const hsl: PresetData['adjustments']['hsl'] = {}
    for (const [color, values] of Object.entries(editState.hsl)) {
      const nonZero: Record<string, number> = {}
      for (const [prop, val] of Object.entries(values)) {
        if (val !== 0) nonZero[prop] = val as number
      }
      if (Object.keys(nonZero).length > 0) {
        (hsl as Record<string, Record<string, number>>)[color] = nonZero
      }
    }

    // Extract non-default color grading
    const colorGrading: Partial<typeof editState.colorGrading> = {}
    for (const wheel of ['shadows', 'midtones', 'highlights', 'global'] as const) {
      const w = editState.colorGrading[wheel]
      if (w.hue !== 0 || w.saturation !== 0 || w.luminance !== 0) {
        colorGrading[wheel] = { ...w }
      }
    }
    if (editState.colorGrading.blending !== 50) colorGrading.blending = editState.colorGrading.blending
    if (editState.colorGrading.balance !== 0) colorGrading.balance = editState.colorGrading.balance

    // Extract non-default vignette
    const vignette: PresetData['adjustments']['vignette'] = {}
    const v = editState.effects.vignette
    if (v.amount !== 0) vignette.amount = v.amount
    if (v.midpoint !== 50) vignette.midpoint = v.midpoint
    if (v.feather !== 50) vignette.feather = v.feather

    // Extract non-default grain
    const grain: PresetData['adjustments']['grain'] = {}
    const g = editState.effects.grain
    if (g.amount !== 0) grain.amount = g.amount
    if (g.size !== 25) grain.size = g.size
    if (g.roughness !== 50) grain.roughness = g.roughness

    const adjustments: PresetData['adjustments'] = {}
    if (Object.keys(basic).length > 0) adjustments.basic = basic
    if (Object.keys(hsl).length > 0) adjustments.hsl = hsl
    if (Object.keys(colorGrading).length > 0) adjustments.colorGrading = colorGrading
    if (Object.keys(vignette).length > 0) adjustments.vignette = vignette
    if (Object.keys(grain).length > 0) adjustments.grain = grain

    const preset: PresetData = {
      name: savePresetName.trim(),
      description: 'Custom preset from current edits',
      category: 'custom',
      adjustments,
    }
    addCustomPreset(preset)
    setSavePresetModalOpen(false)
  }, [editState, savePresetName, addCustomPreset])

  const handleCropOpenChange = useCallback((isOpen: boolean) => {
    setActiveTool(isOpen ? 'crop' : 'select')
  }, [setActiveTool])

  if (isCollapsed) {
    return (
      <div className="w-10 bg-dark-800 border-l border-dark-400 flex flex-col items-center py-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-600 rounded"
          title="Expand panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    )
  }

  // Merge custom presets into grouped presets
  const allGrouped = { ...groupedPresets }
  if (customPresets.length > 0) {
    allGrouped['custom'] = customPresets
  }

  return (
    <div className="bg-dark-800 border-l border-dark-400 flex flex-col shrink-0 relative" style={{ width: panelWidth }}>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-accent/50 transition-colors z-10"
      />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-400">
        <h2 className="text-xs font-medium text-white uppercase tracking-wide">Edit</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 text-gray-400 hover:text-white hover:bg-dark-600 rounded"
          title="Collapse panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scrollable panels */}
      <div className={`flex-1 overflow-y-auto no-scrollbar ${!isImageVisible ? 'pointer-events-none opacity-50' : ''}`}>
        {/* AI Edit section */}
        <AIEditSection />

        {/* Presets section */}
        <CollapsibleSection
          title="Presets"
          icon={<PresetsIcon />}
          defaultOpen={false}
        >
          <div className="space-y-1">
            {/* Reset button */}
            {selectedPreset && (
              <button
                onClick={handleReset}
                className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-dark-600 rounded border border-dark-400 transition-colors mb-2"
              >
                Reset to Default
              </button>
            )}

            {/* Save current edits button */}
            <button
              onClick={handleSaveCurrentAsPreset}
              disabled={!isImageVisible}
              className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-dark-600 rounded border border-dark-400 border-dashed transition-colors mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Save Current Edits as Preset
            </button>

            {categoryOrder.map((category) => {
              const presets = allGrouped[category]
              if (!presets || presets.length === 0) return null

              const isExpanded = expandedCategories.has(category)

              return (
                <div key={category} className="mb-1">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                  >
                    <span>{categoryLabels[category] || category}</span>
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
                        <div key={preset.name} className="flex items-center group">
                          <button
                            onClick={() => handlePresetClick(preset)}
                            disabled={!isImageVisible}
                            className={`
                              flex-1 px-2 py-1.5 text-left text-xs rounded-md transition-colors
                              ${!isImageVisible ? 'opacity-50 cursor-not-allowed' : ''}
                              ${selectedPreset === preset.name
                                ? 'bg-maroon/20 text-maroon border-l-2 border-maroon'
                                : 'text-gray-300 hover:bg-dark-600 hover:text-white border-l-2 border-transparent'
                              }
                            `}
                            title={preset.description}
                          >
                            <span className="block">{preset.name}</span>
                            <span className="block text-[10px] text-gray-500 truncate mt-0.5">
                              {preset.description}
                            </span>
                          </button>
                          {category === 'custom' && (
                            <button
                              onClick={() => removeCustomPreset(preset.name)}
                              className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove preset"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Basic"
          icon={<SunIcon />}
          defaultOpen={true}
        >
          <BasicPanel />
        </CollapsibleSection>

        <CollapsibleSection
          title="Tone Curve"
          icon={<CurveIcon />}
          defaultOpen={false}
        >
          <ToneCurvePanel />
        </CollapsibleSection>

        <CollapsibleSection
          title="HSL / Color"
          icon={<PaletteIcon />}
          defaultOpen={false}
        >
          <HSLPanel />
        </CollapsibleSection>

        <CollapsibleSection
          title="Color Grading"
          icon={<ColorWheelIcon />}
          defaultOpen={false}
        >
          <ColorGradingPanel />
        </CollapsibleSection>

        <CollapsibleSection
          title="Effects"
          icon={<SparklesIcon />}
          defaultOpen={false}
        >
          <EffectsPanel />
        </CollapsibleSection>

        <CollapsibleSection
          title="Detail"
          icon={<DetailIcon />}
          defaultOpen={false}
        >
          <DetailPanel />
        </CollapsibleSection>

        <CollapsibleSection
          title="Masking"
          icon={<MaskIcon />}
          defaultOpen={false}
        >
          <MaskingPanel />
        </CollapsibleSection>

        <CollapsibleSection
          title="Crop & Transform"
          icon={<CropIcon />}
          defaultOpen={false}
          onOpenChange={handleCropOpenChange}
        >
          <CropPanel />
        </CollapsibleSection>
      </div>

      {/* Save preset modal */}
      {savePresetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-700 border border-dark-500 rounded-lg p-4 w-72">
            <h3 className="text-sm font-medium text-white mb-3">Save Current Edits as Preset</h3>
            <input
              type="text"
              value={savePresetName}
              onChange={(e) => setSavePresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmSaveCurrentPreset()}
              placeholder="Preset name..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-500 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSavePresetModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveCurrentPreset}
                disabled={!savePresetName.trim()}
                className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Icons
function PresetsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function CurveIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  )
}

function ColorWheelIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

function DetailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  )
}

function MaskIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function CropIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18M9 3v12h12" />
    </svg>
  )
}
