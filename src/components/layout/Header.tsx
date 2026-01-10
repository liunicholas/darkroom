'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/stores/editor-store'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { ImageMetadataModal } from '@/components/ImageMetadataModal'
import { ExportModal } from '@/components/ExportModal'
import { StarRating } from '@/components/ui/StarRating'

export function Header() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [showImportMenu, setShowImportMenu] = useState(false)
  const [showMetadataModal, setShowMetadataModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const {
    loadImage,
    loadImages,
    imageSource,
    images,
    currentImageIndex,
    nextImage,
    previousImage,
    setImageRating,
    zoom,
    setZoom,
    showBeforeAfter,
    toggleBeforeAfter,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorStore()

  const handleImportFile = useCallback(() => {
    fileInputRef.current?.click()
    setShowImportMenu(false)
  }, [])

  const handleImportFolder = useCallback(() => {
    folderInputRef.current?.click()
    setShowImportMenu(false)
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 1) {
      await loadImage(files[0])
    } else if (files.length > 1) {
      await loadImages(files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [loadImage, loadImages])

  const handleFolderChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || [])
    // Filter for image files only
    const imageFiles = allFiles.filter(file =>
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|bmp|tiff?)$/i.test(file.name)
    )
    if (imageFiles.length > 0) {
      await loadImages(imageFiles)
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = ''
    }
  }, [loadImages])

  const handleExport = useCallback(() => {
    setShowExportModal(true)
  }, [])

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

  const currentImage = images[currentImageIndex]

  return (
    <header className="h-14 bg-dark-800 border-b border-dark-500 flex items-center justify-between px-4 shrink-0">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore - webkitdirectory is not in the type definitions
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderChange}
        className="hidden"
      />

      {/* Left: Logo and file actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleHome}
          className="text-xl font-display font-bold tracking-tight hover:opacity-80 transition-opacity flex items-center"
        >
          <span className="text-white">Dark</span>
          <span className="text-maroon">room</span>
        </button>

        <div className="h-6 w-px bg-dark-500" />

        {/* Import dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImportMenu(!showImportMenu)}
            className="flex items-center gap-1"
          >
            <ImportIcon />
            Import
            <ChevronDownIcon />
          </Button>

          {showImportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowImportMenu(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-48 bg-dark-700 border border-dark-500 rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={handleImportFile}
                  className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-dark-600 flex items-center gap-2"
                >
                  <FileIcon />
                  Import Files
                </button>
                <button
                  onClick={handleImportFolder}
                  className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-dark-600 flex items-center gap-2"
                >
                  <FolderIcon />
                  Import Folder
                </button>
              </div>
            </>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={!imageSource}
          className="flex items-center gap-1"
        >
          <ExportIcon />
          Export
        </Button>
      </div>

      {/* Center: Image navigation & filename */}
      <div className="flex items-center gap-3">
        {images.length > 1 && (
          <>
            <IconButton
              icon={<ChevronLeftIcon />}
              onClick={previousImage}
              disabled={currentImageIndex <= 0}
              tooltip="Previous image (←)"
              size="sm"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMetadataModal(true)}
                className="flex items-center gap-2 min-w-32 hover:bg-dark-700 rounded-md px-2 py-1 transition-colors group"
              >
                <span className="text-sm text-gray-300 font-medium truncate max-w-40 group-hover:text-white" title={currentImage?.fileName}>
                  {currentImage?.fileName}
                </span>
                <span className="text-xs text-gray-500 tabular-nums">
                  {currentImageIndex + 1} / {images.length}
                </span>
                <InfoIcon className="w-3.5 h-3.5 text-gray-500 group-hover:text-maroon opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <StarRating
                rating={currentImage?.rating || 0}
                onRatingChange={(rating) => setImageRating(currentImageIndex, rating)}
                size="sm"
              />
            </div>
            <IconButton
              icon={<ChevronRightIcon />}
              onClick={nextImage}
              disabled={currentImageIndex >= images.length - 1}
              tooltip="Next image (→)"
              size="sm"
            />
          </>
        )}

        {images.length === 1 && currentImage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMetadataModal(true)}
              className="flex items-center gap-2 hover:bg-dark-700 rounded-md px-2 py-1 transition-colors group"
            >
              <span className="text-sm text-gray-400 truncate max-w-48 group-hover:text-white" title={currentImage.fileName}>
                {currentImage.fileName}
              </span>
              <InfoIcon className="w-3.5 h-3.5 text-gray-500 group-hover:text-maroon opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <StarRating
              rating={currentImage.rating || 0}
              onRatingChange={(rating) => setImageRating(currentImageIndex, rating)}
              size="sm"
            />
          </div>
        )}

        <div className="h-6 w-px bg-dark-500 mx-2" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <IconButton
            icon={<UndoIcon />}
            onClick={undo}
            disabled={!canUndo()}
            tooltip="Undo (Cmd+Z)"
            size="sm"
          />
          <IconButton
            icon={<RedoIcon />}
            onClick={redo}
            disabled={!canRedo()}
            tooltip="Redo (Cmd+Shift+Z)"
            size="sm"
          />
        </div>
      </div>

      {/* Right: View actions */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<ZoomOutIcon />}
          onClick={handleZoomOut}
          tooltip="Zoom out"
          size="sm"
        />
        <span className="text-xs text-gray-400 w-12 text-center tabular-nums font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton
          icon={<ZoomInIcon />}
          onClick={handleZoomIn}
          tooltip="Zoom in"
          size="sm"
        />
        <IconButton
          icon={<FitIcon />}
          onClick={handleFit}
          tooltip="Fit to view"
          size="sm"
        />

        <div className="h-6 w-px bg-dark-500 mx-2" />

        <IconButton
          icon={<CompareIcon />}
          onClick={toggleBeforeAfter}
          active={showBeforeAfter}
          tooltip="Before/After (Y)"
          size="sm"
        />
      </div>

      {/* Image Metadata Modal */}
      <ImageMetadataModal
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </header>
  )
}

// Icons
function ImportIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

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

function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
