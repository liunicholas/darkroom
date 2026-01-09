'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Slider } from '@/components/controls/Slider'

export function EffectsPanel() {
  const effects = useEditorStore((state) => state.editState.effects)
  const setVignette = useEditorStore((state) => state.setVignette)
  const setGrain = useEditorStore((state) => state.setGrain)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const handleChangeEnd = useCallback(() => {
    pushHistory('Adjust effects')
  }, [pushHistory])

  return (
    <div className="space-y-6">
      {/* Vignette section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Vignette</h4>

        <Slider
          label="Amount"
          value={effects.vignette.amount}
          min={-100}
          max={100}
          onChange={(v) => setVignette('amount', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Midpoint"
          value={effects.vignette.midpoint}
          min={0}
          max={100}
          defaultValue={50}
          onChange={(v) => setVignette('midpoint', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Roundness"
          value={effects.vignette.roundness}
          min={-100}
          max={100}
          onChange={(v) => setVignette('roundness', v)}
          onChangeEnd={handleChangeEnd}
        />

        <Slider
          label="Feather"
          value={effects.vignette.feather}
          min={0}
          max={100}
          defaultValue={50}
          onChange={(v) => setVignette('feather', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />
      </div>

      {/* Grain section */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Grain</h4>

        <Slider
          label="Amount"
          value={effects.grain.amount}
          min={0}
          max={100}
          onChange={(v) => setGrain('amount', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Size"
          value={effects.grain.size}
          min={0}
          max={100}
          defaultValue={25}
          onChange={(v) => setGrain('size', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />

        <Slider
          label="Roughness"
          value={effects.grain.roughness}
          min={0}
          max={100}
          defaultValue={50}
          onChange={(v) => setGrain('roughness', v)}
          onChangeEnd={handleChangeEnd}
          showZeroMark={false}
        />
      </div>
    </div>
  )
}
