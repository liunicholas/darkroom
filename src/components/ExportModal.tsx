'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useEditorStore } from '@/stores/editor-store'
import { WebGLRenderer } from '@/lib/webgl/WebGLRenderer'
import type { EditState } from '@/types/edit-state'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

type BrandType = 'fujifilm' | 'canon' | 'nikon' | 'sony' | 'leica'
type ResolutionType = 'original' | '4k' | '2k' | '1080p' | 'instagram'

export interface ExportOptions {
  format: 'jpeg' | 'png' | 'webp'
  resolution: ResolutionType

  addBorder: boolean
  borderWidth: number
  borderColor: string

  addText: boolean
  textMode: 'logo' | 'custom'
  selectedBrand: BrandType
  customText: string
  textPosition: 'bottom-left' | 'bottom-center' | 'bottom-right'
  textColor: string
  textSize: 'small' | 'medium' | 'large'
}

const DEFAULT_OPTIONS: ExportOptions = {
  format: 'jpeg',
  resolution: 'original',

  addBorder: false,
  borderWidth: 5,
  borderColor: '#ffffff',

  addText: false,
  textMode: 'logo',
  selectedBrand: 'fujifilm',
  customText: '',
  textPosition: 'bottom-right',
  textColor: '#000000',
  textSize: 'medium',
}

const BRAND_NAMES: Record<BrandType, string> = {
  fujifilm: 'Fujifilm',
  canon: 'Canon',
  nikon: 'Nikon',
  sony: 'Sony',
  leica: 'Leica',
}

// Map brand to actual file names
const BRAND_FILES: Record<BrandType, string> = {
  fujifilm: 'Fujifilm_logo.svg',
  canon: 'Canon_wordmark.svg',
  nikon: 'Nikon_Logo.svg',
  sony: 'Sony_logo.svg',
  leica: 'Leica_Camera.svg',
}

const RESOLUTION_PRESETS: { value: ResolutionType; label: string; longEdge: number | null }[] = [
  { value: 'original', label: 'Original', longEdge: null },
  { value: '4k', label: '4K', longEdge: 3840 },
  { value: '2k', label: '2K', longEdge: 2560 },
  { value: '1080p', label: '1080p', longEdge: 1920 },
  { value: 'instagram', label: 'Instagram', longEdge: 1080 },
]

const MIN_BORDER_WITH_TEXT = 3

// Calculate output dimensions based on resolution preset
function calculateOutputDimensions(
  originalWidth: number,
  originalHeight: number,
  resolution: ResolutionType
): { width: number; height: number } {
  const preset = RESOLUTION_PRESETS.find((p) => p.value === resolution)
  if (!preset || !preset.longEdge) {
    return { width: originalWidth, height: originalHeight }
  }

  const longEdge = Math.max(originalWidth, originalHeight)
  if (longEdge <= preset.longEdge) {
    return { width: originalWidth, height: originalHeight }
  }

  const scale = preset.longEdge / longEdge
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  }
}

interface PreviewProps {
  options: ExportOptions
  imageSource: {
    fullBitmap: ImageBitmap | null
    proxyBitmap: ImageBitmap | null
    originalWidth: number
    originalHeight: number
  } | null
  editState: EditState
}

function ExportPreview({ options, imageSource, editState }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loadedLogos, setLoadedLogos] = useState<Record<string, HTMLImageElement>>({})

  // Preload logo SVGs
  useEffect(() => {
    const brands: BrandType[] = ['fujifilm', 'canon', 'nikon', 'sony', 'leica']

    brands.forEach((brand) => {
      const img = new Image()
      img.onload = () => {
        setLoadedLogos((prev) => ({ ...prev, [brand]: img }))
      }
      img.src = `/logos/${BRAND_FILES[brand]}`
    })
  }, [])

  // Render preview
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageSource?.proxyBitmap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imageSource.proxyBitmap
    const { width: imgWidth, height: imgHeight } = img

    // Calculate preview scale to fit in container (max 400px width)
    const maxPreviewWidth = 400
    const scale = Math.min(1, maxPreviewWidth / imgWidth)

    const previewImgWidth = Math.round(imgWidth * scale)
    const previewImgHeight = Math.round(imgHeight * scale)

    // Calculate border
    const borderPx = options.addBorder ? Math.round(previewImgWidth * (options.borderWidth / 100)) : 0
    const totalWidth = previewImgWidth + borderPx * 2
    const totalHeight = previewImgHeight + borderPx * 2

    // Set canvas size
    canvas.width = totalWidth
    canvas.height = totalHeight

    // Fill background with border color
    if (options.addBorder) {
      ctx.fillStyle = options.borderColor
      ctx.fillRect(0, 0, totalWidth, totalHeight)
    } else {
      ctx.clearRect(0, 0, totalWidth, totalHeight)
    }

    // Create render canvas if needed
    if (!renderCanvasRef.current) {
      renderCanvasRef.current = document.createElement('canvas')
    }
    const renderCanvas = renderCanvasRef.current
    renderCanvas.width = previewImgWidth
    renderCanvas.height = previewImgHeight

    // Create renderer if needed
    if (!rendererRef.current) {
      rendererRef.current = new WebGLRenderer(renderCanvas)
    }

    // Render the image with WebGL
    try {
      rendererRef.current.setImage(img)
      rendererRef.current.render(editState)
      ctx.drawImage(renderCanvas, borderPx, borderPx)
    } catch (e) {
      // Fallback: draw without WebGL
      ctx.drawImage(img, borderPx, borderPx, previewImgWidth, previewImgHeight)
    }

    // Draw logo on the BORDER ONLY (below the image)
    if (options.addText && options.addBorder && borderPx > 0) {
      // Calculate logo size based on border height
      const baseLogoHeight = borderPx * 0.6
      const sizeMultiplier = options.textSize === 'small' ? 0.7 : options.textSize === 'large' ? 1.3 : 1
      const logoHeight = Math.max(8, Math.round(baseLogoHeight * sizeMultiplier))

      if (options.textMode === 'logo' && loadedLogos[options.selectedBrand]) {
        const logoImg = loadedLogos[options.selectedBrand]
        const logoWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight

        // Y position: center in bottom border
        const y = previewImgHeight + borderPx + (borderPx - logoHeight) / 2

        // X position based on alignment
        let x: number
        const padding = logoHeight * 0.3
        switch (options.textPosition) {
          case 'bottom-left':
            x = borderPx + padding
            break
          case 'bottom-center':
            x = (totalWidth - logoWidth) / 2
            break
          case 'bottom-right':
          default:
            x = totalWidth - borderPx - logoWidth - padding
            break
        }

        // Draw logo directly (keeping original colors)
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight)
      } else if (options.textMode === 'custom' && options.customText) {
        // Custom text rendering
        const fontSize = logoHeight
        ctx.font = `bold ${fontSize}px "Instrument Serif", Georgia, serif`
        ctx.fillStyle = options.textColor
        ctx.textBaseline = 'middle'

        const y = previewImgHeight + borderPx + borderPx / 2
        const padding = fontSize * 0.3

        let x: number
        switch (options.textPosition) {
          case 'bottom-left':
            ctx.textAlign = 'left'
            x = borderPx + padding
            break
          case 'bottom-center':
            ctx.textAlign = 'center'
            x = totalWidth / 2
            break
          case 'bottom-right':
          default:
            ctx.textAlign = 'right'
            x = totalWidth - borderPx - padding
            break
        }

        ctx.fillText(options.customText, x, y)
      }
    }
  }, [options, imageSource, editState, loadedLogos])

  // Cleanup renderer on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
    }
  }, [])

  if (!imageSource?.proxyBitmap) {
    return (
      <div className="flex items-center justify-center h-48 bg-dark-800 rounded-lg">
        <span className="text-gray-500 text-sm">No image loaded</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4 bg-dark-800/50 rounded-lg border border-dark-600">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-64 object-contain"
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          imageRendering: 'auto'
        }}
      />
    </div>
  )
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS)
  const [isExporting, setIsExporting] = useState(false)
  const [loadedLogos, setLoadedLogos] = useState<Record<string, HTMLImageElement>>({})

  const imageSource = useEditorStore((state) => state.imageSource)
  const editState = useEditorStore((state) => state.editState)
  const images = useEditorStore((state) => state.images)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)

  const currentImage = images[currentImageIndex]

  // Calculate output dimensions
  const outputDimensions = imageSource
    ? calculateOutputDimensions(imageSource.originalWidth, imageSource.originalHeight, options.resolution)
    : null

  // Preload logo SVGs for export
  useEffect(() => {
    const brands: BrandType[] = ['fujifilm', 'canon', 'nikon', 'sony', 'leica']

    brands.forEach((brand) => {
      const img = new Image()
      img.onload = () => {
        setLoadedLogos((prev) => ({ ...prev, [brand]: img }))
      }
      img.src = `/logos/${BRAND_FILES[brand]}`
    })
  }, [])

  // Auto-enable border when text is enabled
  const handleTextToggle = useCallback((enabled: boolean) => {
    if (enabled && !options.addBorder) {
      setOptions((prev) => ({
        ...prev,
        addText: enabled,
        addBorder: true,
        borderWidth: Math.max(prev.borderWidth, MIN_BORDER_WITH_TEXT),
      }))
    } else {
      setOptions((prev) => ({ ...prev, addText: enabled }))
    }
  }, [options.addBorder])

  // Ensure minimum border width when text is enabled
  const handleBorderWidthChange = useCallback((width: number) => {
    if (options.addText) {
      setOptions((prev) => ({ ...prev, borderWidth: Math.max(width, MIN_BORDER_WITH_TEXT) }))
    } else {
      setOptions((prev) => ({ ...prev, borderWidth: width }))
    }
  }, [options.addText])

  // Disable text if border is disabled
  const handleBorderToggle = useCallback((enabled: boolean) => {
    if (!enabled && options.addText) {
      setOptions((prev) => ({ ...prev, addBorder: enabled, addText: false }))
    } else {
      setOptions((prev) => ({ ...prev, addBorder: enabled }))
    }
  }, [options.addText])

  const handleExport = useCallback(async () => {
    if (!imageSource?.fullBitmap || !outputDimensions) return

    setIsExporting(true)

    try {
      const img = imageSource.fullBitmap
      const { width: outputWidth, height: outputHeight } = outputDimensions

      // Calculate border dimensions based on output size
      const borderPx = options.addBorder ? Math.round(outputWidth * (options.borderWidth / 100)) : 0
      const totalWidth = outputWidth + borderPx * 2
      const totalHeight = outputHeight + borderPx * 2

      // Create canvas for final output
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = totalWidth
      outputCanvas.height = totalHeight

      const ctx = outputCanvas.getContext('2d')!

      // Fill background with border color
      if (options.addBorder) {
        ctx.fillStyle = options.borderColor
        ctx.fillRect(0, 0, totalWidth, totalHeight)
      }

      // Render the image with WebGL at full resolution first
      const renderCanvas = document.createElement('canvas')
      renderCanvas.width = img.width
      renderCanvas.height = img.height

      const renderer = new WebGLRenderer(renderCanvas)
      renderer.setImage(img)
      renderer.render(editState)

      // Draw rendered image onto output canvas (scaled if needed)
      ctx.drawImage(renderCanvas, 0, 0, img.width, img.height, borderPx, borderPx, outputWidth, outputHeight)
      renderer.dispose()

      // Add logo on the BORDER ONLY (below the image)
      if (options.addText && options.addBorder && borderPx > 0) {
        const baseLogoHeight = borderPx * 0.6
        const sizeMultiplier = options.textSize === 'small' ? 0.7 : options.textSize === 'large' ? 1.3 : 1
        const logoHeight = Math.max(12, Math.round(baseLogoHeight * sizeMultiplier))

        if (options.textMode === 'logo' && loadedLogos[options.selectedBrand]) {
          const logoImg = loadedLogos[options.selectedBrand]
          const logoWidth = (logoImg.naturalWidth / logoImg.naturalHeight) * logoHeight

          // Y position: center in bottom border
          const y = outputHeight + borderPx + (borderPx - logoHeight) / 2

          // X position based on alignment
          let x: number
          const padding = logoHeight * 0.3
          switch (options.textPosition) {
            case 'bottom-left':
              x = borderPx + padding
              break
            case 'bottom-center':
              x = (totalWidth - logoWidth) / 2
              break
            case 'bottom-right':
            default:
              x = totalWidth - borderPx - logoWidth - padding
              break
          }

          // Draw logo directly
          ctx.drawImage(logoImg, x, y, logoWidth, logoHeight)
        } else if (options.textMode === 'custom' && options.customText) {
          const fontSize = logoHeight
          ctx.font = `bold ${fontSize}px "Instrument Serif", Georgia, serif`
          ctx.fillStyle = options.textColor
          ctx.textBaseline = 'middle'

          const y = outputHeight + borderPx + borderPx / 2
          const padding = fontSize * 0.3

          let x: number
          switch (options.textPosition) {
            case 'bottom-left':
              ctx.textAlign = 'left'
              x = borderPx + padding
              break
            case 'bottom-center':
              ctx.textAlign = 'center'
              x = totalWidth / 2
              break
            case 'bottom-right':
            default:
              ctx.textAlign = 'right'
              x = totalWidth - borderPx - padding
              break
          }

          ctx.fillText(options.customText, x, y)
        }
      }

      // Export to blob - fixed quality at 92%
      const mimeType = options.format === 'jpeg' ? 'image/jpeg' : options.format === 'png' ? 'image/png' : 'image/webp'
      const quality = options.format === 'png' ? undefined : 0.92

      outputCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url

          const baseName = currentImage?.fileName?.replace(/\.[^/.]+$/, '') || 'darkroom_export'
          const resolutionSuffix = options.resolution !== 'original' ? `_${options.resolution}` : ''
          a.download = `${baseName}${resolutionSuffix}.${options.format}`
          a.click()
          URL.revokeObjectURL(url)
        }
        setIsExporting(false)
        onClose()
      }, mimeType, quality)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }, [imageSource, editState, options, currentImage, onClose, loadedLogos, outputDimensions])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export" size="lg">
      <div className="space-y-6">
        {/* Live Preview */}
        <ExportPreview options={options} imageSource={imageSource} editState={editState} />

        {/* Format */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Format
          </h3>
          <div className="flex gap-2">
            {(['jpeg', 'png', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setOptions({ ...options, format: fmt })}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  options.format === fmt
                    ? 'bg-maroon text-white'
                    : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Size / Resolution */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Size
          </h3>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {RESOLUTION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setOptions({ ...options, resolution: preset.value })}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    options.resolution === preset.value
                      ? 'bg-maroon text-white'
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {outputDimensions && (
              <p className="text-xs text-gray-500">
                {outputDimensions.width} x {outputDimensions.height} px
              </p>
            )}
          </div>
        </div>

        {/* Border */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Border
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.addBorder}
                onChange={(e) => handleBorderToggle(e.target.checked)}
                className="w-4 h-4 rounded border-dark-500 text-maroon focus:ring-maroon bg-dark-700"
              />
              <span className="text-sm text-gray-300">Add border</span>
            </label>

            {options.addBorder && (
              <div className="flex gap-4 pl-7">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Width</span>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={options.borderWidth}
                    onChange={(e) => handleBorderWidthChange(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs text-white w-8">{options.borderWidth}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Color</span>
                  <input
                    type="color"
                    value={options.borderColor}
                    onChange={(e) => setOptions({ ...options, borderColor: e.target.value })}
                    className="w-8 h-8 rounded border border-dark-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Watermark */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Watermark
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.addText}
                onChange={(e) => handleTextToggle(e.target.checked)}
                className="w-4 h-4 rounded border-dark-500 text-maroon focus:ring-maroon bg-dark-700"
              />
              <span className="text-sm text-gray-300">Add watermark</span>
              {options.addText && (
                <span className="text-xs text-gray-500">(on border)</span>
              )}
            </label>

            {options.addText && (
              <div className="space-y-4 pl-7">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOptions({ ...options, textMode: 'logo' })}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      options.textMode === 'logo'
                        ? 'bg-maroon text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    Brand Logo
                  </button>
                  <button
                    onClick={() => setOptions({ ...options, textMode: 'custom' })}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      options.textMode === 'custom'
                        ? 'bg-maroon text-white'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    Custom Text
                  </button>
                </div>

                {/* Brand selector or text input */}
                {options.textMode === 'logo' ? (
                  <div className="flex flex-wrap gap-2">
                    {(['fujifilm', 'canon', 'nikon', 'sony', 'leica'] as BrandType[]).map((brand) => (
                      <button
                        key={brand}
                        onClick={() => setOptions({ ...options, selectedBrand: brand })}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                          options.selectedBrand === brand
                            ? 'bg-maroon text-white'
                            : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        }`}
                      >
                        {BRAND_NAMES[brand]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={options.customText}
                      onChange={(e) => setOptions({ ...options, customText: e.target.value })}
                      placeholder="Enter your text..."
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-maroon"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Color</span>
                      <input
                        type="color"
                        value={options.textColor}
                        onChange={(e) => setOptions({ ...options, textColor: e.target.value })}
                        className="w-8 h-8 rounded border border-dark-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Position and size */}
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs text-gray-400 block mb-2">Position</span>
                    <select
                      value={options.textPosition}
                      onChange={(e) => setOptions({ ...options, textPosition: e.target.value as ExportOptions['textPosition'] })}
                      className="px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-white focus:outline-none focus:border-maroon"
                    >
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-2">Size</span>
                    <select
                      value={options.textSize}
                      onChange={(e) => setOptions({ ...options, textSize: e.target.value as ExportOptions['textSize'] })}
                      className="px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-white focus:outline-none focus:border-maroon"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-dark-600">
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={isExporting || !imageSource}>
            {isExporting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
                Exporting...
              </span>
            ) : (
              'Export'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
