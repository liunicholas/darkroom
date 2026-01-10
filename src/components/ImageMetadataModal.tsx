'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { extractExifData, getImageMetadata, type ExifData } from '@/lib/utils/exif'
import { useEditorStore } from '@/stores/editor-store'

interface ImageMetadataModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ImageInfo {
  fileName: string
  fileSize: string
  fileType: string
  lastModified: string
  dimensions: string
}

export function ImageMetadataModal({ isOpen, onClose }: ImageMetadataModalProps) {
  const images = useEditorStore((state) => state.images)
  const currentImageIndex = useEditorStore((state) => state.currentImageIndex)
  const currentImage = images[currentImageIndex]

  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !currentImage) {
      setExifData(null)
      setImageInfo(null)
      setIsLoading(true)
      return
    }

    const loadMetadata = async () => {
      setIsLoading(true)

      // Get basic file info
      const info = await getImageMetadata(
        currentImage.file,
        currentImage.originalWidth,
        currentImage.originalHeight
      )
      setImageInfo(info)

      // Extract EXIF data (for JPEG)
      const exif = await extractExifData(currentImage.file)
      setExifData(exif)

      setIsLoading(false)
    }

    loadMetadata()
  }, [isOpen, currentImage])

  if (!currentImage) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Image Information" size="md">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-maroon border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Thumbnail preview */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-dark-700">
              {currentImage.thumbnail ? (
                <img
                  src={currentImage.thumbnail}
                  alt={currentImage.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* File Information */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              File Information
            </h3>
            <div className="bg-dark-700 rounded-lg divide-y divide-dark-600">
              {imageInfo && (
                <>
                  <MetadataRow label="Filename" value={imageInfo.fileName} />
                  <MetadataRow label="Dimensions" value={imageInfo.dimensions} />
                  <MetadataRow label="File Size" value={imageInfo.fileSize} />
                  <MetadataRow label="Format" value={imageInfo.fileType} />
                  <MetadataRow label="Last Modified" value={imageInfo.lastModified} />
                </>
              )}
            </div>
          </div>

          {/* Camera Information (EXIF) */}
          {exifData && Object.keys(exifData).length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Camera Information
              </h3>
              <div className="bg-dark-700 rounded-lg divide-y divide-dark-600">
                {exifData.make && <MetadataRow label="Camera Make" value={exifData.make} />}
                {exifData.model && <MetadataRow label="Camera Model" value={exifData.model} />}
                {exifData.lensModel && <MetadataRow label="Lens" value={exifData.lensModel} />}
                {exifData.software && <MetadataRow label="Software" value={exifData.software} />}
                {exifData.dateTime && <MetadataRow label="Date Taken" value={exifData.dateTime} />}
              </div>
            </div>
          )}

          {/* Exposure Information (EXIF) */}
          {exifData && (exifData.exposureTime || exifData.fNumber || exifData.iso || exifData.focalLength) && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Exposure Settings
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {exifData.exposureTime && (
                  <ExposureCard
                    icon={<ShutterIcon />}
                    label="Shutter"
                    value={exifData.exposureTime}
                  />
                )}
                {exifData.fNumber && (
                  <ExposureCard
                    icon={<ApertureIcon />}
                    label="Aperture"
                    value={exifData.fNumber}
                  />
                )}
                {exifData.iso && (
                  <ExposureCard
                    icon={<IsoIcon />}
                    label="ISO"
                    value={String(exifData.iso)}
                  />
                )}
                {exifData.focalLength && (
                  <ExposureCard
                    icon={<FocalLengthIcon />}
                    label="Focal Length"
                    value={exifData.focalLength}
                  />
                )}
              </div>
            </div>
          )}

          {/* Additional Settings */}
          {exifData && (exifData.flash || exifData.whiteBalance || exifData.meteringMode || exifData.exposureMode) && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Additional Settings
              </h3>
              <div className="bg-dark-700 rounded-lg divide-y divide-dark-600">
                {exifData.flash && <MetadataRow label="Flash" value={exifData.flash} />}
                {exifData.whiteBalance && <MetadataRow label="White Balance" value={exifData.whiteBalance} />}
                {exifData.meteringMode && <MetadataRow label="Metering" value={exifData.meteringMode} />}
                {exifData.exposureMode && <MetadataRow label="Exposure Mode" value={exifData.exposureMode} />}
              </div>
            </div>
          )}

          {/* No EXIF data message */}
          {(!exifData || Object.keys(exifData).length === 0) && imageInfo?.fileType !== 'image/jpeg' && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                EXIF data is only available for JPEG images
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-3 py-2.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium truncate max-w-[200px]" title={value}>
        {value}
      </span>
    </div>
  )
}

function ExposureCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-dark-700 rounded-lg p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-dark-600 flex items-center justify-center text-maroon">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  )
}

// Icons
function ShutterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
    </svg>
  )
}

function ApertureIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
    </svg>
  )
}

function IsoIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <text x="4" y="16" fontSize="10" fontWeight="bold" fontFamily="sans-serif">ISO</text>
    </svg>
  )
}

function FocalLengthIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="7" width="14" height="10" rx="2" strokeWidth={1.5} />
      <circle cx="18" cy="12" r="3" strokeWidth={1.5} />
    </svg>
  )
}
