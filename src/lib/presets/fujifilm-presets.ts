import type { EditState, BasicAdjustments, HSLAdjustments, ColorGradingState, ToneCurveState } from '@/types/edit-state'

// Partial edit state that presets can modify
export interface PresetData {
  name: string
  description: string
  category: 'cinema' | 'bw' | 'vintage' | 'custom'
  adjustments: {
    basic?: Partial<BasicAdjustments>
    hsl?: Partial<Record<keyof HSLAdjustments, Partial<HSLAdjustments[keyof HSLAdjustments]>>>
    colorGrading?: Partial<ColorGradingState>
    toneCurve?: Partial<ToneCurveState>
    vignette?: { amount?: number; midpoint?: number; feather?: number }
    grain?: { amount?: number; size?: number; roughness?: number }
  }
}

// Black & white presets
export const bwPresets: PresetData[] = [
  {
    name: 'Acros',
    description: 'Black & white with fine grain and deep blacks',
    category: 'bw',
    adjustments: {
      basic: {
        saturation: -100,
        contrast: 20,
        blacks: 15,
        clarity: 10,
      },
      grain: {
        amount: 15,
        size: 30,
        roughness: 50,
      },
      toneCurve: {
        rgb: [
          { x: 0, y: 0 },
          { x: 0.15, y: 0.1 },
          { x: 0.5, y: 0.52 },
          { x: 0.85, y: 0.9 },
          { x: 1, y: 1 },
        ],
      },
    },
  },
  {
    name: 'Monochrome',
    description: 'Clean black & white conversion',
    category: 'bw',
    adjustments: {
      basic: {
        saturation: -100,
        contrast: 15,
      },
    },
  },
]

// Additional cinematic presets
export const cinematicPresets: PresetData[] = [
  {
    name: 'Teal & Orange',
    description: 'Hollywood blockbuster color grade',
    category: 'cinema',
    adjustments: {
      basic: {
        contrast: 15,
        saturation: 10,
      },
      hsl: {
        orange: { saturation: 25, luminance: 5 },
        yellow: { hue: -15, saturation: 10 },
        green: { hue: 180, saturation: -30 },
        aqua: { saturation: 30 },
        blue: { hue: -10, saturation: 20 },
      },
      colorGrading: {
        shadows: { hue: 200, saturation: 25, luminance: 0 },
        highlights: { hue: 35, saturation: 20, luminance: 0 },
      },
    },
  },
  {
    name: 'Blade Runner',
    description: 'Neon-lit cyberpunk aesthetic',
    category: 'cinema',
    adjustments: {
      basic: {
        contrast: 25,
        highlights: -15,
        shadows: -10,
        saturation: 15,
        vibrance: 10,
      },
      hsl: {
        blue: { saturation: 30, luminance: -10 },
        purple: { saturation: 25 },
        magenta: { saturation: 20 },
        aqua: { saturation: 20 },
      },
      colorGrading: {
        shadows: { hue: 260, saturation: 20, luminance: 0 },
        midtones: { hue: 200, saturation: 10, luminance: 0 },
        highlights: { hue: 320, saturation: 15, luminance: 0 },
      },
      vignette: {
        amount: 30,
        midpoint: 50,
        feather: 60,
      },
    },
  },
  {
    name: 'Muted Film',
    description: 'Desaturated indie film look',
    category: 'cinema',
    adjustments: {
      basic: {
        contrast: 5,
        highlights: -20,
        shadows: 10,
        saturation: -25,
        vibrance: -10,
      },
      colorGrading: {
        shadows: { hue: 220, saturation: 10, luminance: 0 },
        highlights: { hue: 45, saturation: 8, luminance: 0 },
      },
      toneCurve: {
        rgb: [
          { x: 0, y: 0.08 },
          { x: 0.5, y: 0.5 },
          { x: 1, y: 0.95 },
        ],
      },
    },
  },
]

// Vintage presets
export const vintagePresets: PresetData[] = [
  {
    name: 'Kodak Portra',
    description: 'Warm skin tones and soft pastels',
    category: 'vintage',
    adjustments: {
      basic: {
        contrast: -5,
        highlights: -10,
        shadows: 10,
        temperature: 8,
        saturation: -10,
        vibrance: 15,
      },
      hsl: {
        red: { hue: 5, saturation: -5, luminance: 5 },
        orange: { saturation: 10, luminance: 5 },
        yellow: { hue: -5, saturation: 5 },
        green: { saturation: -15 },
        blue: { saturation: -10 },
      },
      colorGrading: {
        shadows: { hue: 40, saturation: 10, luminance: 0 },
        highlights: { hue: 45, saturation: 12, luminance: 0 },
      },
      grain: {
        amount: 10,
        size: 25,
        roughness: 40,
      },
    },
  },
  {
    name: 'Kodak Gold',
    description: 'Warm, golden consumer film look',
    category: 'vintage',
    adjustments: {
      basic: {
        contrast: 10,
        temperature: 15,
        saturation: 15,
        vibrance: 10,
      },
      hsl: {
        yellow: { saturation: 20, luminance: 5 },
        orange: { saturation: 15 },
        red: { saturation: 10 },
        green: { saturation: -5 },
        blue: { saturation: -10 },
      },
      colorGrading: {
        shadows: { hue: 30, saturation: 15, luminance: 0 },
        highlights: { hue: 45, saturation: 20, luminance: 0 },
      },
      grain: {
        amount: 12,
        size: 30,
        roughness: 50,
      },
    },
  },
  {
    name: 'Cinestill 800T',
    description: 'Tungsten film with halation glow',
    category: 'vintage',
    adjustments: {
      basic: {
        contrast: 15,
        temperature: -10,
        tint: 5,
        saturation: 5,
      },
      hsl: {
        red: { saturation: 15, luminance: 10 },
        orange: { saturation: 10 },
        blue: { saturation: 15 },
        aqua: { saturation: 20 },
      },
      colorGrading: {
        shadows: { hue: 220, saturation: 15, luminance: 0 },
        highlights: { hue: 350, saturation: 10, luminance: 0 },
      },
      grain: {
        amount: 15,
        size: 35,
        roughness: 60,
      },
    },
  },
  {
    name: 'Faded Print',
    description: 'Aged photograph with lifted blacks',
    category: 'vintage',
    adjustments: {
      basic: {
        contrast: -15,
        highlights: -20,
        shadows: 20,
        saturation: -20,
        vibrance: -10,
      },
      colorGrading: {
        shadows: { hue: 45, saturation: 15, luminance: 0 },
        highlights: { hue: 40, saturation: 10, luminance: 0 },
      },
      toneCurve: {
        rgb: [
          { x: 0, y: 0.15 },
          { x: 0.5, y: 0.5 },
          { x: 1, y: 0.9 },
        ],
      },
      vignette: {
        amount: 20,
        midpoint: 60,
        feather: 70,
      },
    },
  },
]

// All presets combined
export const allPresets: PresetData[] = [
  ...cinematicPresets,
  ...vintagePresets,
  ...bwPresets,
]

// Helper to apply a preset to the current edit state
export function applyPreset(
  currentState: EditState,
  preset: PresetData
): EditState {
  const newState = JSON.parse(JSON.stringify(currentState)) as EditState

  // Apply basic adjustments
  if (preset.adjustments.basic) {
    Object.entries(preset.adjustments.basic).forEach(([key, value]) => {
      if (value !== undefined) {
        ;(newState.basic as unknown as Record<string, number>)[key] = value
      }
    })
  }

  // Apply HSL adjustments
  if (preset.adjustments.hsl) {
    Object.entries(preset.adjustments.hsl).forEach(([color, values]) => {
      if (values && color in newState.hsl) {
        const colorKey = color as keyof HSLAdjustments
        if (values.hue !== undefined) newState.hsl[colorKey].hue = values.hue
        if (values.saturation !== undefined) newState.hsl[colorKey].saturation = values.saturation
        if (values.luminance !== undefined) newState.hsl[colorKey].luminance = values.luminance
      }
    })
  }

  // Apply color grading
  if (preset.adjustments.colorGrading) {
    const cg = preset.adjustments.colorGrading
    if (cg.shadows) {
      if (cg.shadows.hue !== undefined) newState.colorGrading.shadows.hue = cg.shadows.hue
      if (cg.shadows.saturation !== undefined) newState.colorGrading.shadows.saturation = cg.shadows.saturation
      if (cg.shadows.luminance !== undefined) newState.colorGrading.shadows.luminance = cg.shadows.luminance
    }
    if (cg.midtones) {
      if (cg.midtones.hue !== undefined) newState.colorGrading.midtones.hue = cg.midtones.hue
      if (cg.midtones.saturation !== undefined) newState.colorGrading.midtones.saturation = cg.midtones.saturation
      if (cg.midtones.luminance !== undefined) newState.colorGrading.midtones.luminance = cg.midtones.luminance
    }
    if (cg.highlights) {
      if (cg.highlights.hue !== undefined) newState.colorGrading.highlights.hue = cg.highlights.hue
      if (cg.highlights.saturation !== undefined) newState.colorGrading.highlights.saturation = cg.highlights.saturation
      if (cg.highlights.luminance !== undefined) newState.colorGrading.highlights.luminance = cg.highlights.luminance
    }
    if (cg.balance !== undefined) newState.colorGrading.balance = cg.balance
    if (cg.blending !== undefined) newState.colorGrading.blending = cg.blending
  }

  // Apply tone curve
  if (preset.adjustments.toneCurve) {
    if (preset.adjustments.toneCurve.rgb) {
      newState.toneCurve.rgb = preset.adjustments.toneCurve.rgb
    }
    if (preset.adjustments.toneCurve.red) {
      newState.toneCurve.red = preset.adjustments.toneCurve.red
    }
    if (preset.adjustments.toneCurve.green) {
      newState.toneCurve.green = preset.adjustments.toneCurve.green
    }
    if (preset.adjustments.toneCurve.blue) {
      newState.toneCurve.blue = preset.adjustments.toneCurve.blue
    }
  }

  // Apply vignette
  if (preset.adjustments.vignette) {
    if (preset.adjustments.vignette.amount !== undefined) {
      newState.effects.vignette.amount = preset.adjustments.vignette.amount
    }
    if (preset.adjustments.vignette.midpoint !== undefined) {
      newState.effects.vignette.midpoint = preset.adjustments.vignette.midpoint
    }
    if (preset.adjustments.vignette.feather !== undefined) {
      newState.effects.vignette.feather = preset.adjustments.vignette.feather
    }
  }

  // Apply grain
  if (preset.adjustments.grain) {
    if (preset.adjustments.grain.amount !== undefined) {
      newState.effects.grain.amount = preset.adjustments.grain.amount
    }
    if (preset.adjustments.grain.size !== undefined) {
      newState.effects.grain.size = preset.adjustments.grain.size
    }
    if (preset.adjustments.grain.roughness !== undefined) {
      newState.effects.grain.roughness = preset.adjustments.grain.roughness
    }
  }

  return newState
}
