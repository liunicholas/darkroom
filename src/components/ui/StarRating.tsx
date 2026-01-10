'use client'

import { useCallback } from 'react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

export function StarRating({ rating, onRatingChange, size = 'md', readonly = false }: StarRatingProps) {
  const handleClick = useCallback((index: number) => {
    if (readonly || !onRatingChange) return

    // If clicking the same star that's already the rating, clear it
    const newRating = rating === index + 1 ? 0 : index + 1
    onRatingChange(newRating)
  }, [rating, onRatingChange, readonly])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (readonly || !onRatingChange) return

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const newRating = rating === index + 1 ? 0 : index + 1
      onRatingChange(newRating)
    }
  }, [rating, onRatingChange, readonly])

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1',
  }

  return (
    <div className={`flex items-center ${gapClasses[size]}`} role="group" aria-label="Star rating">
      {[0, 1, 2, 3, 4].map((index) => {
        const isFilled = index < rating

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={readonly}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer'}
              ${!readonly && 'hover:scale-110 active:scale-95'}
              transition-transform duration-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-maroon rounded
            `}
            aria-label={`${index + 1} star${index !== 0 ? 's' : ''}`}
          >
            <svg
              className={`${sizeClasses[size]} ${
                isFilled ? 'text-yellow-400' : 'text-gray-600'
              } ${!readonly && !isFilled && 'hover:text-gray-500'} transition-colors`}
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
