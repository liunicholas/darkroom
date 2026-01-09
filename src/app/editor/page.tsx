'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/stores/editor-store'
import { Header } from '@/components/layout/Header'
import { LeftPanel } from '@/components/layout/LeftPanel'
import { RightPanel } from '@/components/layout/RightPanel'
import { MainCanvas } from '@/components/layout/MainCanvas'
import { BottomBar } from '@/components/layout/BottomBar'

export default function EditorPage() {
  const router = useRouter()
  const imageSource = useEditorStore((state) => state.imageSource)
  const toggleBeforeAfter = useEditorStore((state) => state.toggleBeforeAfter)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)

  // Redirect to home if no image loaded
  useEffect(() => {
    if (!imageSource) {
      router.push('/')
    }
  }, [imageSource, router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Y - Toggle before/after
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault()
        toggleBeforeAfter()
      }

      // Cmd/Ctrl + Z - Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Cmd/Ctrl + Shift + Z - Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleBeforeAfter, undo, redo])

  if (!imageSource) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
      {/* Header toolbar */}
      <Header />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Presets */}
        <LeftPanel />

        {/* Main canvas */}
        <MainCanvas />

        {/* Right panel - Edit controls */}
        <RightPanel />
      </div>

      {/* Bottom bar */}
      <BottomBar />
    </div>
  )
}
