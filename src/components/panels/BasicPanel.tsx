'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Slider } from '@/components/controls/Slider'
import type { BasicAdjustments } from '@/types/edit-state'

export function BasicPanel() {
  const basic = useEditorStore((state) => state.editState.basic)
  const setBasicAdjustment = useEditorStore((state) => state.setBasicAdjustment)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const handleChange = useCallback(<K extends keyof BasicAdjustments>(key: K, value: BasicAdjustments[K]) => {
    setBasicAdjustment(key, value)
  }, [setBasicAdjustment])

  const handleChangeEnd = useCallback(() => {
    pushHistory('Adjust basic')
  }, [pushHistory])

  return (
    <div className="space-y-6">
      {/* Light section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Light</h4>

        <Slider
          label="Exposure"
          value={basic.exposure}
          min={-5}
          max={5}
          step={0.01}
          onChange={(v) => handleChange('exposure', v)}
          onChangeEnd={handleChangeEnd}
          formatValue={(v) => (v >= 0 ? '+' : '') + v.toFixed(2)}
        />

        <Slider
          label="Contrast"
          value={basic.contrast}
          min={-100}
          max={100}
          onChange={(v) => handleChange('contrast', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Highlights"
          value={basic.highlights}
          min={-100}
          max={100}
          onChange={(v) => handleChange('highlights', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Shadows"
          value={basic.shadows}
          min={-100}
          max={100}
          onChange={(v) => handleChange('shadows', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Whites"
          value={basic.whites}
          min={-100}
          max={100}
          onChange={(v) => handleChange('whites', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Blacks"
          value={basic.blacks}
          min={-100}
          max={100}
          onChange={(v) => handleChange('blacks', v)}
          onChangeEnd={handleChangeEnd}
        />
      </div>

      {/* Presence section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Presence</h4>

        <Slider
          label="Texture"
          value={basic.texture}
          min={-100}
          max={100}
          onChange={(v) => handleChange('texture', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Clarity"
          value={basic.clarity}
          min={-100}
          max={100}
          onChange={(v) => handleChange('clarity', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Dehaze"
          value={basic.dehaze}
          min={-100}
          max={100}
          onChange={(v) => handleChange('dehaze', v)}
          onChangeEnd={handleChangeEnd}
        />
      </div>

      {/* Color section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Color</h4>

        <Slider
          label="Temperature"
          value={basic.temperature}
          min={-100}
          max={100}
          onChange={(v) => handleChange('temperature', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Tint"
          value={basic.tint}
          min={-150}
          max={150}
          onChange={(v) => handleChange('tint', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Vibrance"
          value={basic.vibrance}
          min={-100}
          max={100}
          onChange={(v) => handleChange('vibrance', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Saturation"
          value={basic.saturation}
          min={-100}
          max={100}
          onChange={(v) => handleChange('saturation', v)}
          onChangeEnd={handleChangeEnd}
        />
      </div>
    </div>
  )
}
