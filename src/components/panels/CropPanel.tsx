'use client'

import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Slider } from '@/components/controls/Slider'
import type { AspectRatioPreset } from '@/types/edit-state'

const ASPECT_RATIOS: { label: string; value: AspectRatioPreset; ratio?: number }[] = [
  { label: 'Free', value: 'free' },
  { label: 'Original', value: 'original' },
  { label: '1:1', value: '1:1', ratio: 1 },
  { label: '4:3', value: '4:3', ratio: 4/3 },
  { label: '3:2', value: '3:2', ratio: 3/2 },
  { label: '16:9', value: '16:9', ratio: 16/9 },
  { label: '5:4', value: '5:4', ratio: 5/4 },
  { label: '2:3', value: '2:3', ratio: 2/3 },
  { label: '9:16', value: '9:16', ratio: 9/16 },
]

export function CropPanel() {
  const crop = useEditorStore((state) => state.editState.crop)
  const setCrop = useEditorStore((state) => state.setCrop)
  const resetCrop = useEditorStore((state) => state.resetCrop)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  const handleAspectRatioChange = useCallback((value: string) => {
    setCrop({ aspectRatio: value === 'free' ? null : value })
    pushHistory('Change aspect ratio')
  }, [setCrop, pushHistory])

  const handleRotationChange = useCallback((value: number) => {
    setCrop({ rotation: value })
  }, [setCrop])

  const handleRotationEnd = useCallback(() => {
    pushHistory('Rotate image')
  }, [pushHistory])

  const handleFlipHorizontal = useCallback(() => {
    setCrop({ flipHorizontal: !crop.flipHorizontal })
    pushHistory('Flip horizontal')
  }, [setCrop, crop.flipHorizontal, pushHistory])

  const handleFlipVertical = useCallback(() => {
    setCrop({ flipVertical: !crop.flipVertical })
    pushHistory('Flip vertical')
  }, [setCrop, crop.flipVertical, pushHistory])

  const handleRotate90CW = useCallback(() => {
    // Keep rotation in -180 to 180 range
    let newRotation = crop.rotation + 90
    if (newRotation > 180) newRotation -= 360
    setCrop({ rotation: newRotation })
    pushHistory('Rotate 90 CW')
  }, [setCrop, crop.rotation, pushHistory])

  const handleRotate90CCW = useCallback(() => {
    // Keep rotation in -180 to 180 range
    let newRotation = crop.rotation - 90
    if (newRotation < -180) newRotation += 360
    setCrop({ rotation: newRotation })
    pushHistory('Rotate 90 CCW')
  }, [setCrop, crop.rotation, pushHistory])

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 text-center">
        Drag corners to crop, drag inside to move
      </p>

      {/* Aspect ratio presets */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Aspect Ratio</p>
        <div className="grid grid-cols-3 gap-1.5">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.value}
              onClick={() => handleAspectRatioChange(ar.value)}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                (crop.aspectRatio === ar.value) || (ar.value === 'free' && !crop.aspectRatio)
                  ? 'bg-maroon text-white'
                  : 'bg-dark-600 text-gray-400 hover:bg-dark-500 hover:text-gray-300'
              }`}
            >
              {ar.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rotation slider */}
      <div className="space-y-2">
        <Slider
          label="Rotation"
          value={crop.rotation}
          min={-180}
          max={180}
          step={0.1}
          defaultValue={0}
          onChange={handleRotationChange}
          onChangeEnd={handleRotationEnd}
          formatValue={(v) => `${v.toFixed(1)}`}
        />
      </div>

      {/* Quick rotation buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Quick Rotate</p>
        <div className="flex gap-2">
          <button
            onClick={handleRotate90CCW}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-dark-600 text-gray-300 hover:bg-dark-500 rounded text-xs font-medium"
          >
            <RotateCCWIcon />
            90 CCW
          </button>
          <button
            onClick={handleRotate90CW}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-dark-600 text-gray-300 hover:bg-dark-500 rounded text-xs font-medium"
          >
            <RotateCWIcon />
            90 CW
          </button>
        </div>
      </div>

      {/* Flip buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Flip</p>
        <div className="flex gap-2">
          <button
            onClick={handleFlipHorizontal}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              crop.flipHorizontal
                ? 'bg-maroon text-white'
                : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
            }`}
          >
            <FlipHIcon />
            Horizontal
          </button>
          <button
            onClick={handleFlipVertical}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              crop.flipVertical
                ? 'bg-maroon text-white'
                : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
            }`}
          >
            <FlipVIcon />
            Vertical
          </button>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={resetCrop}
        className="w-full px-4 py-2 bg-dark-600 text-gray-300 hover:bg-dark-500 rounded text-xs font-medium"
      >
        Reset Crop & Transform
      </button>
    </div>
  )
}

// Icons
function RotateCWIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function RotateCCWIcon() {
  return (
    <svg className="w-4 h-4 transform scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function FlipHIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  )
}

function FlipVIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}
