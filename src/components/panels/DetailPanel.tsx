'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Slider } from '@/components/controls/Slider'

export function DetailPanel() {
  const detail = useEditorStore((state) => state.editState.detail)
  const setSharpening = useEditorStore((state) => state.setSharpening)
  const setNoiseReduction = useEditorStore((state) => state.setNoiseReduction)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const handleChangeEnd = useCallback(() => {
    pushHistory('Adjust detail')
  }, [pushHistory])

  return (
    <div className="space-y-6">
      {/* Sharpening section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sharpening</h4>

        <Slider
          label="Amount"
          value={detail.sharpening.amount}
          min={0}
          max={150}
          onChange={(v) => setSharpening('amount', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Radius"
          value={detail.sharpening.radius}
          min={0.5}
          max={3}
          step={0.1}
          defaultValue={1}
          onChange={(v) => setSharpening('radius', v)}
          onChangeEnd={handleChangeEnd}
          formatValue={(v) => v.toFixed(1)}
          showZeroMark={false}
        />

        <Slider
          label="Detail"
          value={detail.sharpening.detail}
          min={0}
          max={100}
          defaultValue={25}
          onChange={(v) => setSharpening('detail', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Masking"
          value={detail.sharpening.masking}
          min={0}
          max={100}
          onChange={(v) => setSharpening('masking', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />
      </div>

      {/* Noise Reduction section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Noise Reduction</h4>

        <Slider
          label="Luminance"
          value={detail.noiseReduction.luminance}
          min={0}
          max={100}
          onChange={(v) => setNoiseReduction('luminance', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Detail"
          value={detail.noiseReduction.luminanceDetail}
          min={0}
          max={100}
          defaultValue={50}
          onChange={(v) => setNoiseReduction('luminanceDetail', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Color"
          value={detail.noiseReduction.color}
          min={0}
          max={100}
          defaultValue={25}
          onChange={(v) => setNoiseReduction('color', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Color Detail"
          value={detail.noiseReduction.colorDetail}
          min={0}
          max={100}
          defaultValue={50}
          onChange={(v) => setNoiseReduction('colorDetail', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />
      </div>
    </div>
  )
}
