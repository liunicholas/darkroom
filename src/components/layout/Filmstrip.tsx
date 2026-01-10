'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { StarRating } from '@/components/ui/StarRating'

export function Filmstrip() {
  const images = useEditorStore((state) => state.images)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)
  const setCurrentImage = useEditorStore((state) => state.setCurrentImage)
  const removeImage = useEditorStore((state) => state.removeImage)
  const setImageRating = useEditorStore((state) => state.setImageRating)
  const showFilmstrip = useEditorStore((state) => state.showFilmstrip)
  const toggleFilmstrip = useEditorStore((state) => state.toggleFilmstrip)
  const isLoadingImages = useEditorStore((state) => state.isLoadingImages)
  const loadingProgress = useEditorStore((state) => state.loadingProgress)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to current image when it changes
  useEffect(() => {
    if (scrollContainerRef.current && currentImageIndex >= 0) {
      const container = scrollContainerRef.current
      const thumbnails = container.querySelectorAll('[data-thumbnail]')
      const currentThumb = thumbnails[currentImageIndex] as HTMLElement
      if (currentThumb) {
        currentThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentImageIndex])

  const handleImageClick = useCallback((index: number) => {
    setCurrentImage(index)
  }, [setCurrentImage])

  const handleRemoveImage = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    removeImage(index)
  }, [removeImage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
        setCurrentImage(currentImageIndex - 1)
      } else if (e.key === 'ArrowRight' && currentImageIndex < images.length - 1) {
        setCurrentImage(currentImageIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentImageIndex, images.length, setCurrentImage])

  if (images.length === 0) return null

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
        <span>{images.length} {images.length === 1 ? 'image' : 'images'}</span>
      </button>

      {/* Filmstrip container */}
      <div
        className={`bg-dark-900 border-t border-dark-500 transition-all duration-300 ease-out overflow-hidden ${
          showFilmstrip ? 'h-28' : 'h-0'
        }`}
      >
        {/* Loading progress bar */}
        {isLoadingImages && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-dark-700">
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
          {images.map((image, index) => (
            <div
              key={image.id}
              data-thumbnail
              onClick={() => handleImageClick(index)}
              className={`
                relative flex-shrink-0 cursor-pointer group
                transition-all duration-200 ease-out
                ${index === currentImageIndex
                  ? 'ring-2 ring-maroon ring-offset-2 ring-offset-dark-900 scale-105'
                  : 'opacity-70 hover:opacity-100 hover:scale-102'
                }
              `}
            >
              {/* Thumbnail image */}
              <div className="relative w-20 h-20 rounded-md overflow-hidden bg-dark-800">
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

                {/* Image number badge */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-mono">
                  {index + 1}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => handleRemoveImage(e, index)}
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
                <span className="text-[9px] text-gray-500 truncate block px-1 max-w-20" title={image.fileName}>
                  {image.fileName.length > 12 ? image.fileName.slice(0, 10) + '...' : image.fileName}
                </span>
              </div>
            </div>
          ))}

          {/* Add more images button */}
          <label className="flex-shrink-0 w-20 h-20 rounded-md border-2 border-dashed border-dark-500 hover:border-accent cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-accent transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px]">Add</span>
            <input
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
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
    </div>
  )
}
