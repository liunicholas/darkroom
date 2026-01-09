'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/stores/editor-store'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { WebGLRenderer } from '@/lib/webgl/WebGLRenderer'

export function Header() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    loadImage,
    imageSource,
    zoom,
    setZoom,
    showBeforeAfter,
    toggleBeforeAfter,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore()

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await loadImage(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [loadImage])

  const editState = useEditorStore((state) => state.editState)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (!imageSource?.fullBitmap) return

    setIsExporting(true)

    try {
      // Use full resolution image for export
      const img = imageSource.fullBitmap

      // Create offscreen canvas for WebGL rendering
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      // Create WebGL renderer
      const renderer = new WebGLRenderer(canvas)
      renderer.setImage(img)
      renderer.render(editState)

      // Export as blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `darkroom_export_${Date.now()}.jpg`
          a.click()
          URL.revokeObjectURL(url)
        }
        renderer.dispose()
        setIsExporting(false)
      }, 'image/jpeg', 0.92)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }, [imageSource, editState])

  const handleZoomIn = useCallback(() => {
    setZoom(zoom * 1.25)
  }, [zoom, setZoom])

  const handleZoomOut = useCallback(() => {
    setZoom(zoom / 1.25)
  }, [zoom, setZoom])

  const handleFit = useCallback(() => {
    setZoom(1)
  }, [setZoom])

  const handleHome = useCallback(() => {
    router.push('/')
  }, [router])

  return (
    <header className="h-12 bg-dark-800 border-b border-dark-400 flex items-center justify-between px-4 shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: Logo and file actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleHome}
          className="text-lg font-display font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="text-white">Dark</span>
          <span className="text-maroon">room</span>
        </button>

        <div className="h-6 w-px bg-dark-400" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleImport}>
            Import
          </Button>
          <Button variant="primary" size="sm" onClick={handleExport} disabled={isExporting || !imageSource}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Center: Edit actions */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<UndoIcon />}
          onClick={undo}
          disabled={!canUndo()}
          tooltip="Undo (Cmd+Z)"
        />
        <IconButton
          icon={<RedoIcon />}
          onClick={redo}
          disabled={!canRedo()}
          tooltip="Redo (Cmd+Shift+Z)"
        />
      </div>

      {/* Right: View actions */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<ZoomOutIcon />}
          onClick={handleZoomOut}
          tooltip="Zoom out"
        />
        <span className="text-xs text-gray-400 w-12 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton
          icon={<ZoomInIcon />}
          onClick={handleZoomIn}
          tooltip="Zoom in"
        />
        <IconButton
          icon={<FitIcon />}
          onClick={handleFit}
          tooltip="Fit to view"
        />

        <div className="h-6 w-px bg-dark-400 mx-2" />

        <IconButton
          icon={<CompareIcon />}
          onClick={toggleBeforeAfter}
          active={showBeforeAfter}
          tooltip="Before/After (Y)"
        />
      </div>
    </header>
  )
}

// Icons
function UndoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  )
}

function RedoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
    </svg>
  )
}

function FitIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
}
