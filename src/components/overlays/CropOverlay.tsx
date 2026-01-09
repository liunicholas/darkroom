'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'

interface CropOverlayProps {
  imageDisplay: { x: number; y: number; width: number; height: number }
  containerRef: React.RefObject<HTMLDivElement>
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move'

export function CropOverlay({ imageDisplay, containerRef }: CropOverlayProps) {
  const crop = useEditorStore((state) => state.editState.crop)
  const setCrop = useEditorStore((state) => state.setCrop)
  const pushHistory = useEditorStore((state) => state.pushHistory)
  const imageSource = useEditorStore((state) => state.imageSource)

  const [dragging, setDragging] = useState<HandleType | null>(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startCropRef = useRef({ x: 0, y: 0, width: 1, height: 1 })

  // Calculate crop rectangle in screen coordinates
  const cropRect = {
    left: imageDisplay.x + crop.x * imageDisplay.width,
    top: imageDisplay.y + crop.y * imageDisplay.height,
    width: crop.width * imageDisplay.width,
    height: crop.height * imageDisplay.height,
  }

  // Get the target aspect ratio for the crop (in pixel terms)
  const getAspectRatio = useCallback(() => {
    if (!crop.aspectRatio) return null
    if (crop.aspectRatio === 'original' && imageSource?.proxyBitmap) {
      return imageSource.proxyBitmap.width / imageSource.proxyBitmap.height
    }
    const [w, h] = crop.aspectRatio.split(':').map(Number)
    if (w && h) return w / h
    return null
  }, [crop.aspectRatio, imageSource])

  // Get the image's aspect ratio
  const imageAspect = imageSource?.proxyBitmap
    ? imageSource.proxyBitmap.width / imageSource.proxyBitmap.height
    : 1

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: HandleType) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(handle)
    startPosRef.current = { x: e.clientX, y: e.clientY }
    startCropRef.current = { x: crop.x, y: crop.y, width: crop.width, height: crop.height }
  }, [crop])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !containerRef.current) return

    const dx = (e.clientX - startPosRef.current.x) / imageDisplay.width
    const dy = (e.clientY - startPosRef.current.y) / imageDisplay.height

    let newX = startCropRef.current.x
    let newY = startCropRef.current.y
    let newWidth = startCropRef.current.width
    let newHeight = startCropRef.current.height

    const aspectRatio = getAspectRatio()

    if (dragging === 'move') {
      newX = Math.max(0, Math.min(1 - newWidth, startCropRef.current.x + dx))
      newY = Math.max(0, Math.min(1 - newHeight, startCropRef.current.y + dy))
    } else {
      // Handle resizing based on which handle is being dragged
      switch (dragging) {
        case 'nw':
          newX = startCropRef.current.x + dx
          newY = startCropRef.current.y + dy
          newWidth = startCropRef.current.width - dx
          newHeight = startCropRef.current.height - dy
          break
        case 'n':
          newY = startCropRef.current.y + dy
          newHeight = startCropRef.current.height - dy
          break
        case 'ne':
          newY = startCropRef.current.y + dy
          newWidth = startCropRef.current.width + dx
          newHeight = startCropRef.current.height - dy
          break
        case 'e':
          newWidth = startCropRef.current.width + dx
          break
        case 'se':
          newWidth = startCropRef.current.width + dx
          newHeight = startCropRef.current.height + dy
          break
        case 's':
          newHeight = startCropRef.current.height + dy
          break
        case 'sw':
          newX = startCropRef.current.x + dx
          newWidth = startCropRef.current.width - dx
          newHeight = startCropRef.current.height + dy
          break
        case 'w':
          newX = startCropRef.current.x + dx
          newWidth = startCropRef.current.width - dx
          break
      }

      // Maintain aspect ratio if set
      // Note: We need to account for image dimensions since crop uses normalized coords
      // targetAspect = (newWidth * imageWidth) / (newHeight * imageHeight)
      // So: newWidth = newHeight * targetAspect / imageAspect
      if (aspectRatio) {
        const normalizedRatio = aspectRatio / imageAspect
        if (['n', 's'].includes(dragging)) {
          newWidth = newHeight * normalizedRatio
        } else if (['e', 'w'].includes(dragging)) {
          newHeight = newWidth / normalizedRatio
        } else {
          // Corner handles - maintain aspect ratio based on which direction changed more
          const widthRatio = newWidth / startCropRef.current.width
          const heightRatio = newHeight / startCropRef.current.height
          if (Math.abs(widthRatio - 1) > Math.abs(heightRatio - 1)) {
            newHeight = newWidth / normalizedRatio
          } else {
            newWidth = newHeight * normalizedRatio
          }
        }
      }

      // Constrain to image bounds
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)
      newWidth = Math.max(0.05, Math.min(1 - newX, newWidth))
      newHeight = Math.max(0.05, Math.min(1 - newY, newHeight))
    }

    setCrop({ x: newX, y: newY, width: newWidth, height: newHeight })
  }, [dragging, containerRef, imageDisplay, setCrop, getAspectRatio, imageAspect])

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      pushHistory('Adjust crop')
    }
    setDragging(null)
  }, [dragging, pushHistory])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  // Apply aspect ratio immediately when it changes
  useEffect(() => {
    const aspectRatio = getAspectRatio()
    if (!aspectRatio) return

    // Calculate the normalized ratio (accounts for image aspect)
    const normalizedRatio = aspectRatio / imageAspect

    // Current crop dimensions
    const { x, y, width, height } = crop

    // Calculate the center of the current crop
    const centerX = x + width / 2
    const centerY = y + height / 2

    // Calculate new dimensions that maintain the aspect ratio
    // while staying as close to the current size as possible
    let newWidth = width
    let newHeight = height

    // Current normalized aspect ratio of crop
    const currentRatio = width / height

    if (currentRatio > normalizedRatio) {
      // Current crop is too wide, adjust width
      newWidth = height * normalizedRatio
    } else {
      // Current crop is too tall, adjust height
      newHeight = width / normalizedRatio
    }

    // Re-center the crop
    let newX = centerX - newWidth / 2
    let newY = centerY - newHeight / 2

    // Constrain to image bounds
    if (newX < 0) newX = 0
    if (newY < 0) newY = 0
    if (newX + newWidth > 1) newX = 1 - newWidth
    if (newY + newHeight > 1) newY = 1 - newHeight

    // Make sure crop still fits after adjustments
    if (newWidth > 1) {
      newWidth = 1
      newHeight = newWidth / normalizedRatio
      newX = 0
    }
    if (newHeight > 1) {
      newHeight = 1
      newWidth = newHeight * normalizedRatio
      newY = 0
    }

    // Only update if significantly different
    if (Math.abs(width - newWidth) > 0.001 || Math.abs(height - newHeight) > 0.001) {
      setCrop({ x: newX, y: newY, width: newWidth, height: newHeight })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop.aspectRatio, getAspectRatio, imageAspect, setCrop]) // Intentionally exclude crop.x/y/width/height

  // Handle cursors for each resize handle
  const getCursor = (handle: HandleType): string => {
    const cursors: Record<HandleType, string> = {
      nw: 'nwse-resize',
      n: 'ns-resize',
      ne: 'nesw-resize',
      e: 'ew-resize',
      se: 'nwse-resize',
      s: 'ns-resize',
      sw: 'nesw-resize',
      w: 'ew-resize',
      move: 'move',
    }
    return cursors[handle]
  }

  const handleSize = 10

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Darkened areas outside crop */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="crop-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={cropRect.left}
              y={cropRect.top}
              width={cropRect.width}
              height={cropRect.height}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#crop-mask)"
        />
      </svg>

      {/* Crop border */}
      <div
        className="absolute border-2 border-white shadow-lg pointer-events-auto cursor-move"
        style={{
          left: cropRect.left,
          top: cropRect.top,
          width: cropRect.width,
          height: cropRect.height,
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Rule of thirds grid */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          {/* Vertical lines */}
          <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          {/* Horizontal lines */}
          <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>
      </div>

      {/* Corner handles */}
      {(['nw', 'ne', 'se', 'sw'] as const).map((handle) => {
        const isTop = handle.includes('n')
        const isLeft = handle.includes('w')
        return (
          <div
            key={handle}
            className="absolute bg-white border-2 border-maroon shadow-lg pointer-events-auto"
            style={{
              left: isLeft ? cropRect.left - handleSize / 2 : cropRect.left + cropRect.width - handleSize / 2,
              top: isTop ? cropRect.top - handleSize / 2 : cropRect.top + cropRect.height - handleSize / 2,
              width: handleSize,
              height: handleSize,
              cursor: getCursor(handle),
            }}
            onMouseDown={(e) => handleMouseDown(e, handle)}
          />
        )
      })}

      {/* Edge handles */}
      {(['n', 'e', 's', 'w'] as const).map((handle) => {
        const isHorizontal = handle === 'n' || handle === 's'
        const handleWidth = isHorizontal ? 40 : handleSize
        const handleHeight = isHorizontal ? handleSize : 40

        let left, top
        switch (handle) {
          case 'n':
            left = cropRect.left + cropRect.width / 2 - handleWidth / 2
            top = cropRect.top - handleHeight / 2
            break
          case 's':
            left = cropRect.left + cropRect.width / 2 - handleWidth / 2
            top = cropRect.top + cropRect.height - handleHeight / 2
            break
          case 'w':
            left = cropRect.left - handleWidth / 2
            top = cropRect.top + cropRect.height / 2 - handleHeight / 2
            break
          case 'e':
            left = cropRect.left + cropRect.width - handleWidth / 2
            top = cropRect.top + cropRect.height / 2 - handleHeight / 2
            break
        }

        return (
          <div
            key={handle}
            className="absolute bg-white border border-gray-400 shadow pointer-events-auto rounded-sm"
            style={{
              left,
              top,
              width: handleWidth,
              height: handleHeight,
              cursor: getCursor(handle),
            }}
            onMouseDown={(e) => handleMouseDown(e, handle)}
          />
        )
      })}
    </div>
  )
}
