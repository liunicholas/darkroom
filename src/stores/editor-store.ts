import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  EditState,
  ImageSource,
  ImageItem,
  BasicAdjustments,
  ToneCurveState,
  HSLAdjustments,
  ColorGradingState,
  EffectsState,
  DetailState,
  CropState,
  MaskLayer,
  HistoryEntry,
  BrushSettings,
  HSLColor,
} from '@/types/edit-state'

// Default values
const DEFAULT_BASIC: BasicAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  texture: 0,
  clarity: 0,
  dehaze: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
}

const DEFAULT_CURVE = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
]

const DEFAULT_TONE_CURVE: ToneCurveState = {
  rgb: [...DEFAULT_CURVE],
  red: [...DEFAULT_CURVE],
  green: [...DEFAULT_CURVE],
  blue: [...DEFAULT_CURVE],
}

const HSL_COLORS: HSLColor[] = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta']

const DEFAULT_HSL: HSLAdjustments = HSL_COLORS.reduce((acc, color) => {
  acc[color] = { hue: 0, saturation: 0, luminance: 0 }
  return acc
}, {} as HSLAdjustments)

const DEFAULT_COLOR_WHEEL = { hue: 0, saturation: 0, luminance: 0 }

const DEFAULT_COLOR_GRADING: ColorGradingState = {
  shadows: { ...DEFAULT_COLOR_WHEEL },
  midtones: { ...DEFAULT_COLOR_WHEEL },
  highlights: { ...DEFAULT_COLOR_WHEEL },
  global: { ...DEFAULT_COLOR_WHEEL },
  blending: 50,
  balance: 0,
}

const DEFAULT_EFFECTS: EffectsState = {
  vignette: { amount: 0, midpoint: 50, roundness: 0, feather: 50 },
  grain: { amount: 0, size: 25, roughness: 50 },
}

const DEFAULT_DETAIL: DetailState = {
  sharpening: { amount: 0, radius: 1, detail: 25, masking: 0 },
  noiseReduction: { luminance: 0, luminanceDetail: 50, color: 25, colorDetail: 50 },
}

const DEFAULT_CROP: CropState = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  rotation: 0,
  aspectRatio: null,
  flipHorizontal: false,
  flipVertical: false,
}

const DEFAULT_EDIT_STATE: EditState = {
  basic: DEFAULT_BASIC,
  toneCurve: DEFAULT_TONE_CURVE,
  hsl: DEFAULT_HSL,
  colorGrading: DEFAULT_COLOR_GRADING,
  effects: DEFAULT_EFFECTS,
  detail: DEFAULT_DETAIL,
  crop: DEFAULT_CROP,
  masks: [],
  activeMaskId: null,
}

const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  size: 100,
  hardness: 50,
  flow: 50,
  mode: 'add',
}

// Helper to create default edit state
const createDefaultEditState = (): EditState => JSON.parse(JSON.stringify(DEFAULT_EDIT_STATE))

// Store interface
interface EditorStore {
  // Multi-image support
  images: ImageItem[]
  currentImageIndex: number
  isLoadingImages: boolean
  loadingProgress: { current: number; total: number }

  // Legacy single-image compatibility (computed from current image)
  imageSource: ImageSource | null
  isLoading: boolean
  editState: EditState
  history: HistoryEntry[]
  historyIndex: number
  maxHistory: number

  // Brush settings
  brushSettings: BrushSettings

  // UI state
  activeTool: 'select' | 'crop' | 'brush' | 'radialGradient' | 'linearGradient'
  activePanel: string | null
  showHistogram: boolean
  showBeforeAfter: boolean
  beforeAfterMode: 'split' | 'toggle'
  zoom: number
  panOffset: { x: number; y: number }
  showFilmstrip: boolean

  // Multi-image actions
  loadImage: (file: File) => Promise<void>
  loadImages: (files: File[]) => Promise<void>
  removeImage: (index: number) => void
  clearAllImages: () => void
  setCurrentImage: (index: number) => void
  nextImage: () => void
  previousImage: () => void
  getCurrentImage: () => ImageItem | null
  setImageRating: (index: number, rating: number) => void

  // Legacy actions
  resetImage: () => void

  // Basic adjustments
  setBasicAdjustment: <K extends keyof BasicAdjustments>(key: K, value: BasicAdjustments[K]) => void
  resetBasicAdjustments: () => void

  // Tone curve
  setToneCurvePoints: (channel: keyof ToneCurveState, points: { x: number; y: number }[]) => void
  resetToneCurve: () => void

  // HSL
  setHSLValue: (color: HSLColor, type: 'hue' | 'saturation' | 'luminance', value: number) => void
  resetHSL: () => void

  // Color grading
  setColorGradingWheel: (wheel: keyof ColorGradingState, value: Partial<ColorGradingState[keyof ColorGradingState]>) => void
  resetColorGrading: () => void

  // Effects
  setVignette: (key: keyof EffectsState['vignette'], value: number) => void
  setGrain: (key: keyof EffectsState['grain'], value: number) => void
  resetEffects: () => void

  // Detail
  setSharpening: (key: keyof DetailState['sharpening'], value: number) => void
  setNoiseReduction: (key: keyof DetailState['noiseReduction'], value: number) => void
  resetDetail: () => void

  // Crop
  setCrop: (crop: Partial<CropState>) => void
  resetCrop: () => void

  // Masks
  addMask: (type: MaskLayer['type']) => string
  updateMask: (id: string, updates: Partial<MaskLayer>) => void
  deleteMask: (id: string) => void
  setActiveMask: (id: string | null) => void

  // Brush
  setBrushSettings: (settings: Partial<BrushSettings>) => void

  // History
  undo: () => void
  redo: () => void
  pushHistory: (label: string) => void
  canUndo: () => boolean
  canRedo: () => boolean

  // UI
  setActiveTool: (tool: EditorStore['activeTool']) => void
  setActivePanel: (panel: string | null) => void
  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  toggleHistogram: () => void
  toggleBeforeAfter: () => void
  toggleFilmstrip: () => void

  // Reset
  resetAllEdits: () => void

  // Presets
  applyPreset: (newEditState: EditState) => void
}

// Max dimension for proxy image
const MAX_PROXY_DIMENSION = 2048
const THUMBNAIL_SIZE = 120

// Helper to generate thumbnail
async function generateThumbnail(bitmap: ImageBitmap): Promise<string> {
  const aspect = bitmap.width / bitmap.height
  const width = aspect >= 1 ? THUMBNAIL_SIZE : Math.round(THUMBNAIL_SIZE * aspect)
  const height = aspect >= 1 ? Math.round(THUMBNAIL_SIZE / aspect) : THUMBNAIL_SIZE

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 })
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

// Helper to process a single image file
async function processImageFile(file: File): Promise<Omit<ImageItem, 'id'>> {
  const fullBitmap = await createImageBitmap(file)
  const { width, height } = fullBitmap

  // Calculate proxy dimensions
  const scale = Math.min(1, MAX_PROXY_DIMENSION / Math.max(width, height))
  const proxyWidth = Math.round(width * scale)
  const proxyHeight = Math.round(height * scale)

  // Create proxy bitmap
  let proxyBitmap: ImageBitmap
  if (scale < 1) {
    const canvas = new OffscreenCanvas(proxyWidth, proxyHeight)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(fullBitmap, 0, 0, proxyWidth, proxyHeight)
    proxyBitmap = await createImageBitmap(canvas)
  } else {
    proxyBitmap = fullBitmap
  }

  // Generate thumbnail
  const thumbnail = await generateThumbnail(proxyBitmap)

  return {
    file,
    fileName: file.name,
    originalWidth: width,
    originalHeight: height,
    proxyBitmap,
    fullBitmap,
    thumbnail,
    editState: createDefaultEditState(),
    history: [],
    historyIndex: -1,
    isLoading: false,
    rating: 0,
  }
}

// Create store
export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    // Multi-image state
    images: [],
    currentImageIndex: -1,
    isLoadingImages: false,
    loadingProgress: { current: 0, total: 0 },

    // Computed legacy compatibility (updated via sync)
    imageSource: null,
    isLoading: false,
    editState: createDefaultEditState(),
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    brushSettings: { ...DEFAULT_BRUSH_SETTINGS },
    activeTool: 'select',
    activePanel: 'basic',
    showHistogram: true,
    showBeforeAfter: false,
    beforeAfterMode: 'split',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    showFilmstrip: true,

    // Get current image helper
    getCurrentImage: () => {
      const { images, currentImageIndex } = get()
      if (currentImageIndex >= 0 && currentImageIndex < images.length) {
        return images[currentImageIndex]
      }
      return null
    },

    // Load single image
    loadImage: async (file: File) => {
      set((state) => {
        state.isLoading = true
        state.isLoadingImages = true
      })

      try {
        const imageData = await processImageFile(file)
        const newImage: ImageItem = {
          ...imageData,
          id: `img-${Date.now()}`,
        }

        set((state) => {
          state.images.push(newImage)
          state.currentImageIndex = state.images.length - 1

          // Sync legacy state
          state.imageSource = {
            file: newImage.file,
            originalWidth: newImage.originalWidth,
            originalHeight: newImage.originalHeight,
            proxyBitmap: newImage.proxyBitmap,
            fullBitmap: newImage.fullBitmap,
          }
          state.editState = newImage.editState
          state.history = newImage.history
          state.historyIndex = newImage.historyIndex
          state.isLoading = false
          state.isLoadingImages = false
          state.zoom = 1
          state.panOffset = { x: 0, y: 0 }
        })

        // Push initial history
        get().pushHistory('Open image')
      } catch (error) {
        console.error('Failed to load image:', error)
        set((state) => {
          state.isLoading = false
          state.isLoadingImages = false
        })
      }
    },

    // Load multiple images (from folder)
    loadImages: async (files: File[]) => {
      if (files.length === 0) return

      set((state) => {
        state.isLoadingImages = true
        state.loadingProgress = { current: 0, total: files.length }
      })

      try {
        const newImages: ImageItem[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          try {
            const imageData = await processImageFile(file)
            const newImage: ImageItem = {
              ...imageData,
              id: `img-${Date.now()}-${i}`,
            }
            newImages.push(newImage)

            // Push initial history for each image
            newImage.history.push({
              editState: JSON.parse(JSON.stringify(newImage.editState)),
              label: 'Open image',
              timestamp: Date.now(),
            })
            newImage.historyIndex = 0

            set((state) => {
              state.loadingProgress.current = i + 1
            })
          } catch (error) {
            console.error(`Failed to load image ${file.name}:`, error)
          }
        }

        if (newImages.length > 0) {
          set((state) => {
            state.images = [...state.images, ...newImages]

            // If no current image, select the first new one
            if (state.currentImageIndex === -1) {
              state.currentImageIndex = state.images.length - newImages.length
            }

            // Sync legacy state with current image
            const currentImg = state.images[state.currentImageIndex]
            if (currentImg) {
              state.imageSource = {
                file: currentImg.file,
                originalWidth: currentImg.originalWidth,
                originalHeight: currentImg.originalHeight,
                proxyBitmap: currentImg.proxyBitmap,
                fullBitmap: currentImg.fullBitmap,
              }
              state.editState = currentImg.editState
              state.history = currentImg.history
              state.historyIndex = currentImg.historyIndex
            }

            state.isLoadingImages = false
            state.zoom = 1
            state.panOffset = { x: 0, y: 0 }
          })
        } else {
          set((state) => {
            state.isLoadingImages = false
          })
        }
      } catch (error) {
        console.error('Failed to load images:', error)
        set((state) => {
          state.isLoadingImages = false
        })
      }
    },

    // Remove image
    removeImage: (index: number) => {
      set((state) => {
        if (index < 0 || index >= state.images.length) return

        state.images.splice(index, 1)

        // Adjust current index
        if (state.images.length === 0) {
          state.currentImageIndex = -1
          state.imageSource = null
          state.editState = createDefaultEditState()
          state.history = []
          state.historyIndex = -1
        } else if (state.currentImageIndex >= state.images.length) {
          state.currentImageIndex = state.images.length - 1
        } else if (index < state.currentImageIndex) {
          state.currentImageIndex--
        }

        // Sync if images remain
        if (state.currentImageIndex >= 0) {
          const currentImg = state.images[state.currentImageIndex]
          state.imageSource = {
            file: currentImg.file,
            originalWidth: currentImg.originalWidth,
            originalHeight: currentImg.originalHeight,
            proxyBitmap: currentImg.proxyBitmap,
            fullBitmap: currentImg.fullBitmap,
          }
          state.editState = currentImg.editState
          state.history = currentImg.history
          state.historyIndex = currentImg.historyIndex
        }
      })
    },

    // Clear all images
    clearAllImages: () => {
      set((state) => {
        state.images = []
        state.currentImageIndex = -1
        state.imageSource = null
        state.editState = createDefaultEditState()
        state.history = []
        state.historyIndex = -1
      })
    },

    // Set current image
    setCurrentImage: (index: number) => {
      set((state) => {
        if (index < 0 || index >= state.images.length) return

        // Save current image's state before switching
        if (state.currentImageIndex >= 0 && state.currentImageIndex < state.images.length) {
          const currentImg = state.images[state.currentImageIndex]
          currentImg.editState = JSON.parse(JSON.stringify(state.editState))
          currentImg.history = state.history
          currentImg.historyIndex = state.historyIndex
        }

        state.currentImageIndex = index
        const newImg = state.images[index]

        // Sync legacy state
        state.imageSource = {
          file: newImg.file,
          originalWidth: newImg.originalWidth,
          originalHeight: newImg.originalHeight,
          proxyBitmap: newImg.proxyBitmap,
          fullBitmap: newImg.fullBitmap,
        }
        state.editState = newImg.editState
        state.history = newImg.history
        state.historyIndex = newImg.historyIndex
        state.zoom = 1
        state.panOffset = { x: 0, y: 0 }
      })
    },

    // Next image
    nextImage: () => {
      const { images, currentImageIndex, setCurrentImage } = get()
      if (currentImageIndex < images.length - 1) {
        setCurrentImage(currentImageIndex + 1)
      }
    },

    // Previous image
    previousImage: () => {
      const { currentImageIndex, setCurrentImage } = get()
      if (currentImageIndex > 0) {
        setCurrentImage(currentImageIndex - 1)
      }
    },

    // Set image rating
    setImageRating: (index: number, rating: number) => {
      set((state) => {
        if (index >= 0 && index < state.images.length) {
          state.images[index].rating = Math.max(0, Math.min(5, rating))
        }
      })
    },

    resetImage: () => {
      set((state) => {
        if (state.currentImageIndex >= 0) {
          state.images.splice(state.currentImageIndex, 1)
          if (state.images.length === 0) {
            state.currentImageIndex = -1
            state.imageSource = null
          } else if (state.currentImageIndex >= state.images.length) {
            state.currentImageIndex = state.images.length - 1
            const img = state.images[state.currentImageIndex]
            state.imageSource = {
              file: img.file,
              originalWidth: img.originalWidth,
              originalHeight: img.originalHeight,
              proxyBitmap: img.proxyBitmap,
              fullBitmap: img.fullBitmap,
            }
            state.editState = img.editState
            state.history = img.history
            state.historyIndex = img.historyIndex
          }
        }
        state.editState = createDefaultEditState()
        state.history = []
        state.historyIndex = -1
      })
    },

    // Basic adjustments
    setBasicAdjustment: (key, value) => {
      set((state) => {
        state.editState.basic[key] = value
        // Sync to current image
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.basic[key] = value
        }
      })
    },

    resetBasicAdjustments: () => {
      set((state) => {
        state.editState.basic = { ...DEFAULT_BASIC }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.basic = { ...DEFAULT_BASIC }
        }
      })
      get().pushHistory('Reset basic adjustments')
    },

    // Tone curve
    setToneCurvePoints: (channel, points) => {
      set((state) => {
        state.editState.toneCurve[channel] = points
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.toneCurve[channel] = points
        }
      })
    },

    resetToneCurve: () => {
      set((state) => {
        state.editState.toneCurve = {
          rgb: [...DEFAULT_CURVE],
          red: [...DEFAULT_CURVE],
          green: [...DEFAULT_CURVE],
          blue: [...DEFAULT_CURVE],
        }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.toneCurve = {
            rgb: [...DEFAULT_CURVE],
            red: [...DEFAULT_CURVE],
            green: [...DEFAULT_CURVE],
            blue: [...DEFAULT_CURVE],
          }
        }
      })
      get().pushHistory('Reset tone curve')
    },

    // HSL
    setHSLValue: (color, type, value) => {
      set((state) => {
        state.editState.hsl[color][type] = value
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.hsl[color][type] = value
        }
      })
    },

    resetHSL: () => {
      set((state) => {
        state.editState.hsl = { ...DEFAULT_HSL }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.hsl = { ...DEFAULT_HSL }
        }
      })
      get().pushHistory('Reset HSL')
    },

    // Color grading
    setColorGradingWheel: (wheel, value) => {
      set((state) => {
        if (wheel === 'blending' || wheel === 'balance') {
          // @ts-ignore - these are numbers
          state.editState.colorGrading[wheel] = value as number
          if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
            // @ts-ignore
            state.images[state.currentImageIndex].editState.colorGrading[wheel] = value as number
          }
        } else {
          Object.assign(state.editState.colorGrading[wheel], value)
          if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
            Object.assign(state.images[state.currentImageIndex].editState.colorGrading[wheel], value)
          }
        }
      })
    },

    resetColorGrading: () => {
      set((state) => {
        state.editState.colorGrading = { ...DEFAULT_COLOR_GRADING }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.colorGrading = { ...DEFAULT_COLOR_GRADING }
        }
      })
      get().pushHistory('Reset color grading')
    },

    // Effects
    setVignette: (key, value) => {
      set((state) => {
        state.editState.effects.vignette[key] = value
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.effects.vignette[key] = value
        }
      })
    },

    setGrain: (key, value) => {
      set((state) => {
        state.editState.effects.grain[key] = value
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.effects.grain[key] = value
        }
      })
    },

    resetEffects: () => {
      set((state) => {
        state.editState.effects = { ...DEFAULT_EFFECTS }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.effects = { ...DEFAULT_EFFECTS }
        }
      })
      get().pushHistory('Reset effects')
    },

    // Detail
    setSharpening: (key, value) => {
      set((state) => {
        state.editState.detail.sharpening[key] = value
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.detail.sharpening[key] = value
        }
      })
    },

    setNoiseReduction: (key, value) => {
      set((state) => {
        state.editState.detail.noiseReduction[key] = value
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.detail.noiseReduction[key] = value
        }
      })
    },

    resetDetail: () => {
      set((state) => {
        state.editState.detail = { ...DEFAULT_DETAIL }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.detail = { ...DEFAULT_DETAIL }
        }
      })
      get().pushHistory('Reset detail')
    },

    // Crop
    setCrop: (crop) => {
      set((state) => {
        Object.assign(state.editState.crop, crop)
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          Object.assign(state.images[state.currentImageIndex].editState.crop, crop)
        }
      })
    },

    resetCrop: () => {
      set((state) => {
        state.editState.crop = { ...DEFAULT_CROP }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.crop = { ...DEFAULT_CROP }
        }
      })
      get().pushHistory('Reset crop')
    },

    // Masks
    addMask: (type) => {
      const id = `mask-${Date.now()}`
      set((state) => {
        const newMask: MaskLayer = {
          id,
          name: `Mask ${state.editState.masks.length + 1}`,
          type,
          enabled: true,
          opacity: 1,
          feather: 0,
          inverted: false,
          adjustments: {},
        }
        state.editState.masks.push(newMask)
        state.editState.activeMaskId = id
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.masks.push({ ...newMask })
          state.images[state.currentImageIndex].editState.activeMaskId = id
        }
      })
      get().pushHistory(`Add ${type} mask`)
      return id
    },

    updateMask: (id, updates) => {
      set((state) => {
        const mask = state.editState.masks.find((m) => m.id === id)
        if (mask) {
          Object.assign(mask, updates)
        }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          const imgMask = state.images[state.currentImageIndex].editState.masks.find((m) => m.id === id)
          if (imgMask) {
            Object.assign(imgMask, updates)
          }
        }
      })
    },

    deleteMask: (id) => {
      set((state) => {
        state.editState.masks = state.editState.masks.filter((m) => m.id !== id)
        if (state.editState.activeMaskId === id) {
          state.editState.activeMaskId = null
        }
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.masks =
            state.images[state.currentImageIndex].editState.masks.filter((m) => m.id !== id)
          if (state.images[state.currentImageIndex].editState.activeMaskId === id) {
            state.images[state.currentImageIndex].editState.activeMaskId = null
          }
        }
      })
      get().pushHistory('Delete mask')
    },

    setActiveMask: (id) => {
      set((state) => {
        state.editState.activeMaskId = id
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState.activeMaskId = id
        }
      })
    },

    // Brush settings
    setBrushSettings: (settings) => {
      set((state) => {
        Object.assign(state.brushSettings, settings)
      })
    },

    // History
    undo: () => {
      const { history, historyIndex, currentImageIndex, images } = get()
      if (historyIndex > 0) {
        const prevState = history[historyIndex - 1]
        set((state) => {
          state.editState = JSON.parse(JSON.stringify(prevState.editState))
          state.historyIndex = historyIndex - 1
          if (currentImageIndex >= 0 && images[currentImageIndex]) {
            state.images[currentImageIndex].editState = JSON.parse(JSON.stringify(prevState.editState))
            state.images[currentImageIndex].historyIndex = historyIndex - 1
          }
        })
      }
    },

    redo: () => {
      const { history, historyIndex, currentImageIndex, images } = get()
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1]
        set((state) => {
          state.editState = JSON.parse(JSON.stringify(nextState.editState))
          state.historyIndex = historyIndex + 1
          if (currentImageIndex >= 0 && images[currentImageIndex]) {
            state.images[currentImageIndex].editState = JSON.parse(JSON.stringify(nextState.editState))
            state.images[currentImageIndex].historyIndex = historyIndex + 1
          }
        })
      }
    },

    pushHistory: (label) => {
      const { editState, history, historyIndex, maxHistory, currentImageIndex, images } = get()

      // Clone edit state
      const entry: HistoryEntry = {
        editState: JSON.parse(JSON.stringify(editState)),
        label,
        timestamp: Date.now(),
      }

      set((state) => {
        // Remove any redo history
        state.history = history.slice(0, historyIndex + 1)
        state.history.push(entry)

        // Limit history size
        if (state.history.length > maxHistory) {
          state.history = state.history.slice(-maxHistory)
        }

        state.historyIndex = state.history.length - 1

        // Sync to current image
        if (currentImageIndex >= 0 && images[currentImageIndex]) {
          state.images[currentImageIndex].history = [...state.history]
          state.images[currentImageIndex].historyIndex = state.historyIndex
        }
      })
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // UI
    setActiveTool: (tool) => {
      set((state) => {
        state.activeTool = tool
      })
    },

    setActivePanel: (panel) => {
      set((state) => {
        state.activePanel = panel
      })
    },

    setZoom: (zoom) => {
      set((state) => {
        state.zoom = Math.max(0.1, Math.min(10, zoom))
      })
    },

    setPanOffset: (offset) => {
      set((state) => {
        state.panOffset = offset
      })
    },

    toggleHistogram: () => {
      set((state) => {
        state.showHistogram = !state.showHistogram
      })
    },

    toggleBeforeAfter: () => {
      set((state) => {
        state.showBeforeAfter = !state.showBeforeAfter
      })
    },

    toggleFilmstrip: () => {
      set((state) => {
        state.showFilmstrip = !state.showFilmstrip
      })
    },

    // Reset all
    resetAllEdits: () => {
      set((state) => {
        state.editState = createDefaultEditState()
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState = createDefaultEditState()
        }
      })
      get().pushHistory('Reset all edits')
    },

    // Apply preset
    applyPreset: (newEditState: EditState) => {
      set((state) => {
        state.editState = JSON.parse(JSON.stringify(newEditState))
        if (state.currentImageIndex >= 0 && state.images[state.currentImageIndex]) {
          state.images[state.currentImageIndex].editState = JSON.parse(JSON.stringify(newEditState))
        }
      })
      get().pushHistory('Apply preset')
    },
  }))
)
