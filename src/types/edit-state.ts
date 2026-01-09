// Curve point for tone curves
export interface CurvePoint {
  x: number // 0-1 input value
  y: number // 0-1 output value
}

// HSL color channels
export type HSLColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'aqua'
  | 'blue'
  | 'purple'
  | 'magenta'

export interface HSLValues {
  hue: number // -100 to 100
  saturation: number // -100 to 100
  luminance: number // -100 to 100
}

// Basic adjustments
export interface BasicAdjustments {
  // Tone
  exposure: number // -5 to 5 (stops)
  contrast: number // -100 to 100
  highlights: number // -100 to 100
  shadows: number // -100 to 100
  whites: number // -100 to 100
  blacks: number // -100 to 100
  // Presence
  texture: number // -100 to 100
  clarity: number // -100 to 100
  dehaze: number // -100 to 100
  // Color
  temperature: number // -100 to 100
  tint: number // -150 to 150
  vibrance: number // -100 to 100
  saturation: number // -100 to 100
}

// Tone curve state
export interface ToneCurveState {
  rgb: CurvePoint[]
  red: CurvePoint[]
  green: CurvePoint[]
  blue: CurvePoint[]
}

// HSL adjustments for all 8 colors
export type HSLAdjustments = Record<HSLColor, HSLValues>

// Color wheel value for color grading
export interface ColorWheelValue {
  hue: number // 0-360
  saturation: number // 0-100
  luminance: number // -100 to 100
}

// Color grading state
export interface ColorGradingState {
  shadows: ColorWheelValue
  midtones: ColorWheelValue
  highlights: ColorWheelValue
  global: ColorWheelValue
  blending: number // 0-100
  balance: number // -100 to 100
}

// Vignette settings
export interface VignetteSettings {
  amount: number // -100 to 100
  midpoint: number // 0-100
  roundness: number // -100 to 100
  feather: number // 0-100
}

// Grain settings
export interface GrainSettings {
  amount: number // 0-100
  size: number // 0-100
  roughness: number // 0-100
}

// Effects state
export interface EffectsState {
  vignette: VignetteSettings
  grain: GrainSettings
}

// Sharpening settings
export interface SharpeningSettings {
  amount: number // 0-150
  radius: number // 0.5-3
  detail: number // 0-100
  masking: number // 0-100
}

// Noise reduction settings
export interface NoiseReductionSettings {
  luminance: number // 0-100
  luminanceDetail: number // 0-100
  color: number // 0-100
  colorDetail: number // 0-100
}

// Detail state
export interface DetailState {
  sharpening: SharpeningSettings
  noiseReduction: NoiseReductionSettings
}

// Crop state
export interface CropState {
  x: number // 0-1 normalized
  y: number // 0-1 normalized
  width: number // 0-1 normalized
  height: number // 0-1 normalized
  rotation: number // degrees
  aspectRatio: string | null // e.g., '16:9', '1:1', null for free
  flipHorizontal: boolean
  flipVertical: boolean
}

// Aspect ratio presets
export type AspectRatioPreset =
  | 'free'
  | 'original'
  | '1:1'
  | '4:3'
  | '3:2'
  | '16:9'
  | '5:4'
  | '2:3'
  | '9:16'

// Gradient mask data
export interface RadialGradientData {
  centerX: number // 0-1
  centerY: number // 0-1
  innerRadius: number
  outerRadius: number
  aspectRatio: number
  rotation: number
  inverted: boolean
}

export interface LinearGradientData {
  startX: number // 0-1
  startY: number // 0-1
  endX: number // 0-1
  endY: number // 0-1
  feather: number
  inverted: boolean
}

// Brush settings
export interface BrushSettings {
  size: number // 1-500 px
  hardness: number // 0-100
  flow: number // 1-100
  mode: 'add' | 'subtract'
}

// Mask layer
export interface MaskLayer {
  id: string
  name: string
  type: 'brush' | 'radialGradient' | 'linearGradient'
  enabled: boolean
  opacity: number // 0-1
  feather: number
  inverted: boolean
  gradientData?: RadialGradientData | LinearGradientData
  adjustments: Partial<BasicAdjustments>
}

// Complete edit state
export interface EditState {
  basic: BasicAdjustments
  toneCurve: ToneCurveState
  hsl: HSLAdjustments
  colorGrading: ColorGradingState
  effects: EffectsState
  detail: DetailState
  crop: CropState
  masks: MaskLayer[]
  activeMaskId: string | null
}

// Image source
export interface ImageSource {
  file: File
  originalWidth: number
  originalHeight: number
  proxyBitmap: ImageBitmap | null
  fullBitmap: ImageBitmap | null
}

// History entry
export interface HistoryEntry {
  editState: EditState
  label: string
  timestamp: number
}

// Preset
export interface Preset {
  id: string
  name: string
  category: 'fujifilm' | 'user' | 'built-in'
  editState: Partial<EditState>
  thumbnail?: string
}
