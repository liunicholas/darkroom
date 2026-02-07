'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { applyPreset, PresetData } from '@/lib/presets/fujifilm-presets'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AIResponse {
  explanation: string
  adjustments: PresetData['adjustments']
}

// Labels for adjustment keys
const BASIC_LABELS: Record<string, string> = {
  exposure: 'Exposure',
  contrast: 'Contrast',
  highlights: 'Highlights',
  shadows: 'Shadows',
  whites: 'Whites',
  blacks: 'Blacks',
  texture: 'Texture',
  clarity: 'Clarity',
  dehaze: 'Dehaze',
  temperature: 'Temperature',
  tint: 'Tint',
  vibrance: 'Vibrance',
  saturation: 'Saturation',
}

function formatValue(v: number): string {
  return v > 0 ? `+${v}` : `${v}`
}

function computeChangeList(adjustments: PresetData['adjustments']): { label: string; value: string }[] {
  const changes: { label: string; value: string }[] = []

  if (adjustments.basic) {
    for (const [key, value] of Object.entries(adjustments.basic)) {
      if (value !== undefined && value !== 0) {
        changes.push({ label: BASIC_LABELS[key] || key, value: formatValue(value) })
      }
    }
  }

  if (adjustments.hsl) {
    for (const [color, vals] of Object.entries(adjustments.hsl)) {
      if (!vals) continue
      for (const [prop, value] of Object.entries(vals)) {
        if (value !== undefined && value !== 0) {
          changes.push({ label: `${color} ${prop}`, value: formatValue(value as number) })
        }
      }
    }
  }

  if (adjustments.colorGrading) {
    for (const [wheel, vals] of Object.entries(adjustments.colorGrading)) {
      if (!vals || typeof vals !== 'object') continue
      for (const [prop, value] of Object.entries(vals as unknown as Record<string, number>)) {
        if (value !== undefined && value !== 0) {
          changes.push({ label: `${wheel} ${prop}`, value: formatValue(value) })
        }
      }
    }
  }

  if (adjustments.vignette) {
    for (const [prop, value] of Object.entries(adjustments.vignette)) {
      if (value !== undefined && value !== 0) {
        changes.push({ label: `Vignette ${prop}`, value: formatValue(value) })
      }
    }
  }

  if (adjustments.grain) {
    for (const [prop, value] of Object.entries(adjustments.grain)) {
      if (value !== undefined && value !== 0) {
        changes.push({ label: `Grain ${prop}`, value: formatValue(value) })
      }
    }
  }

  return changes
}

export function AIEditSection() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [savePresetName, setSavePresetName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const messageHistory = useEditorStore((state) => state.aiChatMessages) as ChatMessage[]
  const lastResponse = useEditorStore((state) => state.aiLastResponse) as AIResponse | null
  const setAIChatState = useEditorStore((state) => state.setAIChatState)
  const editState = useEditorStore((state) => state.editState)
  const applyPresetAction = useEditorStore((state) => state.applyPreset)
  const imageSource = useEditorStore((state) => state.imageSource)
  const addCustomPreset = useEditorStore((state) => state.addCustomPreset)
  const undo = useEditorStore((state) => state.undo)
  const canUndo = useEditorStore((state) => state.canUndo)
  const aiInputFocusRequested = useEditorStore((state) => state.aiInputFocusRequested)
  const clearAIInputFocusRequest = useEditorStore((state) => state.clearAIInputFocusRequest)

  // Handle focus request from header button or / shortcut
  useEffect(() => {
    if (aiInputFocusRequested) {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      clearAIInputFocusRequest()
    }
  }, [aiInputFocusRequested, clearAIInputFocusRequest])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !imageSource) return

    const userMessage = input.trim()
    setInput('')

    const newHistory: ChatMessage[] = [...messageHistory, { role: 'user', content: userMessage }]
    setAIChatState(newHistory, lastResponse)
    setIsLoading(true)

    try {
      // Send full edit state context
      const currentState = {
        basic: editState.basic,
        hsl: editState.hsl,
        colorGrading: editState.colorGrading,
        effects: editState.effects,
      }

      // Send last 5 messages for conversational context
      const recentMessages = newHistory.slice(-5)

      const response = await fetch('/api/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentState,
          history: recentMessages,
        }),
      })

      const data = await response.json()

      if (data.error) {
        const errorHistory: ChatMessage[] = [
          ...newHistory,
          { role: 'assistant', content: `Error: ${data.error}` },
        ]
        setAIChatState(errorHistory, null)
      } else {
        const aiResponse: AIResponse = {
          explanation: data.explanation || 'Applied adjustments.',
          adjustments: data.adjustments || {},
        }

        const successHistory: ChatMessage[] = [
          ...newHistory,
          { role: 'assistant', content: aiResponse.explanation },
        ]
        setAIChatState(successHistory, aiResponse)

        // Auto-apply the adjustments
        const preset: PresetData = {
          name: 'AI Edit',
          description: aiResponse.explanation,
          category: 'custom',
          adjustments: aiResponse.adjustments,
        }
        const newState = applyPreset(editState, preset)
        applyPresetAction(newState)
      }
    } catch {
      const catchHistory: ChatMessage[] = [
        ...newHistory,
        { role: 'assistant', content: 'Failed to connect to AI service.' },
      ]
      setAIChatState(catchHistory, lastResponse)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, imageSource, editState, applyPresetAction, messageHistory, lastResponse, setAIChatState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleUndo = useCallback(() => {
    if (canUndo()) {
      undo()
      setAIChatState(messageHistory, null)
    }
  }, [undo, canUndo, setAIChatState, messageHistory])

  const handleSaveAsPreset = useCallback(() => {
    setSavePresetName('')
    setSaveModalOpen(true)
  }, [])

  const confirmSavePreset = useCallback(() => {
    if (!lastResponse?.adjustments || !savePresetName.trim()) return

    const preset: PresetData = {
      name: savePresetName.trim(),
      description: lastResponse.explanation,
      category: 'custom',
      adjustments: lastResponse.adjustments,
    }
    addCustomPreset(preset)
    setSaveModalOpen(false)
  }, [lastResponse, savePresetName, addCustomPreset])

  const hasImage = !!imageSource
  const changes = lastResponse ? computeChangeList(lastResponse.adjustments) : []

  return (
    <div className="border-b border-dark-400">
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Rubin</p>

        {/* Input */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasImage ? 'Try "make it warmer" or "cinematic look"' : 'Import an image first'}
            disabled={!hasImage || isLoading}
            className="flex-1 px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !hasImage}
            className="p-2 bg-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 mt-3">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Last response */}
        {lastResponse && !isLoading && (
          <div className="mt-3 space-y-2">
            {/* Explanation */}
            <p className="text-xs text-gray-400">{lastResponse.explanation}</p>

            {/* Change list */}
            {changes.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Changes</p>
                {changes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 capitalize">{c.label}</span>
                    <span className="text-white tabular-nums font-mono">{c.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleUndo}
                className="px-2.5 py-1 text-xs rounded-md bg-dark-600 hover:bg-dark-500 text-gray-300 transition-colors"
              >
                Undo
              </button>
              <button
                onClick={handleSaveAsPreset}
                className="px-2.5 py-1 text-xs rounded-md bg-dark-600 hover:bg-dark-500 text-gray-300 transition-colors"
              >
                Save as Preset
              </button>
            </div>
          </div>
        )}

        {/* Empty state hint (no response yet, not loading) */}
        {!lastResponse && !isLoading && hasImage && (
          <p className="text-[10px] text-gray-600 mt-2">
            Describe what you want and adjustments will be applied automatically
          </p>
        )}
      </div>

      {/* Save preset modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-700 border border-dark-500 rounded-lg p-4 w-72">
            <h3 className="text-sm font-medium text-white mb-3">Save as Preset</h3>
            <input
              type="text"
              value={savePresetName}
              onChange={(e) => setSavePresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmSavePreset()}
              placeholder="Preset name..."
              className="w-full px-3 py-2 bg-dark-800 border border-dark-500 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSavePreset}
                disabled={!savePresetName.trim()}
                className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
