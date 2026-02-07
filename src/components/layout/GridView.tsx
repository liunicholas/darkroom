'use client'

import { useCallback, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { StarRating } from '@/components/ui/StarRating'

export function GridView() {
  const images = useEditorStore((state) => state.images)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)
  const setCurrentImage = useEditorStore((state) => state.setCurrentImage)
  const setViewMode = useEditorStore((state) => state.setViewMode)
  const setImageRating = useEditorStore((state) => state.setImageRating)
  const setImageFlag = useEditorStore((state) => state.setImageFlag)
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

  const handleImageClick = useCallback((imageId: string) => {
    const index = images.findIndex((img) => img.id === imageId)
    if (index >= 0) {
      setCurrentImage(index)
      setViewMode('edit')
    }
  }, [images, setCurrentImage, setViewMode])

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-dark-900">
      {filteredImages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p className="text-sm">No images match the current filters</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filteredImages.map((image) => {
            const originalIndex = images.findIndex((img) => img.id === image.id)
            const isSelected = originalIndex === currentImageIndex

            return (
              <div
                key={image.id}
                onClick={() => handleImageClick(image.id)}
                className={`
                  group relative rounded-lg overflow-hidden cursor-pointer
                  transition-all duration-200 ease-out
                  ${isSelected
                    ? 'ring-2 ring-maroon ring-offset-2 ring-offset-dark-900'
                    : 'hover:ring-1 hover:ring-dark-400'
                  }
                `}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-dark-800 overflow-hidden">
                  {image.thumbnail ? (
                    <img
                      src={image.thumbnail}
                      alt={image.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Flag badge */}
                  {image.flagStatus === 'picked' && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {image.flagStatus === 'rejected' && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}

                  {/* Image number */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-mono">
                    {originalIndex + 1}
                  </div>
                </div>

                {/* Info bar */}
                <div className="p-2 bg-dark-800">
                  <p className="text-xs text-gray-300 truncate mb-1" title={image.fileName}>
                    {image.fileName}
                  </p>
                  <div className="flex items-center justify-between">
                    <StarRating
                      rating={image.rating}
                      onRatingChange={(rating) => setImageRating(originalIndex, rating)}
                      size="sm"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setImageFlag(originalIndex, image.flagStatus === 'picked' ? 'none' : 'picked')
                        }}
                        className={`p-0.5 rounded transition-colors ${
                          image.flagStatus === 'picked' ? 'text-green-400' : 'text-gray-600 hover:text-green-400'
                        }`}
                        title="Pick (P)"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setImageFlag(originalIndex, image.flagStatus === 'rejected' ? 'none' : 'rejected')
                        }}
                        className={`p-0.5 rounded transition-colors ${
                          image.flagStatus === 'rejected' ? 'text-red-400' : 'text-gray-600 hover:text-red-400'
                        }`}
                        title="Reject (X)"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
