import { vertexShaderSource, fragmentShaderSource } from './shaders'
import type { EditState } from '@/types/edit-state'

export class WebGLRenderer {
  private canvas: HTMLCanvasElement | OffscreenCanvas
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private imageTexture: WebGLTexture | null = null
  private curveLUT: WebGLTexture | null = null
  private positionBuffer: WebGLBuffer
  private texCoordBuffer: WebGLBuffer
  private vao: WebGLVertexArrayObject

  // Uniform locations
  private uniforms: Record<string, WebGLUniformLocation | null> = {}

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.canvas = canvas
    const glContext = canvas.getContext('webgl2', {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false, // We don't need AA for image processing
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })

    if (!glContext) {
      throw new Error('WebGL2 not supported')
    }

    const gl = glContext as WebGL2RenderingContext
    this.gl = gl

    // Create shader program
    this.program = this.createProgram()

    // Create buffers
    this.positionBuffer = this.createBuffer([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ])

    this.texCoordBuffer = this.createBuffer([
      0, 1,
      1, 1,
      0, 0,
      1, 0,
    ])

    // Create VAO
    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)

    // Setup position attribute
    const posLoc = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    // Setup texCoord attribute
    const texLoc = gl.getAttribLocation(this.program, 'a_texCoord')
    gl.enableVertexAttribArray(texLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0)

    gl.bindVertexArray(null)

    // Cache uniform locations
    this.cacheUniforms()
  }

  private createProgram(): WebGLProgram {
    const gl = this.gl

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program)
      gl.deleteProgram(program)
      throw new Error(`Failed to link program: ${error}`)
    }

    // Clean up shaders
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return program
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(`Failed to compile shader: ${error}`)
    }

    return shader
  }

  private createBuffer(data: number[]): WebGLBuffer {
    const gl = this.gl
    const buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    return buffer
  }

  private cacheUniforms(): void {
    const gl = this.gl
    const program = this.program

    const uniformNames = [
      'u_image', 'u_curveLUT', 'u_useCurve',
      'u_exposure', 'u_contrast', 'u_highlights', 'u_shadows',
      'u_whites', 'u_blacks', 'u_temperature', 'u_tint',
      'u_vibrance', 'u_saturation', 'u_clarity', 'u_dehaze',
      'u_vignetteAmount', 'u_vignetteMidpoint', 'u_vignetteFeather',
      'u_grainAmount', 'u_grainSize', 'u_resolution', 'u_time',
      'u_hslRed', 'u_hslOrange', 'u_hslYellow', 'u_hslGreen',
      'u_hslAqua', 'u_hslBlue', 'u_hslPurple', 'u_hslMagenta',
      'u_shadowsColor', 'u_midtonesColor', 'u_highlightsColor', 'u_colorBalance',
    ]

    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(program, name)
    }
  }

  setImage(image: ImageBitmap | HTMLImageElement | HTMLCanvasElement): void {
    const gl = this.gl

    if (this.imageTexture) {
      gl.deleteTexture(this.imageTexture)
    }

    this.imageTexture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture)

    // Upload image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  private updateCurveLUT(toneCurve: EditState['toneCurve']): void {
    const gl = this.gl

    // Create a 256-wide LUT texture
    const lutData = new Uint8Array(256 * 4)

    for (let i = 0; i < 256; i++) {
      const t = i / 255

      // Apply RGB curve, then individual channel curves
      const rgbValue = this.interpolateCurve(toneCurve.rgb, t)
      lutData[i * 4 + 0] = Math.round(this.interpolateCurve(toneCurve.red, rgbValue) * 255)
      lutData[i * 4 + 1] = Math.round(this.interpolateCurve(toneCurve.green, rgbValue) * 255)
      lutData[i * 4 + 2] = Math.round(this.interpolateCurve(toneCurve.blue, rgbValue) * 255)
      lutData[i * 4 + 3] = 255
    }

    if (!this.curveLUT) {
      this.curveLUT = gl.createTexture()
    }

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.curveLUT)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, lutData)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  private interpolateCurve(points: { x: number; y: number }[], t: number): number {
    if (points.length === 0) return t
    if (points.length === 1) return points[0].y

    // Sort points by x
    const sorted = [...points].sort((a, b) => a.x - b.x)

    // Find surrounding points
    let i = 0
    while (i < sorted.length - 1 && sorted[i + 1].x < t) {
      i++
    }

    if (i >= sorted.length - 1) {
      return sorted[sorted.length - 1].y
    }

    const p0 = sorted[Math.max(0, i - 1)]
    const p1 = sorted[i]
    const p2 = sorted[Math.min(sorted.length - 1, i + 1)]
    const p3 = sorted[Math.min(sorted.length - 1, i + 2)]

    // Catmull-Rom spline interpolation
    const dx = p2.x - p1.x
    if (dx === 0) return p1.y

    const u = (t - p1.x) / dx

    const t0 = p1.y
    const t1 = (p2.y - p0.y) * 0.5
    const t2 = (p3.y - p1.y) * 0.5

    const u2 = u * u
    const u3 = u2 * u

    const result = t0 + t1 * u + (3 * (p2.y - p1.y) - 2 * t1 - t2) * u2 + (-2 * (p2.y - p1.y) + t1 + t2) * u3

    return Math.max(0, Math.min(1, result))
  }

  private isCurveModified(toneCurve: EditState['toneCurve']): boolean {
    const isDefault = (points: { x: number; y: number }[]) =>
      points.length === 2 &&
      points[0].x === 0 && points[0].y === 0 &&
      points[1].x === 1 && points[1].y === 1

    return !isDefault(toneCurve.rgb) ||
           !isDefault(toneCurve.red) ||
           !isDefault(toneCurve.green) ||
           !isDefault(toneCurve.blue)
  }

  render(editState: EditState): void {
    const gl = this.gl
    const { basic, toneCurve, hsl, colorGrading, effects } = editState

    if (!this.imageTexture) return

    // Set viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    // Clear
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Use program
    gl.useProgram(this.program)
    gl.bindVertexArray(this.vao)

    // Bind image texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture)
    gl.uniform1i(this.uniforms['u_image'], 0)

    // Update and bind curve LUT
    const useCurve = this.isCurveModified(toneCurve)
    if (useCurve) {
      this.updateCurveLUT(toneCurve)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.curveLUT)
      gl.uniform1i(this.uniforms['u_curveLUT'], 1)
    }
    gl.uniform1i(this.uniforms['u_useCurve'], useCurve ? 1 : 0)

    // Basic adjustments
    gl.uniform1f(this.uniforms['u_exposure'], basic.exposure)
    gl.uniform1f(this.uniforms['u_contrast'], basic.contrast)
    gl.uniform1f(this.uniforms['u_highlights'], basic.highlights)
    gl.uniform1f(this.uniforms['u_shadows'], basic.shadows)
    gl.uniform1f(this.uniforms['u_whites'], basic.whites)
    gl.uniform1f(this.uniforms['u_blacks'], basic.blacks)
    gl.uniform1f(this.uniforms['u_temperature'], basic.temperature)
    gl.uniform1f(this.uniforms['u_tint'], basic.tint)
    gl.uniform1f(this.uniforms['u_vibrance'], basic.vibrance)
    gl.uniform1f(this.uniforms['u_saturation'], basic.saturation)
    gl.uniform1f(this.uniforms['u_clarity'], basic.clarity)
    gl.uniform1f(this.uniforms['u_dehaze'], basic.dehaze)

    // Vignette
    gl.uniform1f(this.uniforms['u_vignetteAmount'], effects.vignette.amount)
    gl.uniform1f(this.uniforms['u_vignetteMidpoint'], effects.vignette.midpoint)
    gl.uniform1f(this.uniforms['u_vignetteFeather'], effects.vignette.feather)

    // Grain
    gl.uniform1f(this.uniforms['u_grainAmount'], effects.grain.amount)
    gl.uniform1f(this.uniforms['u_grainSize'], effects.grain.size)
    gl.uniform2f(this.uniforms['u_resolution'], this.canvas.width, this.canvas.height)
    gl.uniform1f(this.uniforms['u_time'], performance.now() * 0.001)

    // HSL adjustments
    gl.uniform3f(this.uniforms['u_hslRed'], hsl.red.hue, hsl.red.saturation, hsl.red.luminance)
    gl.uniform3f(this.uniforms['u_hslOrange'], hsl.orange.hue, hsl.orange.saturation, hsl.orange.luminance)
    gl.uniform3f(this.uniforms['u_hslYellow'], hsl.yellow.hue, hsl.yellow.saturation, hsl.yellow.luminance)
    gl.uniform3f(this.uniforms['u_hslGreen'], hsl.green.hue, hsl.green.saturation, hsl.green.luminance)
    gl.uniform3f(this.uniforms['u_hslAqua'], hsl.aqua.hue, hsl.aqua.saturation, hsl.aqua.luminance)
    gl.uniform3f(this.uniforms['u_hslBlue'], hsl.blue.hue, hsl.blue.saturation, hsl.blue.luminance)
    gl.uniform3f(this.uniforms['u_hslPurple'], hsl.purple.hue, hsl.purple.saturation, hsl.purple.luminance)
    gl.uniform3f(this.uniforms['u_hslMagenta'], hsl.magenta.hue, hsl.magenta.saturation, hsl.magenta.luminance)

    // Color grading
    gl.uniform3f(this.uniforms['u_shadowsColor'], colorGrading.shadows.hue, colorGrading.shadows.saturation, colorGrading.shadows.luminance)
    gl.uniform3f(this.uniforms['u_midtonesColor'], colorGrading.midtones.hue, colorGrading.midtones.saturation, colorGrading.midtones.luminance)
    gl.uniform3f(this.uniforms['u_highlightsColor'], colorGrading.highlights.hue, colorGrading.highlights.saturation, colorGrading.highlights.luminance)
    gl.uniform1f(this.uniforms['u_colorBalance'], colorGrading.balance)

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.bindVertexArray(null)
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
  }

  dispose(): void {
    const gl = this.gl

    if (this.imageTexture) gl.deleteTexture(this.imageTexture)
    if (this.curveLUT) gl.deleteTexture(this.curveLUT)
    gl.deleteBuffer(this.positionBuffer)
    gl.deleteBuffer(this.texCoordBuffer)
    gl.deleteVertexArray(this.vao)
    gl.deleteProgram(this.program)
  }
}
