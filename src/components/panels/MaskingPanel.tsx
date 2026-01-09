'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Slider } from '@/components/controls/Slider'
import type { MaskLayer, BasicAdjustments } from '@/types/edit-state'

export function MaskingPanel() {
  const masks = useEditorStore((state) => state.editState.masks)
  const activeMaskId = useEditorStore((state) => state.editState.activeMaskId)
  const activeTool = useEditorStore((state) => state.activeTool)
  const brushSettings = useEditorStore((state) => state.brushSettings)
  const addMask = useEditorStore((state) => state.addMask)
  const updateMask = useEditorStore((state) => state.updateMask)
  const deleteMask = useEditorStore((state) => state.deleteMask)
  const setActiveMask = useEditorStore((state) => state.setActiveMask)
  const setActiveTool = useEditorStore((state) => state.setActiveTool)
  const setBrushSettings = useEditorStore((state) => state.setBrushSettings)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const activeMask = masks.find((m) => m.id === activeMaskId)

  const handleAddBrushMask = useCallback(() => {
    addMask('brush')
    setActiveTool('brush')
  }, [addMask, setActiveTool])

  const handleAddRadialMask = useCallback(() => {
    const id = addMask('radialGradient')
    // Set default gradient data
    updateMask(id, {
      gradientData: {
        centerX: 0.5,
        centerY: 0.5,
        innerRadius: 0.1,
        outerRadius: 0.4,
        aspectRatio: 1,
        rotation: 0,
        inverted: false,
      },
    })
    setActiveTool('radialGradient')
  }, [addMask, updateMask, setActiveTool])

  const handleAddLinearMask = useCallback(() => {
    const id = addMask('linearGradient')
    // Set default gradient data
    updateMask(id, {
      gradientData: {
        startX: 0.3,
        startY: 0.5,
        endX: 0.7,
        endY: 0.5,
        feather: 0.2,
        inverted: false,
      },
    })
    setActiveTool('linearGradient')
  }, [addMask, updateMask, setActiveTool])

  const handleDeleteMask = useCallback((id: string) => {
    deleteMask(id)
    setActiveTool('select')
  }, [deleteMask, setActiveTool])

  const handleMaskAdjustmentChange = useCallback((key: keyof BasicAdjustments, value: number) => {
    if (!activeMaskId) return
    updateMask(activeMaskId, {
      adjustments: {
        ...activeMask?.adjustments,
        [key]: value,
      },
    })
  }, [activeMaskId, activeMask, updateMask])

  const handleMaskAdjustmentEnd = useCallback(() => {
    pushHistory('Adjust mask')
  }, [pushHistory])

  return (
    <div className="space-y-4">
      {/* Add mask buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Add New Mask</p>
        <div className="flex gap-2">
          <button
            onClick={handleAddBrushMask}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTool === 'brush'
                ? 'bg-maroon text-white'
                : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
            }`}
          >
            <BrushIcon />
            Brush
          </button>
          <button
            onClick={handleAddRadialMask}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTool === 'radialGradient'
                ? 'bg-maroon text-white'
                : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
            }`}
          >
            <RadialIcon />
            Radial
          </button>
          <button
            onClick={handleAddLinearMask}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTool === 'linearGradient'
                ? 'bg-maroon text-white'
                : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
            }`}
          >
            <LinearIcon />
            Linear
          </button>
        </div>
      </div>

      {/* Brush settings (when brush tool active) */}
      {activeTool === 'brush' && (
        <div className="space-y-3 p-3 bg-dark-700 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-300">Brush Settings</p>
            <div className="flex gap-1">
              <button
                onClick={() => setBrushSettings({ mode: 'add' })}
                className={`px-2 py-1 text-xs rounded ${
                  brushSettings.mode === 'add'
                    ? 'bg-maroon text-white'
                    : 'bg-dark-500 text-gray-400 hover:bg-dark-400'
                }`}
              >
                Add
              </button>
              <button
                onClick={() => setBrushSettings({ mode: 'subtract' })}
                className={`px-2 py-1 text-xs rounded ${
                  brushSettings.mode === 'subtract'
                    ? 'bg-maroon text-white'
                    : 'bg-dark-500 text-gray-400 hover:bg-dark-400'
                }`}
              >
                Erase
              </button>
            </div>
          </div>
          <Slider
            label="Size"
            value={brushSettings.size}
            min={1}
            max={500}
            step={1}
            onChange={(value) => setBrushSettings({ size: value })}
            formatValue={(v) => `${Math.round(v)}px`}
            showZeroMark={false}
          />
          <Slider
            label="Hardness"
            value={brushSettings.hardness}
            min={0}
            max={100}
            step={1}
            onChange={(value) => setBrushSettings({ hardness: value })}
            formatValue={(v) => `${Math.round(v)}%`}
            showZeroMark={false}
          />
          <Slider
            label="Flow"
            value={brushSettings.flow}
            min={1}
            max={100}
            step={1}
            onChange={(value) => setBrushSettings({ flow: value })}
            formatValue={(v) => `${Math.round(v)}%`}
            showZeroMark={false}
          />
        </div>
      )}

      {/* Mask list */}
      {masks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Masks</p>
          <div className="space-y-1">
            {masks.map((mask) => (
              <MaskListItem
                key={mask.id}
                mask={mask}
                isActive={mask.id === activeMaskId}
                onSelect={() => {
                  setActiveMask(mask.id)
                  setActiveTool(mask.type === 'brush' ? 'brush' : mask.type)
                }}
                onToggle={() => updateMask(mask.id, { enabled: !mask.enabled })}
                onDelete={() => handleDeleteMask(mask.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active mask adjustments */}
      {activeMask && (
        <div className="space-y-3 p-3 bg-dark-700 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-300">Mask Adjustments</p>
            <button
              onClick={() => updateMask(activeMask.id, { inverted: !activeMask.inverted })}
              className={`px-2 py-1 text-xs rounded ${
                activeMask.inverted
                  ? 'bg-maroon text-white'
                  : 'bg-dark-500 text-gray-400 hover:bg-dark-400'
              }`}
            >
              Invert
            </button>
          </div>

          <Slider
            label="Opacity"
            value={activeMask.opacity * 100}
            min={0}
            max={100}
            step={1}
            onChange={(value) => updateMask(activeMask.id, { opacity: value / 100 })}
            formatValue={(v) => `${Math.round(v)}%`}
            showZeroMark={false}
          />

          <Slider
            label="Feather"
            value={activeMask.feather}
            min={0}
            max={100}
            step={1}
            onChange={(value) => updateMask(activeMask.id, { feather: value })}
            formatValue={(v) => `${Math.round(v)}`}
            showZeroMark={false}
          />

          <div className="border-t border-dark-500 pt-3 mt-3">
            <p className="text-xs text-gray-500 mb-2">Local Adjustments</p>
            <Slider
              label="Exposure"
              value={activeMask.adjustments.exposure ?? 0}
              min={-5}
              max={5}
              step={0.01}
              onChange={(value) => handleMaskAdjustmentChange('exposure', value)}
              onChangeEnd={handleMaskAdjustmentEnd}
            />
            <Slider
              label="Contrast"
              value={activeMask.adjustments.contrast ?? 0}
              min={-100}
              max={100}
              step={1}
              onChange={(value) => handleMaskAdjustmentChange('contrast', value)}
              onChangeEnd={handleMaskAdjustmentEnd}
            />
            <Slider
              label="Highlights"
              value={activeMask.adjustments.highlights ?? 0}
              min={-100}
              max={100}
              step={1}
              onChange={(value) => handleMaskAdjustmentChange('highlights', value)}
              onChangeEnd={handleMaskAdjustmentEnd}
            />
            <Slider
              label="Shadows"
              value={activeMask.adjustments.shadows ?? 0}
              min={-100}
              max={100}
              step={1}
              onChange={(value) => handleMaskAdjustmentChange('shadows', value)}
              onChangeEnd={handleMaskAdjustmentEnd}
            />
            <Slider
              label="Saturation"
              value={activeMask.adjustments.saturation ?? 0}
              min={-100}
              max={100}
              step={1}
              onChange={(value) => handleMaskAdjustmentChange('saturation', value)}
              onChangeEnd={handleMaskAdjustmentEnd}
            />
            <Slider
              label="Temperature"
              value={activeMask.adjustments.temperature ?? 0}
              min={-100}
              max={100}
              step={1}
              onChange={(value) => handleMaskAdjustmentChange('temperature', value)}
              onChangeEnd={handleMaskAdjustmentEnd}
            />
            <Slider
              label="Clarity"
              value={activeMask.adjustments.clarity ?? 0}
              min={-100}
              max={100}
              step={1}
              onChange={(value) => handleMaskAdjustmentChange('clarity', value)}
              onChangeEnd={handleMaskAdjustmentEnd}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {masks.length === 0 && (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center mx-auto mb-3">
            <MaskIcon />
          </div>
          <p className="text-sm text-gray-400">No masks yet</p>
          <p className="text-xs text-gray-500 mt-1">Add a mask to make local adjustments</p>
        </div>
      )}
    </div>
  )
}

// Mask list item component
function MaskListItem({
  mask,
  isActive,
  onSelect,
  onToggle,
  onDelete,
}: {
  mask: MaskLayer
  isActive: boolean
  onSelect: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
        isActive ? 'bg-maroon/20 border border-maroon/50' : 'bg-dark-600 hover:bg-dark-500'
      }`}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`w-4 h-4 rounded border ${
          mask.enabled ? 'bg-maroon border-maroon' : 'border-gray-500'
        }`}
      >
        {mask.enabled && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {mask.type === 'brush' && <BrushIcon className="w-3 h-3 text-gray-400" />}
          {mask.type === 'radialGradient' && <RadialIcon className="w-3 h-3 text-gray-400" />}
          {mask.type === 'linearGradient' && <LinearIcon className="w-3 h-3 text-gray-400" />}
          <span className="text-xs text-gray-300 truncate">{mask.name}</span>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="p-1 text-gray-500 hover:text-red-400 rounded"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

// Icons
function BrushIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function RadialIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="5" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="1" strokeWidth={1.5} fill="currentColor" />
    </svg>
  )
}

function LinearIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function MaskIcon({ className = 'w-5 h-5 text-gray-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
