'use client'

import { useEditorStore } from '@/stores/editor-store'

export function BottomBar() {
  const { showBeforeAfter, toggleBeforeAfter, beforeAfterMode } = useEditorStore()

  return (
    <div className="h-14 bg-dark-800 border-t border-dark-400 flex items-center justify-center px-4 shrink-0">
      {/* Before/After toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleBeforeAfter}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            ${showBeforeAfter
              ? 'bg-maroon/20 text-maroon border border-maroon/30'
              : 'bg-dark-600 text-gray-300 hover:bg-dark-500 hover:text-white'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <CompareIcon />
            Before / After
          </span>
        </button>

        {showBeforeAfter && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-dark-600 rounded text-gray-300 font-mono">Y</kbd>
            <span>to toggle</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CompareIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}
