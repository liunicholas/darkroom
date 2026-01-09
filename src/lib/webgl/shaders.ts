// Vertex shader - simple passthrough
export const vertexShaderSource = `#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

// Fragment shader for all adjustments
export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_image;

// Basic adjustments
uniform float u_exposure;
uniform float u_contrast;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_whites;
uniform float u_blacks;
uniform float u_temperature;
uniform float u_tint;
uniform float u_vibrance;
uniform float u_saturation;
uniform float u_clarity;
uniform float u_dehaze;

// Vignette
uniform float u_vignetteAmount;
uniform float u_vignetteMidpoint;
uniform float u_vignetteFeather;

// Grain
uniform float u_grainAmount;
uniform float u_grainSize;
uniform vec2 u_resolution;
uniform float u_time;

// Tone curve LUT
uniform sampler2D u_curveLUT;
uniform bool u_useCurve;

// HSL adjustments (8 colors x 3 values = 24 uniforms, packed into arrays)
uniform vec3 u_hslRed;      // hue, sat, lum
uniform vec3 u_hslOrange;
uniform vec3 u_hslYellow;
uniform vec3 u_hslGreen;
uniform vec3 u_hslAqua;
uniform vec3 u_hslBlue;
uniform vec3 u_hslPurple;
uniform vec3 u_hslMagenta;

// Color grading
uniform vec3 u_shadowsColor;    // hue, sat, lum
uniform vec3 u_midtonesColor;
uniform vec3 u_highlightsColor;
uniform float u_colorBalance;

// Helper functions
vec3 rgb2hsl(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float l = (maxC + minC) / 2.0;

  if (maxC == minC) {
    return vec3(0.0, 0.0, l);
  }

  float d = maxC - minC;
  float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

  float h;
  if (maxC == c.r) {
    h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  } else if (maxC == c.g) {
    h = (c.b - c.r) / d + 2.0;
  } else {
    h = (c.r - c.g) / d + 4.0;
  }
  h /= 6.0;

  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  if (hsl.y == 0.0) {
    return vec3(hsl.z);
  }

  float q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
  float p = 2.0 * hsl.z - q;

  float r = hue2rgb(p, q, hsl.x + 1.0/3.0);
  float g = hue2rgb(p, q, hsl.x);
  float b = hue2rgb(p, q, hsl.x - 1.0/3.0);

  return vec3(r, g, b);
}

// Random noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Soft light blend mode
float softLight(float base, float blend) {
  if (blend < 0.5) {
    return 2.0 * base * blend + base * base * (1.0 - 2.0 * blend);
  } else {
    return sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend);
  }
}

vec3 softLightBlend(vec3 base, vec3 blend) {
  return vec3(
    softLight(base.r, blend.r),
    softLight(base.g, blend.g),
    softLight(base.b, blend.b)
  );
}

// Get HSL adjustment for a given hue
vec3 getHSLAdjustment(float hue) {
  // Normalize hue to 0-1
  hue = fract(hue);

  // Define hue ranges for 8 colors (red, orange, yellow, green, aqua, blue, purple, magenta)
  // Each color occupies 1/8 of the hue wheel with smooth transitions

  float segment = hue * 8.0;
  int idx = int(floor(segment));
  float blend = fract(segment);

  vec3 adjustments[8];
  adjustments[0] = u_hslRed;
  adjustments[1] = u_hslOrange;
  adjustments[2] = u_hslYellow;
  adjustments[3] = u_hslGreen;
  adjustments[4] = u_hslAqua;
  adjustments[5] = u_hslBlue;
  adjustments[6] = u_hslPurple;
  adjustments[7] = u_hslMagenta;

  vec3 current = adjustments[idx];
  vec3 next = adjustments[(idx + 1) % 8];

  // Smooth transition using smoothstep
  float t = smoothstep(0.0, 1.0, blend);
  return mix(current, next, t);
}

void main() {
  vec4 texColor = texture(u_image, v_texCoord);
  vec3 color = texColor.rgb;

  // --- White Balance ---
  // Temperature: shift toward blue (-) or orange (+)
  float temp = u_temperature / 100.0;
  color.r += temp * 0.1;
  color.b -= temp * 0.1;

  // Tint: shift toward green (-) or magenta (+)
  float tint = u_tint / 100.0;
  color.g -= tint * 0.05;
  color.r += tint * 0.025;
  color.b += tint * 0.025;

  // --- Exposure ---
  // Exposure in stops: 2^exposure
  float exposureFactor = pow(2.0, u_exposure);
  color *= exposureFactor;

  // --- Contrast ---
  float contrast = u_contrast / 100.0;
  color = (color - 0.5) * (1.0 + contrast) + 0.5;

  // --- Highlights/Shadows/Whites/Blacks ---
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));

  // Highlights affect bright areas
  float highlightMask = smoothstep(0.5, 1.0, luminance);
  float highlightAdj = u_highlights / 100.0 * highlightMask;
  color = color + vec3(highlightAdj) * (1.0 - color);

  // Shadows affect dark areas
  float shadowMask = 1.0 - smoothstep(0.0, 0.5, luminance);
  float shadowAdj = u_shadows / 100.0 * shadowMask;
  color = color + vec3(shadowAdj) * color;

  // Whites - push white point
  float whiteMask = smoothstep(0.75, 1.0, luminance);
  float whiteAdj = u_whites / 100.0 * whiteMask;
  color = color + vec3(whiteAdj) * (1.0 - color);

  // Blacks - push black point
  float blackMask = 1.0 - smoothstep(0.0, 0.25, luminance);
  float blackAdj = u_blacks / 100.0 * blackMask;
  color = color - vec3(blackAdj) * color;

  // --- Dehaze ---
  if (abs(u_dehaze) > 0.01) {
    float dehaze = u_dehaze / 100.0;
    // Simple dehaze: increase contrast in shadows and midtones
    float dehazeL = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float dehazeMask = 1.0 - smoothstep(0.0, 0.8, dehazeL);
    color = mix(color, color * (1.0 + dehaze * 0.5), dehazeMask);
    // Also boost saturation slightly
    vec3 dehazeHSL = rgb2hsl(color);
    dehazeHSL.y = clamp(dehazeHSL.y * (1.0 + dehaze * 0.2), 0.0, 1.0);
    color = hsl2rgb(dehazeHSL);
  }

  // --- Tone Curve ---
  if (u_useCurve) {
    color.r = texture(u_curveLUT, vec2(color.r, 0.5)).r;
    color.g = texture(u_curveLUT, vec2(color.g, 0.5)).g;
    color.b = texture(u_curveLUT, vec2(color.b, 0.5)).b;
  }

  // --- HSL Adjustments ---
  vec3 hsl = rgb2hsl(color);
  if (hsl.y > 0.05) { // Only adjust if there's some saturation
    vec3 hslAdj = getHSLAdjustment(hsl.x);

    // Hue shift
    hsl.x = fract(hsl.x + hslAdj.x / 360.0);

    // Saturation
    hsl.y = clamp(hsl.y * (1.0 + hslAdj.y / 100.0), 0.0, 1.0);

    // Luminance
    hsl.z = clamp(hsl.z + hslAdj.z / 100.0 * 0.5, 0.0, 1.0);

    color = hsl2rgb(hsl);
  }

  // --- Color Grading ---
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));

  // Calculate masks for shadows, midtones, highlights
  float shadowRange = smoothstep(0.0, 0.33, lum);
  float highlightRange = smoothstep(0.66, 1.0, lum);
  float midtoneRange = 1.0 - shadowRange - highlightRange;

  // Apply balance
  float balance = u_colorBalance / 100.0;
  shadowRange *= (1.0 - balance * 0.5);
  highlightRange *= (1.0 + balance * 0.5);

  // Apply color grading
  if (u_shadowsColor.y > 0.0) {
    vec3 shadowTint = hsl2rgb(vec3(u_shadowsColor.x / 360.0, u_shadowsColor.y / 100.0, 0.5));
    color = mix(color, softLightBlend(color, shadowTint), (1.0 - shadowRange) * 0.3);
  }

  if (u_midtonesColor.y > 0.0) {
    vec3 midTint = hsl2rgb(vec3(u_midtonesColor.x / 360.0, u_midtonesColor.y / 100.0, 0.5));
    color = mix(color, softLightBlend(color, midTint), midtoneRange * 0.3);
  }

  if (u_highlightsColor.y > 0.0) {
    vec3 highTint = hsl2rgb(vec3(u_highlightsColor.x / 360.0, u_highlightsColor.y / 100.0, 0.5));
    color = mix(color, softLightBlend(color, highTint), highlightRange * 0.3);
  }

  // --- Vibrance ---
  // Vibrance boosts saturation of less saturated colors more
  vec3 vibHSL = rgb2hsl(color);
  float vibrance = u_vibrance / 100.0;
  float satBoost = vibrance * (1.0 - vibHSL.y); // Less saturated = more boost
  vibHSL.y = clamp(vibHSL.y + satBoost * 0.5, 0.0, 1.0);
  color = hsl2rgb(vibHSL);

  // --- Saturation ---
  float sat = u_saturation / 100.0;
  vec3 satHSL = rgb2hsl(color);
  satHSL.y = clamp(satHSL.y * (1.0 + sat), 0.0, 1.0);
  color = hsl2rgb(satHSL);

  // --- Clarity (local contrast) ---
  // Simple clarity: boost midtone contrast
  if (abs(u_clarity) > 0.01) {
    float clarity = u_clarity / 100.0;
    float clarityLum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float clarityMask = 1.0 - abs(clarityLum - 0.5) * 2.0; // Peak at midtones
    color = mix(color, (color - 0.5) * (1.0 + clarity * 0.5) + 0.5, clarityMask * 0.5);
  }

  // --- Vignette ---
  if (abs(u_vignetteAmount) > 0.01) {
    vec2 vigUV = v_texCoord - 0.5;
    float vigDist = length(vigUV) * 1.414; // Normalize to 0-1 for corners
    float vigMidpoint = u_vignetteMidpoint / 100.0;
    float vigFeather = max(0.01, u_vignetteFeather / 100.0);
    float vig = smoothstep(vigMidpoint - vigFeather, vigMidpoint + vigFeather, vigDist);
    float vigAmount = u_vignetteAmount / 100.0;
    color = mix(color, color * (1.0 - vigAmount), vig);
  }

  // --- Film Grain ---
  if (u_grainAmount > 0.01) {
    float grainAmount = u_grainAmount / 100.0;
    float grainScale = 1.0 / max(1.0, u_grainSize);
    vec2 grainUV = v_texCoord * u_resolution * grainScale;
    float noise = random(grainUV + u_time) * 2.0 - 1.0;
    color += noise * grainAmount * 0.15;
  }

  // Clamp final output
  color = clamp(color, 0.0, 1.0);

  fragColor = vec4(color, texColor.a);
}
`
