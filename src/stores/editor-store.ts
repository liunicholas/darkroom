import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  EditState,
  ImageSource,
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

// Store interface
interface EditorStore {
  // Image
  imageSource: ImageSource | null
  isLoading: boolean

  // Edit state
  editState: EditState

  // History
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

  // Actions
  loadImage: (file: File) => Promise<void>
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

  // Reset
  resetAllEdits: () => void

  // Presets
  applyPreset: (newEditState: EditState) => void
}

// Max dimension for proxy image
const MAX_PROXY_DIMENSION = 2048

// Create store
export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    // Initial state
    imageSource: null,
    isLoading: false,
    editState: { ...DEFAULT_EDIT_STATE },
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

    // Load image
    loadImage: async (file: File) => {
      set((state) => {
        state.isLoading = true
      })

      try {
        // Create bitmap from file
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

        set((state) => {
          state.imageSource = {
            file,
            originalWidth: width,
            originalHeight: height,
            proxyBitmap,
            fullBitmap,
          }
          state.editState = { ...DEFAULT_EDIT_STATE }
          state.history = []
          state.historyIndex = -1
          state.isLoading = false
        })

        // Push initial history
        get().pushHistory('Open image')
      } catch (error) {
        console.error('Failed to load image:', error)
        set((state) => {
          state.isLoading = false
        })
      }
    },

    resetImage: () => {
      set((state) => {
        state.imageSource = null
        state.editState = { ...DEFAULT_EDIT_STATE }
        state.history = []
        state.historyIndex = -1
      })
    },

    // Basic adjustments
    setBasicAdjustment: (key, value) => {
      set((state) => {
        state.editState.basic[key] = value
      })
    },

    resetBasicAdjustments: () => {
      set((state) => {
        state.editState.basic = { ...DEFAULT_BASIC }
      })
      get().pushHistory('Reset basic adjustments')
    },

    // Tone curve
    setToneCurvePoints: (channel, points) => {
      set((state) => {
        state.editState.toneCurve[channel] = points
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
      })
      get().pushHistory('Reset tone curve')
    },

    // HSL
    setHSLValue: (color, type, value) => {
      set((state) => {
        state.editState.hsl[color][type] = value
      })
    },

    resetHSL: () => {
      set((state) => {
        state.editState.hsl = { ...DEFAULT_HSL }
      })
      get().pushHistory('Reset HSL')
    },

    // Color grading
    setColorGradingWheel: (wheel, value) => {
      set((state) => {
        if (wheel === 'blending' || wheel === 'balance') {
          // @ts-ignore - these are numbers
          state.editState.colorGrading[wheel] = value as number
        } else {
          Object.assign(state.editState.colorGrading[wheel], value)
        }
      })
    },

    resetColorGrading: () => {
      set((state) => {
        state.editState.colorGrading = { ...DEFAULT_COLOR_GRADING }
      })
      get().pushHistory('Reset color grading')
    },

    // Effects
    setVignette: (key, value) => {
      set((state) => {
        state.editState.effects.vignette[key] = value
      })
    },

    setGrain: (key, value) => {
      set((state) => {
        state.editState.effects.grain[key] = value
      })
    },

    resetEffects: () => {
      set((state) => {
        state.editState.effects = { ...DEFAULT_EFFECTS }
      })
      get().pushHistory('Reset effects')
    },

    // Detail
    setSharpening: (key, value) => {
      set((state) => {
        state.editState.detail.sharpening[key] = value
      })
    },

    setNoiseReduction: (key, value) => {
      set((state) => {
        state.editState.detail.noiseReduction[key] = value
      })
    },

    resetDetail: () => {
      set((state) => {
        state.editState.detail = { ...DEFAULT_DETAIL }
      })
      get().pushHistory('Reset detail')
    },

    // Crop
    setCrop: (crop) => {
      set((state) => {
        Object.assign(state.editState.crop, crop)
      })
    },

    resetCrop: () => {
      set((state) => {
        state.editState.crop = { ...DEFAULT_CROP }
      })
      get().pushHistory('Reset crop')
    },

    // Masks
    addMask: (type) => {
      const id = `mask-${Date.now()}`
      set((state) => {
        state.editState.masks.push({
          id,
          name: `Mask ${state.editState.masks.length + 1}`,
          type,
          enabled: true,
          opacity: 1,
          feather: 0,
          inverted: false,
          adjustments: {},
        })
        state.editState.activeMaskId = id
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
      })
    },

    deleteMask: (id) => {
      set((state) => {
        state.editState.masks = state.editState.masks.filter((m) => m.id !== id)
        if (state.editState.activeMaskId === id) {
          state.editState.activeMaskId = null
        }
      })
      get().pushHistory('Delete mask')
    },

    setActiveMask: (id) => {
      set((state) => {
        state.editState.activeMaskId = id
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
      const { history, historyIndex } = get()
      if (historyIndex > 0) {
        const prevState = history[historyIndex - 1]
        set((state) => {
          state.editState = JSON.parse(JSON.stringify(prevState.editState))
          state.historyIndex = historyIndex - 1
        })
      }
    },

    redo: () => {
      const { history, historyIndex } = get()
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1]
        set((state) => {
          state.editState = JSON.parse(JSON.stringify(nextState.editState))
          state.historyIndex = historyIndex + 1
        })
      }
    },

    pushHistory: (label) => {
      const { editState, history, historyIndex, maxHistory } = get()

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

    // Reset all
    resetAllEdits: () => {
      set((state) => {
        state.editState = { ...DEFAULT_EDIT_STATE }
      })
      get().pushHistory('Reset all edits')
    },

    // Apply preset
    applyPreset: (newEditState: EditState) => {
      set((state) => {
        state.editState = JSON.parse(JSON.stringify(newEditState))
      })
      get().pushHistory('Apply preset')
    },
  }))
)
