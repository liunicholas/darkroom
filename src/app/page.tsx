'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/stores/editor-store'

export default function Home() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const loadImage = useEditorStore((state) => state.loadImage)
  const loadImages = useEditorStore((state) => state.loadImages)

  const handleFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(file =>
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|gif|webp|bmp|tiff?)$/i.test(file.name)
    )

    if (imageFiles.length === 0) {
      return
    }

    setIsLoading(true)

    try {
      if (imageFiles.length === 1) {
        await loadImage(imageFiles[0])
      } else {
        await loadImages(imageFiles)
      }
      router.push('/editor')
    } catch (error) {
      console.error('Failed to load images:', error)
      setIsLoading(false)
    }
  }, [loadImage, loadImages, router])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const items = e.dataTransfer.items
    const collectedFiles: File[] = []

    // Get file from FileSystemFileEntry
    const getFile = (fileEntry: FileSystemFileEntry): Promise<File> => {
      return new Promise((resolve, reject) => {
        fileEntry.file(resolve, reject)
      })
    }

    // Read all entries from a directory (handles batching)
    const readAllEntries = (dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
      return new Promise((resolve, reject) => {
        const entries: FileSystemEntry[] = []
        const readBatch = () => {
          dirReader.readEntries((batch) => {
            if (batch.length === 0) {
              resolve(entries)
            } else {
              entries.push(...batch)
              readBatch()
            }
          }, reject)
        }
        readBatch()
      })
    }

    // Recursively read directory entries
    const readEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        try {
          const file = await getFile(entry as FileSystemFileEntry)
          collectedFiles.push(file)
        } catch (err) {
          console.warn('Failed to read file:', entry.name, err)
        }
      } else if (entry.isDirectory) {
        try {
          const dirReader = (entry as FileSystemDirectoryEntry).createReader()
          const entries = await readAllEntries(dirReader)
          await Promise.all(entries.map(readEntry))
        } catch (err) {
          console.warn('Failed to read directory:', entry.name, err)
        }
      }
    }

    if (items && items.length > 0) {
      const entries: FileSystemEntry[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry?.()
          if (entry) {
            entries.push(entry)
          } else {
            const file = item.getAsFile()
            if (file) collectedFiles.push(file)
          }
        }
      }
      await Promise.all(entries.map(readEntry))
    } else if (e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        collectedFiles.push(e.dataTransfer.files[i])
      }
    }

    if (collectedFiles.length > 0) {
      handleFiles(collectedFiles)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [handleFiles])

  const handleFolderInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFiles(files)
    }
    if (folderInputRef.current) folderInputRef.current.value = ''
  }, [handleFiles])

  return (
    <main className="min-h-screen flex flex-col bg-stone-950">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderInput}
        className="hidden"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Logo */}
        <div
          className="mb-16 animate-fade-in"
          style={{ animationDelay: '0ms' }}
        >
          <h1 className="font-display text-6xl md:text-7xl text-stone-100 tracking-tight">
            Darkroom
          </h1>
          <p className="text-stone-500 text-center mt-3 text-sm tracking-wide">
            Develop your photographs
          </p>
        </div>

        {/* Drop zone */}
        <div
          className="w-full max-w-xl animate-fade-in"
          style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
        >
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => folderInputRef.current?.click()}
            className={`
              relative w-full aspect-[3/2] rounded-xl cursor-pointer
              border transition-all duration-300 ease-out
              flex flex-col items-center justify-center
              ${isDragging
                ? 'border-red-900 bg-red-900/5 scale-[1.01]'
                : 'border-stone-800 hover:border-stone-700 bg-stone-900/30'
              }
              ${isLoading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-950/60 rounded-xl z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-red-900 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-stone-400">Loading...</span>
                </div>
              </div>
            )}

            {/* Icon */}
            <div className={`
              mb-4 transition-all duration-300
              ${isDragging ? 'scale-110 text-red-900' : 'text-stone-600'}
            `}>
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
            </div>

            <p className={`text-sm transition-colors duration-300 ${
              isDragging ? 'text-red-900' : 'text-stone-400'
            }`}>
              {isDragging ? 'Drop to import' : 'Drop images or folders here'}
            </p>
            <p className="text-xs text-stone-600 mt-1">
              or click to browse
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-light rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Import Files
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click() }}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 hover:border-stone-600 rounded-lg text-stone-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              Import Folder
            </button>
          </div>
        </div>

        {/* Features */}
        <div
          className="mt-24 flex flex-wrap justify-center gap-12 text-center max-w-2xl animate-fade-in"
          style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
        >
          <Feature title="Light" desc="Exposure, contrast, shadows" />
          <Feature title="Color" desc="Temperature, HSL, grading" />
          <Feature title="Detail" desc="Curves, sharpening, effects" />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-stone-700">
          RAW &middot; JPEG &middot; PNG &middot; WebP &middot; TIFF
        </p>
      </footer>
    </main>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="w-32">
      <h3 className="text-stone-300 text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-stone-600">{desc}</p>
    </div>
  )
}
