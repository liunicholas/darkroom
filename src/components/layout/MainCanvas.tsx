'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { WebGLRenderer } from '@/lib/webgl/WebGLRenderer'
import { Canvas2DRenderer } from '@/lib/webgl/Canvas2DRenderer'
import { BrushEngine } from '@/lib/masking/BrushEngine'
import { generateRadialGradientMask, generateLinearGradientMask } from '@/lib/masking/GradientMask'
import { RadialGradientHandles, LinearGradientHandles } from '@/components/overlays/GradientHandles'
import { CropOverlay } from '@/components/overlays/CropOverlay'
import type { RadialGradientData, LinearGradientData } from '@/types/edit-state'

export function MainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<WebGLRenderer | Canvas2DRenderer | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const editedImageRef = useRef<ImageBitmap | null>(null)
  const animationFrameRef = useRef<number>(0)
  const brushEnginesRef = useRef<Map<string, BrushEngine>>(new Map())
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [webglError, setWebglError] = useState<string | null>(null)
  const [splitPosition, setSplitPosition] = useState(0.5) // 0-1, position of split line
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const [isHoveringSplit, setIsHoveringSplit] = useState(false)
  const [isBrushPainting, setIsBrushPainting] = useState(false)
  const [showMaskOverlay, setShowMaskOverlay] = useState(true)
  const [brushCursorPos, setBrushCursorPos] = useState<{ x: number; y: number } | null>(null)

  const {
    imageSource,
    editState,
    zoom,
    panOffset,
    setZoom,
    setPanOffset,
    showHistogram,
    showBeforeAfter,
  } = useEditorStore()

  const activeTool = useEditorStore((state) => state.activeTool)
  const brushSettings = useEditorStore((state) => state.brushSettings)
  const activeMaskId = useEditorStore((state) => state.editState.activeMaskId)
  const masks = useEditorStore((state) => state.editState.masks)
  const crop = useEditorStore((state) => state.editState.crop)
  const pushHistory = useEditorStore((state) => state.pushHistory)

  // Clear display canvas when there's no image to show
  useEffect(() => {
    if (!imageSource?.proxyBitmap) {
      const displayCanvas = canvasRef.current
      if (displayCanvas) {
        const ctx = displayCanvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#121212'
          ctx.fillRect(0, 0, displayCanvas.width, displayCanvas.height)
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      offscreenCanvasRef.current = null
      editedImageRef.current = null
    }
  }, [imageSource])

  // Initialize offscreen canvas and renderer (WebGL2 with Canvas2D fallback)
  useEffect(() => {
    if (!imageSource?.proxyBitmap) return

    // Create offscreen canvas at image resolution
    const offscreen = document.createElement('canvas')
    offscreen.width = imageSource.proxyBitmap.width
    offscreen.height = imageSource.proxyBitmap.height
    offscreenCanvasRef.current = offscreen

    // Try WebGL2 first, fall back to Canvas2D
    try {
      const renderer = new WebGLRenderer(offscreen)
      renderer.setImage(imageSource.proxyBitmap)
      rendererRef.current = renderer
      setWebglError(null)
    } catch {
      try {
        // Canvas2D fallback — recreate offscreen canvas since the failed
        // webgl2 getContext call taints it for 2d use
        const fallbackCanvas = document.createElement('canvas')
        fallbackCanvas.width = imageSource.proxyBitmap.width
        fallbackCanvas.height = imageSource.proxyBitmap.height
        offscreenCanvasRef.current = fallbackCanvas

        const fallback = new Canvas2DRenderer(fallbackCanvas)
        fallback.setImage(imageSource.proxyBitmap)
        rendererRef.current = fallback
        setWebglError(null)
        console.warn('WebGL2 not available, using Canvas2D fallback (some effects will be limited)')
      } catch (error) {
        console.error('All renderers failed:', error)
        setWebglError('Could not initialize any rendering backend')
      }
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      offscreenCanvasRef.current = null
      editedImageRef.current = null
    }
  }, [imageSource])

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Calculate image display dimensions (maintains aspect ratio)
  const imageDisplay = useMemo(() => {
    if (!imageSource?.proxyBitmap || canvasSize.width === 0 || canvasSize.height === 0) {
      return null
    }

    const img = imageSource.proxyBitmap

    // When crop tool is active, show full image
    // When crop is applied, use cropped region's aspect ratio
    let imgAspect: number
    if (activeTool === 'crop') {
      // Show full image while editing crop
      imgAspect = img.width / img.height
    } else {
      // Use cropped region's aspect ratio
      // Cropped pixel dimensions: (crop.width * img.width) x (crop.height * img.height)
      const croppedPixelWidth = crop.width * img.width
      const croppedPixelHeight = crop.height * img.height
      imgAspect = croppedPixelWidth / croppedPixelHeight
    }

    const containerAspect = canvasSize.width / canvasSize.height

    let displayWidth: number
    let displayHeight: number

    // Fit image within container while maintaining aspect ratio
    if (imgAspect > containerAspect) {
      // Image is wider than container - fit to width
      displayWidth = canvasSize.width * 0.9
      displayHeight = displayWidth / imgAspect
    } else {
      // Image is taller than container - fit to height
      displayHeight = canvasSize.height * 0.9
      displayWidth = displayHeight * imgAspect
    }

    // Apply zoom
    displayWidth *= zoom
    displayHeight *= zoom

    // Center image with pan offset
    const x = (canvasSize.width - displayWidth) / 2 + panOffset.x
    const y = (canvasSize.height - displayHeight) / 2 + panOffset.y

    return { x, y, width: displayWidth, height: displayHeight }
  }, [imageSource, canvasSize, zoom, panOffset, activeTool, crop.width, crop.height])

  // Convert screen coordinates to image coordinates
  const screenToImage = useCallback((screenX: number, screenY: number): { x: number; y: number } | null => {
    if (!imageDisplay || !imageSource?.proxyBitmap || !containerRef.current) return null

    const rect = containerRef.current.getBoundingClientRect()
    const canvasX = screenX - rect.left
    const canvasY = screenY - rect.top

    // Check if within image bounds
    const relX = (canvasX - imageDisplay.x) / imageDisplay.width
    const relY = (canvasY - imageDisplay.y) / imageDisplay.height

    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null

    return {
      x: relX * imageSource.proxyBitmap.width,
      y: relY * imageSource.proxyBitmap.height,
    }
  }, [imageDisplay, imageSource])

  // Get or create brush engine for a mask
  const getBrushEngine = useCallback((maskId: string): BrushEngine | null => {
    if (!imageSource?.proxyBitmap) return null

    if (!brushEnginesRef.current.has(maskId)) {
      brushEnginesRef.current.set(
        maskId,
        new BrushEngine(imageSource.proxyBitmap.width, imageSource.proxyBitmap.height)
      )
    }

    return brushEnginesRef.current.get(maskId) || null
  }, [imageSource])

  // Render edited image to offscreen canvas, then composite to display canvas
  useEffect(() => {
    const renderer = rendererRef.current
    const offscreen = offscreenCanvasRef.current
    const displayCanvas = canvasRef.current
    if (!renderer || !offscreen || !displayCanvas || !imageSource?.proxyBitmap || !imageDisplay) return

    const ctx = displayCanvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Cancel previous frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Check if we should apply crop (only when crop tool is not active)
    const shouldApplyCrop = activeTool !== 'crop'

    // Helper function to draw image with optional crop, rotation, and flip transforms
    const drawTransformedImage = (
      source: CanvasImageSource,
      destX: number,
      destY: number,
      destWidth: number,
      destHeight: number
    ) => {
      ctx.save()

      // Get source dimensions
      const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : (source as HTMLCanvasElement | HTMLImageElement | ImageBitmap).width
      const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : (source as HTMLCanvasElement | HTMLImageElement | ImageBitmap).height

      // Move to center of where image will be drawn
      const centerX = destX + destWidth / 2
      const centerY = destY + destHeight / 2
      ctx.translate(centerX, centerY)

      // Apply rotation (always apply when non-zero)
      if (crop.rotation !== 0) {
        ctx.rotate((crop.rotation * Math.PI) / 180)
      }

      // Apply flips (always apply)
      const scaleX = crop.flipHorizontal ? -1 : 1
      const scaleY = crop.flipVertical ? -1 : 1
      if (scaleX !== 1 || scaleY !== 1) {
        ctx.scale(scaleX, scaleY)
      }

      if (shouldApplyCrop && (crop.x !== 0 || crop.y !== 0 || crop.width !== 1 || crop.height !== 1)) {
        // Apply crop: draw only the cropped region
        const srcX = crop.x * sourceWidth
        const srcY = crop.y * sourceHeight
        const srcW = crop.width * sourceWidth
        const srcH = crop.height * sourceHeight

        ctx.drawImage(
          source,
          srcX, srcY, srcW, srcH,  // Source crop region
          -destWidth / 2, -destHeight / 2, destWidth, destHeight  // Destination
        )
      } else {
        // No crop applied: draw full image
        ctx.drawImage(source, -destWidth / 2, -destHeight / 2, destWidth, destHeight)
      }

      ctx.restore()
    }

    const renderFrame = () => {
      // Ensure display canvas matches container size
      if (displayCanvas.width !== canvasSize.width || displayCanvas.height !== canvasSize.height) {
        displayCanvas.width = canvasSize.width
        displayCanvas.height = canvasSize.height
      }

      // Clear display canvas
      ctx.fillStyle = '#121212'
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

      // Render edits to offscreen canvas using WebGL
      renderer.render(editState)

      const { x, y, width, height } = imageDisplay

      if (showBeforeAfter) {
        // Split view: left shows original, right shows edited (position adjustable)
        const splitX = canvasSize.width * splitPosition

        // Draw edited image (full) with transforms
        drawTransformedImage(offscreen, x, y, width, height)

        // Clip to left of split and draw original on top (with transforms)
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, splitX, canvasSize.height)
        ctx.clip()
        if (imageSource.proxyBitmap) {
          drawTransformedImage(imageSource.proxyBitmap, x, y, width, height)
        }
        ctx.restore()

        // Draw split line with handle
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 4
        ctx.beginPath()
        ctx.moveTo(splitX, 0)
        ctx.lineTo(splitX, canvasSize.height)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw handle circle in center
        const handleY = canvasSize.height / 2
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(splitX, handleY, 16, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw arrows on handle
        ctx.fillStyle = '#333333'
        ctx.beginPath()
        // Left arrow
        ctx.moveTo(splitX - 8, handleY)
        ctx.lineTo(splitX - 3, handleY - 4)
        ctx.lineTo(splitX - 3, handleY + 4)
        ctx.closePath()
        ctx.fill()
        // Right arrow
        ctx.beginPath()
        ctx.moveTo(splitX + 8, handleY)
        ctx.lineTo(splitX + 3, handleY - 4)
        ctx.lineTo(splitX + 3, handleY + 4)
        ctx.closePath()
        ctx.fill()

        // Draw labels
        ctx.font = '11px system-ui, sans-serif'
        ctx.textAlign = 'center'

        // Before label (left side) - only show if there's enough room
        if (splitX > 80) {
          const beforeLabelX = splitX / 2
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.beginPath()
          ctx.roundRect(beforeLabelX - 28, canvasSize.height - 32, 56, 22, 4)
          ctx.fill()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fillText('Before', beforeLabelX, canvasSize.height - 17)
        }

        // After label (right side) - only show if there's enough room
        if (canvasSize.width - splitX > 80) {
          const afterLabelX = splitX + (canvasSize.width - splitX) / 2
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.beginPath()
          ctx.roundRect(afterLabelX - 24, canvasSize.height - 32, 48, 22, 4)
          ctx.fill()
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fillText('After', afterLabelX, canvasSize.height - 17)
        }
      } else {
        // Normal view: show edited image with transforms
        drawTransformedImage(offscreen, x, y, width, height)
      }

      // Draw mask overlay (red tint showing masked area)
      if (showMaskOverlay && activeMaskId) {
        const activeMask = masks.find(m => m.id === activeMaskId)
        if (activeMask && activeMask.enabled) {
          ctx.save()

          if (activeMask.type === 'brush') {
            // Draw brush mask overlay
            const engine = brushEnginesRef.current.get(activeMaskId)
            if (engine) {
              const maskCanvas = engine.getMaskCanvas()
              // Create overlay canvas with red tint
              const overlayCanvas = document.createElement('canvas')
              overlayCanvas.width = maskCanvas.width
              overlayCanvas.height = maskCanvas.height
              const overlayCtx = overlayCanvas.getContext('2d')!

              // Draw mask
              overlayCtx.drawImage(maskCanvas, 0, 0)

              // Apply red color with multiply
              overlayCtx.globalCompositeOperation = 'source-in'
              overlayCtx.fillStyle = activeMask.inverted ? 'rgba(100, 180, 255, 0.5)' : 'rgba(255, 100, 100, 0.5)'
              overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height)

              // Draw on main canvas
              ctx.globalAlpha = 0.6
              ctx.drawImage(overlayCanvas, x, y, width, height)
              ctx.globalAlpha = 1
            }
          } else if (activeMask.type === 'radialGradient' && activeMask.gradientData && imageSource?.proxyBitmap) {
            // Draw radial gradient mask overlay
            const gradientMask = generateRadialGradientMask(
              imageSource.proxyBitmap.width,
              imageSource.proxyBitmap.height,
              activeMask.gradientData as RadialGradientData
            )
            const overlayCanvas = document.createElement('canvas')
            overlayCanvas.width = gradientMask.width
            overlayCanvas.height = gradientMask.height
            const overlayCtx = overlayCanvas.getContext('2d')!
            overlayCtx.drawImage(gradientMask, 0, 0)
            overlayCtx.globalCompositeOperation = 'source-in'
            overlayCtx.fillStyle = 'rgba(255, 100, 100, 0.5)'
            overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height)
            ctx.globalAlpha = 0.6
            ctx.drawImage(overlayCanvas, x, y, width, height)
            ctx.globalAlpha = 1
          } else if (activeMask.type === 'linearGradient' && activeMask.gradientData && imageSource?.proxyBitmap) {
            // Draw linear gradient mask overlay
            const gradientMask = generateLinearGradientMask(
              imageSource.proxyBitmap.width,
              imageSource.proxyBitmap.height,
              activeMask.gradientData as LinearGradientData
            )
            const overlayCanvas = document.createElement('canvas')
            overlayCanvas.width = gradientMask.width
            overlayCanvas.height = gradientMask.height
            const overlayCtx = overlayCanvas.getContext('2d')!
            overlayCtx.drawImage(gradientMask, 0, 0)
            overlayCtx.globalCompositeOperation = 'source-in'
            overlayCtx.fillStyle = 'rgba(255, 100, 100, 0.5)'
            overlayCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height)
            ctx.globalAlpha = 0.6
            ctx.drawImage(overlayCanvas, x, y, width, height)
            ctx.globalAlpha = 1
          }

          ctx.restore()
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(renderFrame)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [imageSource, canvasSize, editState, imageDisplay, showBeforeAfter, splitPosition, showMaskOverlay, activeMaskId, masks, isBrushPainting, crop, activeTool])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    // Reduced sensitivity: 3% zoom per scroll step
    const delta = e.deltaY > 0 ? 0.97 : 1.03
    setZoom(zoom * delta)
  }, [zoom, setZoom])

  // Pan handling
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Check if mouse is near the split line
  const isNearSplitLine = useCallback((clientX: number) => {
    if (!showBeforeAfter || !containerRef.current) return false
    const rect = containerRef.current.getBoundingClientRect()
    const splitX = rect.left + canvasSize.width * splitPosition
    return Math.abs(clientX - splitX) < 20
  }, [showBeforeAfter, canvasSize.width, splitPosition])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if clicking on split line
    if (showBeforeAfter && isNearSplitLine(e.clientX)) {
      setIsDraggingSplit(true)
      e.preventDefault()
      return
    }

    // Handle brush painting
    if (activeTool === 'brush' && activeMaskId && e.button === 0 && !e.altKey) {
      const imageCoords = screenToImage(e.clientX, e.clientY)
      if (imageCoords) {
        const engine = getBrushEngine(activeMaskId)
        if (engine) {
          engine.startStroke(imageCoords.x, imageCoords.y, brushSettings)
          setIsBrushPainting(true)
          e.preventDefault()
          return
        }
      }
    }

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
    }
  }, [panOffset, showBeforeAfter, isNearSplitLine, activeTool, activeMaskId, screenToImage, getBrushEngine, brushSettings])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Update brush cursor position
    if (activeTool === 'brush' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setBrushCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    } else {
      setBrushCursorPos(null)
    }

    // Handle split line dragging
    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const newPosition = (e.clientX - rect.left) / canvasSize.width
      setSplitPosition(Math.max(0.05, Math.min(0.95, newPosition)))
      return
    }

    // Handle brush painting
    if (isBrushPainting && activeMaskId) {
      const imageCoords = screenToImage(e.clientX, e.clientY)
      if (imageCoords) {
        const engine = getBrushEngine(activeMaskId)
        if (engine) {
          engine.continueStroke(imageCoords.x, imageCoords.y, brushSettings)
        }
      }
      return
    }

    // Update hover state for split line
    if (showBeforeAfter && !isDraggingSplit) {
      setIsHoveringSplit(isNearSplitLine(e.clientX))
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }, [isPanning, panStart, setPanOffset, isDraggingSplit, canvasSize.width, showBeforeAfter, isNearSplitLine, activeTool, isBrushPainting, activeMaskId, screenToImage, getBrushEngine, brushSettings])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setIsDraggingSplit(false)

    // End brush stroke
    if (isBrushPainting && activeMaskId) {
      const engine = getBrushEngine(activeMaskId)
      if (engine) {
        engine.endStroke()
        pushHistory('Brush stroke')
      }
      setIsBrushPainting(false)
    }
  }, [isBrushPainting, activeMaskId, getBrushEngine, pushHistory])

  // Cursor style based on position
  const getCursorStyle = useCallback(() => {
    if (isDraggingSplit || isHoveringSplit) return 'ew-resize'
    if (isPanning) return 'grabbing'
    if (activeTool === 'brush') return 'none' // Hide default cursor for brush
    if (activeTool === 'radialGradient' || activeTool === 'linearGradient') return 'crosshair'
    return 'default'
  }, [isDraggingSplit, isHoveringSplit, isPanning, activeTool])

  // Calculate brush cursor display size
  const brushDisplaySize = useMemo(() => {
    if (!imageDisplay || !imageSource?.proxyBitmap) return brushSettings.size
    return (brushSettings.size / imageSource.proxyBitmap.width) * imageDisplay.width
  }, [brushSettings.size, imageDisplay, imageSource])

  if (webglError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-900">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-display font-medium text-white mb-2 uppercase tracking-wide">WebGL2 Required</h3>
          <p className="text-gray-400">{webglError}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-dark-900"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: getCursorStyle() }}
      />

      {/* Before/After indicator */}
      {showBeforeAfter && imageSource && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-dark-800/90 rounded-full text-xs text-gray-300 border border-dark-400 backdrop-blur-sm">
          Drag slider to compare | Y to toggle
        </div>
      )}

      {/* Histogram overlay */}
      {showHistogram && imageSource && offscreenCanvasRef.current && (
        <div className="absolute top-4 right-4 w-64 h-24 bg-dark-900/90 rounded-lg border border-dark-400 p-2 backdrop-blur-sm">
          <HistogramDisplay offscreenCanvas={offscreenCanvasRef.current} editState={editState} />
        </div>
      )}

      {/* Brush cursor */}
      {activeTool === 'brush' && brushCursorPos && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: brushCursorPos.x - brushDisplaySize / 2,
            top: brushCursorPos.y - brushDisplaySize / 2,
            width: brushDisplaySize,
            height: brushDisplaySize,
          }}
        >
          {/* Outer circle */}
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: brushSettings.mode === 'add' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 100, 100, 0.9)',
            }}
          />
          {/* Inner hardness circle */}
          {brushSettings.hardness < 100 && (
            <div
              className="absolute rounded-full border border-dashed"
              style={{
                left: '50%',
                top: '50%',
                width: `${brushSettings.hardness}%`,
                height: `${brushSettings.hardness}%`,
                transform: 'translate(-50%, -50%)',
                borderColor: 'rgba(255, 255, 255, 0.5)',
              }}
            />
          )}
          {/* Center dot */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              left: '50%',
              top: '50%',
              width: 3,
              height: 3,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}

      {/* Gradient handles */}
      {activeTool === 'radialGradient' && imageDisplay && (
        <RadialGradientHandles imageDisplay={imageDisplay} containerRef={containerRef} />
      )}
      {activeTool === 'linearGradient' && imageDisplay && (
        <LinearGradientHandles imageDisplay={imageDisplay} containerRef={containerRef} />
      )}

      {/* Crop overlay */}
      {activeTool === 'crop' && imageDisplay && (
        <CropOverlay imageDisplay={imageDisplay} containerRef={containerRef} />
      )}

      {/* Mask overlay toggle (when masks exist) */}
      {masks.length > 0 && (
        <button
          onClick={() => setShowMaskOverlay(!showMaskOverlay)}
          className={`absolute bottom-4 right-4 px-2 py-1 rounded text-xs flex items-center gap-1.5 ${
            showMaskOverlay
              ? 'bg-maroon/80 text-white'
              : 'bg-dark-800/80 text-gray-400'
          }`}
          title={showMaskOverlay ? 'Hide mask overlay' : 'Show mask overlay'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Mask
        </button>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 px-2 py-1 bg-dark-800/80 rounded text-xs text-gray-400 tabular-nums">
        {Math.round(zoom * 100)}%
      </div>

      {/* Empty state hint */}
      {!imageSource && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm text-gray-600">Import images or a folder to get started</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Histogram display component - reads from rendered WebGL canvas
function HistogramDisplay({ offscreenCanvas, editState }: { offscreenCanvas: HTMLCanvasElement; editState: unknown }) {
  const [histogramData, setHistogramData] = useState<{ r: number[], g: number[], b: number[] } | null>(null)

  useEffect(() => {
    if (!offscreenCanvas) {
      setHistogramData(null)
      return
    }

    // Small delay to ensure rendering has finished
    const timeoutId = setTimeout(() => {
      const width = offscreenCanvas.width
      const height = offscreenCanvas.height
      if (width === 0 || height === 0) return

      // Read a downsampled version for performance
      const sampleWidth = Math.min(width, 256)
      const sampleHeight = Math.min(height, 256)

      // Sample from the offscreen canvas (works for both WebGL and Canvas2D)
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = sampleWidth
      tempCanvas.height = sampleHeight
      const ctx = tempCanvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(offscreenCanvas, 0, 0, sampleWidth, sampleHeight)
      const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
      const data = imageData.data

      const r = new Array(256).fill(0)
      const g = new Array(256).fill(0)
      const b = new Array(256).fill(0)

      for (let i = 0; i < data.length; i += 4) {
        r[data[i]]++
        g[data[i + 1]]++
        b[data[i + 2]]++
      }

      // Normalize
      const maxCount = Math.max(...r, ...g, ...b)
      if (maxCount === 0) return

      const rNorm = r.map(v => v / maxCount)
      const gNorm = g.map(v => v / maxCount)
      const bNorm = b.map(v => v / maxCount)

      setHistogramData({ r: rNorm, g: gNorm, b: bNorm })
    }, 50) // Small delay to ensure render is complete

    return () => clearTimeout(timeoutId)
  }, [offscreenCanvas, editState]) // Recalculate when editState changes

  if (!histogramData) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No image</div>
  }

  // Downsample to 64 bins for display
  const bins = 64
  const binSize = 256 / bins

  return (
    <div className="w-full h-full flex items-end gap-px">
      {Array.from({ length: bins }).map((_, i) => {
        const start = Math.floor(i * binSize)
        const end = Math.floor((i + 1) * binSize)

        let rSum = 0, gSum = 0, bSum = 0
        for (let j = start; j < end; j++) {
          rSum += histogramData.r[j]
          gSum += histogramData.g[j]
          bSum += histogramData.b[j]
        }

        const rAvg = rSum / binSize
        const gAvg = gSum / binSize
        const bAvg = bSum / binSize
        const luminance = (rAvg + gAvg + bAvg) / 3

        return (
          <div
            key={i}
            className="flex-1 bg-white/30"
            style={{ height: `${Math.max(2, luminance * 100)}%` }}
          />
        )
      })}
    </div>
  )
}
