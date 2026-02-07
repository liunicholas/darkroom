import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { EditState, HistoryEntry, FlagStatus } from '@/types/edit-state'
import type { PresetData } from '@/lib/presets/fujifilm-presets'

// Per-image record stored in IndexedDB
export interface PersistedImage {
  id: string
  fileName: string
  originalWidth: number
  originalHeight: number
  imageBlob: Blob
  thumbnail: string | null
  editState: EditState
  history: HistoryEntry[]
  historyIndex: number
  rating: number
  flagStatus: FlagStatus
  aiChatMessages: { role: string; content: string }[]
  aiLastResponse: { explanation: string; adjustments: unknown } | null
}

// Session metadata record
export interface SessionData {
  id: 'session' // single-record key
  currentImageIndex: number
  customPresets: PresetData[]
  filterFlag: 'all' | 'picked' | 'rejected' | 'unflagged'
  filterRating: number
  viewMode: 'edit' | 'grid'
}

interface DarkroomDB extends DBSchema {
  images: {
    key: string
    value: PersistedImage
  }
  session: {
    key: string
    value: SessionData
  }
}

const DB_NAME = 'darkroom-session'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<DarkroomDB>> | null = null

function getDB(): Promise<IDBPDatabase<DarkroomDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DarkroomDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveImage(data: PersistedImage): Promise<void> {
  const db = await getDB()
  await db.put('images', data)
}

export async function loadAllImages(): Promise<PersistedImage[]> {
  const db = await getDB()
  return db.getAll('images')
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('images', id)
}

export async function clearAllImages(): Promise<void> {
  const db = await getDB()
  await db.clear('images')
}

export async function saveSession(data: Omit<SessionData, 'id'>): Promise<void> {
  const db = await getDB()
  await db.put('session', { id: 'session', ...data })
}

export async function loadSession(): Promise<SessionData | undefined> {
  const db = await getDB()
  return db.get('session', 'session')
}
