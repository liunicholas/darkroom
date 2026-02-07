import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an AI photo editing assistant for Darkroom, a professional photo editor. You help users adjust their photos by returning precise editing parameters.

Available parameters and their ranges:
- exposure: -5 to 5 (stops of exposure compensation)
- contrast: -100 to 100
- highlights: -100 to 100
- shadows: -100 to 100
- whites: -100 to 100
- blacks: -100 to 100
- texture: -100 to 100
- clarity: -100 to 100
- dehaze: -100 to 100
- temperature: -100 to 100 (negative = cooler/bluer, positive = warmer/yellower)
- tint: -150 to 150 (negative = greener, positive = more magenta)
- vibrance: -100 to 100
- saturation: -100 to 100

HSL adjustments (for colors: red, orange, yellow, green, aqua, blue, purple, magenta):
- hue: -100 to 100
- saturation: -100 to 100
- luminance: -100 to 100

Color grading (for shadows, midtones, highlights, global):
- hue: 0-360
- saturation: 0-100
- luminance: -100 to 100

Effects:
- vignette amount: -100 to 100
- vignette midpoint: 0-100
- vignette feather: 0-100
- grain amount: 0-100
- grain size: 0-100
- grain roughness: 0-100

Tone curve: array of {x, y} points where x and y are 0-1

You MUST respond with valid JSON in this exact format:
{
  "explanation": "Brief description of what changes were made and why",
  "adjustments": {
    "basic": { ... },
    "hsl": { ... },
    "colorGrading": { ... },
    "toneCurve": { ... },
    "vignette": { ... },
    "grain": { ... }
  }
}

Only include parameters you want to change. Omit sections that don't need changes. Be creative but tasteful. Provide moderate adjustments unless the user asks for something dramatic.`

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to .env.local' },
      { status: 500 }
    )
  }

  try {
    const { message, currentState, history } = await request.json()

    const userMessage = currentState
      ? `Current edit state: ${JSON.stringify(currentState)}\n\nUser request: ${message}`
      : message

    // Build messages array with conversation history
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    // Add prior conversation history if provided
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(0, -1)) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    messages.push({ role: 'user', content: userMessage })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(content)
      return NextResponse.json(parsed)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim())
        return NextResponse.json(parsed)
      }
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: content },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('AI edit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
