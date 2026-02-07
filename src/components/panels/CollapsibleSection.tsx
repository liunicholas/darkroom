'use client'

import { useState, useRef, useEffect } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  onOpenChange,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [children])

  return (
    <div className="border-b border-dark-400">
      {/* Header */}
      <button
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          onOpenChange?.(next)
        }}
        className="w-full flex items-center justify-between px-4 py-3 bg-dark-700 hover:bg-dark-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-maroon">{icon}</span>}
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content with animated height */}
      <div
        style={{
          height: isOpen ? contentHeight : 0,
          overflow: 'hidden',
          transition: 'height 200ms ease-out',
        }}
      >
        <div ref={contentRef} className="p-4 bg-dark-800">
          {children}
        </div>
      </div>
    </div>
  )
}
