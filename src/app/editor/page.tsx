'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/stores/editor-store'
import { Header } from '@/components/layout/Header'
import { LeftPanel } from '@/components/layout/LeftPanel'
import { RightPanel } from '@/components/layout/RightPanel'
import { MainCanvas } from '@/components/layout/MainCanvas'
import { Filmstrip } from '@/components/layout/Filmstrip'

export default function EditorPage() {
  const router = useRouter()
  const imageSource = useEditorStore((state) => state.imageSource)
  const images = useEditorStore((state) => state.images)
  const toggleBeforeAfter = useEditorStore((state) => state.toggleBeforeAfter)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const nextImage = useEditorStore((state) => state.nextImage)
  const previousImage = useEditorStore((state) => state.previousImage)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)
  const setImageRating = useEditorStore((state) => state.setImageRating)

  // Redirect to home if no images loaded
  useEffect(() => {
    if (images.length === 0) {
      router.push('/')
    }
  }, [images.length, router])

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

      // Arrow keys for image navigation (when not in crop mode)
      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        previousImage()
      }
      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        nextImage()
      }

      // Number keys 0-5 for star rating (0 to clear)
      if (['0', '1', '2', '3', '4', '5'].includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const rating = parseInt(e.key, 10)
        setImageRating(currentImageIndex, rating)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleBeforeAfter, undo, redo, nextImage, previousImage, currentImageIndex, setImageRating])

  if (images.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400">Loading...</div>
        </div>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <MainCanvas />

          {/* Filmstrip for multi-image navigation */}
          {images.length > 0 && <Filmstrip />}
        </div>

        {/* Right panel - Edit controls */}
        <RightPanel />
      </div>
    </div>
  )
}
