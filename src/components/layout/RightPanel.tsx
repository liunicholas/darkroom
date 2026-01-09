'use client'

import { useState } from 'react'
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

export function RightPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const activePanel = useEditorStore((state) => state.activePanel)
  const setActivePanel = useEditorStore((state) => state.setActivePanel)

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

  return (
    <div className="w-80 bg-dark-800 border-l border-dark-400 flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-400">
        <h2 className="text-sm font-medium text-white">Edit</h2>
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
      <div className="flex-1 overflow-y-auto no-scrollbar">
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
        >
          <CropPanel />
        </CollapsibleSection>
      </div>
    </div>
  )
}

// Icons
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
