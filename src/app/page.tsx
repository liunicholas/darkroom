'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/stores/editor-store'

export default function Home() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const loadImage = useEditorStore((state) => state.loadImage)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    await loadImage(file)
    router.push('/editor')
  }, [loadImage, router])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Logo and title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-display font-bold mb-4 tracking-tight">
          <span className="text-white">Dark</span>
          <span className="text-maroon">room</span>
        </h1>
        <p className="text-gray-400 text-lg font-light tracking-wide">
          Professional photo editing in your browser
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative w-full max-w-2xl aspect-video
          border-2 border-dashed rounded-xl
          flex flex-col items-center justify-center gap-4
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-maroon bg-maroon/10 scale-[1.02]'
            : 'border-dark-400 hover:border-maroon/50 hover:bg-dark-800/50'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {/* Upload icon */}
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-colors duration-200
          ${isDragging ? 'bg-maroon/20' : 'bg-dark-700'}
        `}>
          <svg
            className={`w-8 h-8 transition-colors ${isDragging ? 'text-maroon' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className={`text-lg font-medium transition-colors ${isDragging ? 'text-maroon' : 'text-white'}`}>
            {isDragging ? 'Drop your image here' : 'Drop an image or click to upload'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Supports JPEG, PNG, WebP
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl">
        <Feature
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
          }
          title="Light & Color"
          description="Exposure, contrast, highlights, shadows, and full color grading"
        />
        <Feature
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          }
          title="HSL & Curves"
          description="Per-color adjustments and tone curve editing"
        />
        <Feature
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Local Edits"
          description="Brush, radial, and linear gradient masking"
        />
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-600 text-sm">
        <p>Inspired by Adobe Lightroom • Fujifilm aesthetics</p>
      </footer>
    </main>
  )
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center mx-auto mb-3 text-maroon">
        {icon}
      </div>
      <h3 className="font-display font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 font-light">{description}</p>
    </div>
  )
}
