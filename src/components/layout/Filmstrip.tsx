'use client'

import { useCallback, useRef, useEffect, useMemo, useState } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Modal } from '@/components/ui/Modal'

export function Filmstrip() {
  const images = useEditorStore((state) => state.images)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)
  const setCurrentImage = useEditorStore((state) => state.setCurrentImage)
  const removeImage = useEditorStore((state) => state.removeImage)
  const clearAllImages = useEditorStore((state) => state.clearAllImages)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const showFilmstrip = useEditorStore((state) => state.showFilmstrip)
  const toggleFilmstrip = useEditorStore((state) => state.toggleFilmstrip)
  const isLoadingImages = useEditorStore((state) => state.isLoadingImages)
  const loadingProgress = useEditorStore((state) => state.loadingProgress)
  const filterFlag = useEditorStore((state) => state.filterFlag)
  const filterRating = useEditorStore((state) => state.filterRating)

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (filterFlag !== 'all') {
        if (filterFlag === 'unflagged' && img.flagStatus !== 'none') return false
        if (filterFlag === 'picked' && img.flagStatus !== 'picked') return false
        if (filterFlag === 'rejected' && img.flagStatus !== 'rejected') return false
      }
      if (filterRating > 0 && img.rating < filterRating) return false
      return true
    })
  }, [images, filterFlag, filterRating])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to current image when it changes
  useEffect(() => {
    if (scrollContainerRef.current && currentImageIndex >= 0) {
      const currentImg = images[currentImageIndex]
      if (!currentImg) return
      const filteredIdx = filteredImages.findIndex((img) => img.id === currentImg.id)
      if (filteredIdx < 0) return
      const container = scrollContainerRef.current
      const thumbnails = container.querySelectorAll('[data-thumbnail]')
      const currentThumb = thumbnails[filteredIdx] as HTMLElement
      if (currentThumb) {
        currentThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentImageIndex, images, filteredImages])

  const handleImageClick = useCallback((imageId: string) => {
    const index = images.findIndex((img) => img.id === imageId)
    if (index >= 0) {
      setCurrentImage(index)
    }
  }, [images, setCurrentImage])

  const handleRemoveImage = useCallback((e: React.MouseEvent, imageId: string) => {
    e.stopPropagation()
    const index = images.findIndex((img) => img.id === imageId)
    if (index >= 0) {
      removeImage(index)
    }
  }, [images, removeImage])

  if (images.length === 0) {
    return (
      <div className="bg-dark-900 border-t border-dark-500 h-36">
        <div className="flex items-center h-full px-4">
          <label className="flex-shrink-0 w-24 h-24 rounded-md border-2 border-dashed border-dark-500 hover:border-accent cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-accent transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px]">Import</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  useEditorStore.getState().loadImages(files)
                }
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>
    )
  }

  // Number of loading skeleton placeholders
  const skeletonCount = isLoadingImages
    ? Math.max(0, loadingProgress.total - loadingProgress.current)
    : 0

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={toggleFilmstrip}
        className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-dark-800 hover:bg-dark-700 border border-dark-500 rounded-t-lg text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
      >
        <svg
          className={`w-3 h-3 transition-transform ${showFilmstrip ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span>{filteredImages.length} / {images.length} {images.length === 1 ? 'image' : 'images'}</span>
      </button>

      {/* Filmstrip container */}
      <div
        className={`bg-dark-900 border-t border-dark-500 transition-all duration-300 ease-out overflow-hidden ${
          showFilmstrip ? 'h-36' : 'h-0'
        }`}
      >
        {/* Loading progress bar */}
        {isLoadingImages && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-dark-700 z-10">
            <div
              className="h-full bg-gradient-to-r from-maroon to-maroon-light transition-all duration-300"
              style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
            />
          </div>
        )}

        {/* Thumbnails container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 px-4 py-3 overflow-x-auto custom-scrollbar"
          style={{ scrollbarWidth: 'thin' }}
        >
          {filteredImages.map((image) => {
            const originalIndex = images.findIndex((img) => img.id === image.id)
            const isSelected = originalIndex === currentImageIndex

            return (
              <div
                key={image.id}
                data-thumbnail
                onClick={() => handleImageClick(image.id)}
                className={`
                  relative flex-shrink-0 cursor-pointer group
                  transition-all duration-200 ease-out
                  ${isSelected
                    ? 'ring-2 ring-maroon ring-offset-2 ring-offset-dark-900 scale-105'
                    : image.flagStatus === 'rejected'
                      ? 'opacity-40 hover:opacity-70 hover:scale-102'
                      : 'opacity-70 hover:opacity-100 hover:scale-102'
                  }
                `}
              >
                {/* Thumbnail image */}
                <div className="relative w-24 h-24 rounded-md overflow-hidden bg-dark-800">
                  {image.thumbnail ? (
                    <img
                      src={image.thumbnail}
                      alt={image.fileName}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Flag badge */}
                  {image.flagStatus === 'picked' && (
                    <div className="absolute top-1 left-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {image.flagStatus === 'rejected' && (
                    <div className="absolute top-1 left-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}

                  {/* Image number badge */}
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-mono">
                    {originalIndex + 1}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemoveImage(e, image.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Rating and filename */}
                <div className="absolute -bottom-6 left-0 right-0 flex flex-col items-center gap-0.5">
                  {image.rating > 0 && (
                    <div className="flex">
                      {[...Array(image.rating)].map((_, i) => (
                        <svg key={i} className="w-2 h-2 text-yellow-400 fill-current" viewBox="0 0 24 24">
                          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  <span className="text-[9px] text-gray-500 truncate block px-1 max-w-24" title={image.fileName}>
                    {image.fileName.length > 14 ? image.fileName.slice(0, 12) + '...' : image.fileName}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Loading skeleton placeholders */}
          {Array.from({ length: Math.min(skeletonCount, 10) }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex-shrink-0">
              <div className="w-24 h-24 rounded-md bg-dark-700 animate-pulse" />
            </div>
          ))}

          {/* Add more images button */}
          <label className="flex-shrink-0 w-24 h-24 rounded-md border-2 border-dashed border-dark-500 hover:border-accent cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-accent transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px]">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  useEditorStore.getState().loadImages(files)
                }
                e.target.value = ''
              }}
            />
          </label>

          {/* Clear images button — only shown when there are filtered images */}
          {filteredImages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex-shrink-0 w-24 h-24 rounded-md border-2 border-dashed border-dark-500 hover:border-red-500 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-red-400 transition-colors"
              title={filteredImages.length === images.length ? 'Clear all images' : 'Clear filtered images'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span className="text-[10px]">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Clear confirmation modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title={filteredImages.length === images.length ? 'Clear All Images' : 'Clear Filtered Images'}
        size="sm"
      >
        <p className="text-sm text-gray-300 mb-4">
          Remove {filteredImages.length === images.length ? 'all ' : ''}{filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'} and {filteredImages.length === 1 ? 'its' : 'their'} edits? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowClearConfirm(false)}
            className="px-4 py-2 text-xs rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (filteredImages.length === images.length) {
                clearAllImages()
              } else {
                // Remove filtered images by index in descending order to avoid index shifting
                const indices = filteredImages
                  .map((img) => images.findIndex((i) => i.id === img.id))
                  .filter((idx) => idx >= 0)
                  .sort((a, b) => b - a)
                for (const idx of indices) {
                  removeImage(idx)
                }
              }
              setShowClearConfirm(false)
            }}
            className="px-4 py-2 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
          >
            Clear {filteredImages.length === images.length ? 'All' : `${filteredImages.length}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}
