'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Header } from '@/components/layout/Header'
import { RightPanel } from '@/components/layout/RightPanel'
import { MainCanvas } from '@/components/layout/MainCanvas'
import { Filmstrip } from '@/components/layout/Filmstrip'
import { FilterBar } from '@/components/layout/FilterBar'
import { GridView } from '@/components/layout/GridView'

export default function EditorPage() {
  const isHydrating = useEditorStore((state) => state.isHydrating)
  const hydrateFromDB = useEditorStore((state) => state.hydrateFromDB)
  const images = useEditorStore((state) => state.images)
  const toggleBeforeAfter = useEditorStore((state) => state.toggleBeforeAfter)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)
  const setCurrentImage = useEditorStore((state) => state.setCurrentImage)
  const setImageRating = useEditorStore((state) => state.setImageRating)
  const setImageFlag = useEditorStore((state) => state.setImageFlag)
  const filterFlag = useEditorStore((state) => state.filterFlag)
  const filterRating = useEditorStore((state) => state.filterRating)
  const viewMode = useEditorStore((state) => state.viewMode)
  const setViewMode = useEditorStore((state) => state.setViewMode)
  const requestAIInputFocus = useEditorStore((state) => state.requestAIInputFocus)

  const hasImages = images.length > 0
  const isFilterActive = filterFlag !== 'all' || filterRating > 0

  // Compute filtered images list with original indices
  const filteredImages = useMemo(() => {
    return images
      .map((img, idx) => ({ img, idx }))
      .filter(({ img }) => {
        if (filterFlag !== 'all') {
          if (filterFlag === 'unflagged' && img.flagStatus !== 'none') return false
          if (filterFlag === 'picked' && img.flagStatus !== 'picked') return false
          if (filterFlag === 'rejected' && img.flagStatus !== 'rejected') return false
        }
        if (filterRating > 0 && img.rating < filterRating) return false
        return true
      })
  }, [images, filterFlag, filterRating])

  const hasFilteredImages = filteredImages.length > 0

  // Whether the current image passes the active filter
  const currentImagePassesFilter = useMemo(() => {
    return filteredImages.some(({ idx }) => idx === currentImageIndex)
  }, [filteredImages, currentImageIndex])

  // Filter-aware next/previous navigation
  const nextFilteredImage = useCallback(() => {
    const currentPos = filteredImages.findIndex(({ idx }) => idx === currentImageIndex)
    if (currentPos < filteredImages.length - 1) {
      setCurrentImage(filteredImages[currentPos + 1].idx)
    } else if (currentPos === -1 && filteredImages.length > 0) {
      // Current image not in filter — jump to first filtered image after current
      const next = filteredImages.find(({ idx }) => idx > currentImageIndex)
      if (next) setCurrentImage(next.idx)
      else setCurrentImage(filteredImages[0].idx)
    }
  }, [filteredImages, currentImageIndex, setCurrentImage])

  const previousFilteredImage = useCallback(() => {
    const currentPos = filteredImages.findIndex(({ idx }) => idx === currentImageIndex)
    if (currentPos > 0) {
      setCurrentImage(filteredImages[currentPos - 1].idx)
    } else if (currentPos === -1 && filteredImages.length > 0) {
      // Current image not in filter — jump to last filtered image before current
      const prev = [...filteredImages].reverse().find(({ idx }) => idx < currentImageIndex)
      if (prev) setCurrentImage(prev.idx)
      else setCurrentImage(filteredImages[filteredImages.length - 1].idx)
    }
  }, [filteredImages, currentImageIndex, setCurrentImage])

  // When filter changes and current image no longer passes, jump to nearest filtered image
  useEffect(() => {
    if (images.length === 0 || filteredImages.length === 0) return
    if (currentImagePassesFilter) return

    // Find the nearest filtered image to the current index
    let bestIdx = filteredImages[0].idx
    let bestDist = Math.abs(bestIdx - currentImageIndex)
    for (const { idx } of filteredImages) {
      const dist = Math.abs(idx - currentImageIndex)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = idx
      }
    }
    setCurrentImage(bestIdx)
  }, [currentImagePassesFilter, filteredImages, currentImageIndex, images.length, setCurrentImage])

  // Hydrate session from IndexedDB on mount
  useEffect(() => {
    hydrateFromDB()
  }, [hydrateFromDB])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (!hasImages) return

      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault()
        toggleBeforeAfter()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }

      if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        previousFilteredImage()
      }
      if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        nextFilteredImage()
      }

      if (['0', '1', '2', '3', '4', '5'].includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const rating = parseInt(e.key, 10)
        setImageRating(currentImageIndex, rating)
      }

      if (e.key === 'p' || e.key === 'P') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          const currentImage = useEditorStore.getState().images[currentImageIndex]
          if (currentImage) {
            setImageFlag(currentImageIndex, currentImage.flagStatus === 'picked' ? 'none' : 'picked')
          }
        }
      }

      if (e.key === 'x' || e.key === 'X') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          const currentImage = useEditorStore.getState().images[currentImageIndex]
          if (currentImage) {
            setImageFlag(currentImageIndex, currentImage.flagStatus === 'rejected' ? 'none' : 'rejected')
          }
        }
      }

      if (e.key === 'u' || e.key === 'U') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          setImageFlag(currentImageIndex, 'none')
        }
      }

      if (e.key === 'g' || e.key === 'G') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault()
          setViewMode(viewMode === 'edit' ? 'grid' : 'edit')
        }
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        requestAIInputFocus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasImages, toggleBeforeAfter, undo, redo, nextFilteredImage, previousFilteredImage, currentImageIndex, setImageRating, setImageFlag, viewMode, setViewMode, requestAIInputFocus])

  if (isHydrating) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-dark-900">
        <div className="text-dark-400 text-sm">Restoring session...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
      <Header />

      {hasImages && <FilterBar />}

      {viewMode === 'grid' && hasImages ? (
        <GridView />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {isFilterActive && hasImages && !hasFilteredImages ? (
              <div className="flex-1 flex items-center justify-center bg-dark-900">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                  <p className="text-sm text-gray-600">No images match the current filters</p>
                </div>
              </div>
            ) : (
              <MainCanvas />
            )}
            <Filmstrip />
          </div>
          <RightPanel />
        </div>
      )}

    </div>
  )
}
