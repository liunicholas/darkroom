// Basic EXIF data extraction for JPEG images
// This is a simplified implementation that extracts common metadata

export interface ExifData {
  make?: string
  model?: string
  exposureTime?: string
  fNumber?: string
  iso?: number
  focalLength?: string
  dateTime?: string
  software?: string
  orientation?: number
  imageWidth?: number
  imageHeight?: number
  flash?: string
  whiteBalance?: string
  meteringMode?: string
  exposureMode?: string
  lensModel?: string
}

// EXIF tag IDs
const EXIF_TAGS: Record<number, keyof ExifData> = {
  0x010f: 'make',
  0x0110: 'model',
  0x829a: 'exposureTime',
  0x829d: 'fNumber',
  0x8827: 'iso',
  0x920a: 'focalLength',
  0x0132: 'dateTime',
  0x0131: 'software',
  0x0112: 'orientation',
  0xa002: 'imageWidth',
  0xa003: 'imageHeight',
  0x9209: 'flash',
  0xa403: 'whiteBalance',
  0x9207: 'meteringMode',
  0xa402: 'exposureMode',
  0xa434: 'lensModel',
}

export async function extractExifData(file: File): Promise<ExifData | null> {
  try {
    const arrayBuffer = await file.slice(0, 128 * 1024).arrayBuffer() // Read first 128KB
    const dataView = new DataView(arrayBuffer)

    // Check for JPEG magic bytes
    if (dataView.getUint16(0) !== 0xffd8) {
      return null // Not a JPEG
    }

    // Find EXIF segment (APP1 marker: 0xffe1)
    let offset = 2
    while (offset < dataView.byteLength - 4) {
      const marker = dataView.getUint16(offset)
      offset += 2

      if (marker === 0xffe1) {
        // Found APP1 segment
        const length = dataView.getUint16(offset)
        offset += 2

        // Check for "Exif\0\0" header
        const exifHeader = String.fromCharCode(
          dataView.getUint8(offset),
          dataView.getUint8(offset + 1),
          dataView.getUint8(offset + 2),
          dataView.getUint8(offset + 3)
        )

        if (exifHeader === 'Exif') {
          return parseExifData(dataView, offset + 6)
        }
      } else if ((marker & 0xff00) === 0xff00) {
        // Other marker, skip
        const length = dataView.getUint16(offset)
        offset += length
      } else {
        break
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting EXIF data:', error)
    return null
  }
}

function parseExifData(dataView: DataView, tiffOffset: number): ExifData {
  const exifData: ExifData = {}

  try {
    // Check byte order (II = little endian, MM = big endian)
    const byteOrder = dataView.getUint16(tiffOffset)
    const littleEndian = byteOrder === 0x4949

    // Verify TIFF marker (0x002a)
    if (dataView.getUint16(tiffOffset + 2, littleEndian) !== 0x002a) {
      return exifData
    }

    // Get offset to first IFD
    const firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian)

    // Parse IFD0 (main image IFD)
    parseIFD(dataView, tiffOffset + firstIFDOffset, tiffOffset, littleEndian, exifData)
  } catch {
    // Ignore parsing errors
  }

  return exifData
}

function parseIFD(
  dataView: DataView,
  ifdOffset: number,
  tiffOffset: number,
  littleEndian: boolean,
  exifData: ExifData
): void {
  try {
    const numEntries = dataView.getUint16(ifdOffset, littleEndian)

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12
      const tag = dataView.getUint16(entryOffset, littleEndian)
      const type = dataView.getUint16(entryOffset + 2, littleEndian)
      const count = dataView.getUint32(entryOffset + 4, littleEndian)
      const valueOffset = entryOffset + 8

      // Check if this is an EXIF IFD pointer
      if (tag === 0x8769) {
        const exifIFDOffset = dataView.getUint32(valueOffset, littleEndian)
        parseIFD(dataView, tiffOffset + exifIFDOffset, tiffOffset, littleEndian, exifData)
        continue
      }

      const tagName = EXIF_TAGS[tag]
      if (!tagName) continue

      const value = readTagValue(dataView, valueOffset, type, count, tiffOffset, littleEndian)

      if (value !== null) {
        if (tagName === 'exposureTime' && typeof value === 'number') {
          exifData[tagName] = formatExposureTime(value)
        } else if (tagName === 'fNumber' && typeof value === 'number') {
          exifData[tagName] = `f/${value.toFixed(1)}`
        } else if (tagName === 'focalLength' && typeof value === 'number') {
          exifData[tagName] = `${value}mm`
        } else if (tagName === 'flash' && typeof value === 'number') {
          exifData[tagName] = value & 1 ? 'Fired' : 'No Flash'
        } else if (tagName === 'whiteBalance' && typeof value === 'number') {
          exifData[tagName] = value === 0 ? 'Auto' : 'Manual'
        } else if (tagName === 'meteringMode' && typeof value === 'number') {
          exifData[tagName] = getMeteringMode(value)
        } else if (tagName === 'exposureMode' && typeof value === 'number') {
          exifData[tagName] = getExposureMode(value)
        } else {
          (exifData as Record<string, unknown>)[tagName] = value
        }
      }
    }
  } catch {
    // Ignore parsing errors
  }
}

function readTagValue(
  dataView: DataView,
  valueOffset: number,
  type: number,
  count: number,
  tiffOffset: number,
  littleEndian: boolean
): string | number | null {
  try {
    switch (type) {
      case 1: // BYTE
      case 7: // UNDEFINED
        return dataView.getUint8(valueOffset)

      case 2: // ASCII
        const stringOffset = count > 4
          ? tiffOffset + dataView.getUint32(valueOffset, littleEndian)
          : valueOffset
        let str = ''
        for (let i = 0; i < count - 1; i++) {
          const char = dataView.getUint8(stringOffset + i)
          if (char === 0) break
          str += String.fromCharCode(char)
        }
        return str.trim()

      case 3: // SHORT
        return dataView.getUint16(valueOffset, littleEndian)

      case 4: // LONG
        return dataView.getUint32(valueOffset, littleEndian)

      case 5: // RATIONAL
        const ratOffset = tiffOffset + dataView.getUint32(valueOffset, littleEndian)
        const numerator = dataView.getUint32(ratOffset, littleEndian)
        const denominator = dataView.getUint32(ratOffset + 4, littleEndian)
        return denominator ? numerator / denominator : 0

      case 10: // SRATIONAL
        const sratOffset = tiffOffset + dataView.getUint32(valueOffset, littleEndian)
        const sNumerator = dataView.getInt32(sratOffset, littleEndian)
        const sDenominator = dataView.getInt32(sratOffset + 4, littleEndian)
        return sDenominator ? sNumerator / sDenominator : 0

      default:
        return null
    }
  } catch {
    return null
  }
}

function formatExposureTime(seconds: number): string {
  if (seconds >= 1) {
    return `${seconds}s`
  }
  const denominator = Math.round(1 / seconds)
  return `1/${denominator}s`
}

function getMeteringMode(value: number): string {
  const modes: Record<number, string> = {
    0: 'Unknown',
    1: 'Average',
    2: 'Center-weighted',
    3: 'Spot',
    4: 'Multi-spot',
    5: 'Pattern',
    6: 'Partial',
  }
  return modes[value] || 'Unknown'
}

function getExposureMode(value: number): string {
  const modes: Record<number, string> = {
    0: 'Auto',
    1: 'Manual',
    2: 'Auto Bracket',
  }
  return modes[value] || 'Unknown'
}

// Get basic file metadata (works for all image types)
export async function getImageMetadata(file: File, width?: number, height?: number): Promise<{
  fileName: string
  fileSize: string
  fileType: string
  lastModified: string
  dimensions: string
}> {
  return {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileType: file.type || 'Unknown',
    lastModified: new Date(file.lastModified).toLocaleString(),
    dimensions: width && height ? `${width} x ${height}` : 'Unknown',
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
