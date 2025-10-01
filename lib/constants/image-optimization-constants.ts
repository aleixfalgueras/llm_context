/**
 * Image optimization constants for client-side compression
 */

export const IMAGE_OPTIMIZATION_CONFIG = {
  // Maximum file size in MB after compression
  maxSizeMB: 1,

  // Maximum width or height in pixels (maintains aspect ratio)
  maxWidthOrHeight: 1920,

  // Use web worker for better performance (non-blocking)
  useWebWorker: true,

  // Initial JPEG quality (0-1, where 1 is highest quality)
  initialQuality: 0.9,

  // Always maintain aspect ratio
  alwaysKeepRatio: true,

  // File size threshold - don't optimize if already small (in bytes)
  skipOptimizationThreshold: 100 * 1024, // 100KB

  // Thumbnail configuration
  thumbnail: {
    maxWidthOrHeight: 400,
    maxSizeMB: 0.1, // 100KB max for thumbnails
    quality: 0.8,
  },
} as const

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Calculate compression percentage
 */
export function calculateCompressionPercentage(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0
  return Math.round(((originalSize - compressedSize) / originalSize) * 100)
}