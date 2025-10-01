import imageCompression from 'browser-image-compression'
import {
  IMAGE_OPTIMIZATION_CONFIG,
  formatFileSize,
  calculateCompressionPercentage,
} from '@/lib/constants/image-optimization-constants'
import {logger} from '@/lib/logger'

export interface OptimizationResult {
  optimizedFile: File
  originalSize: number
  compressedSize: number
  compressionPercentage: number
  skipped: boolean
}



/**
 * Optimizes an image file by compressing and resizing it
 */
export async function optimizeImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<OptimizationResult> {
  const originalSize = file.size

  // Skip optimization for already small files
  if (originalSize <= IMAGE_OPTIMIZATION_CONFIG.skipOptimizationThreshold) {
    logger.info(`Skipping optimization for ${file.name} (${formatFileSize(originalSize)} - already optimized)`)
    return {
      optimizedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionPercentage: 0,
      skipped: true,
    }
  }

  try {
    const options = {
      maxSizeMB: IMAGE_OPTIMIZATION_CONFIG.maxSizeMB,
      maxWidthOrHeight: IMAGE_OPTIMIZATION_CONFIG.maxWidthOrHeight,
      useWebWorker: IMAGE_OPTIMIZATION_CONFIG.useWebWorker,
      initialQuality: IMAGE_OPTIMIZATION_CONFIG.initialQuality,
      alwaysKeepRatio: IMAGE_OPTIMIZATION_CONFIG.alwaysKeepRatio,
      onProgress: onProgress,
    }

    logger.debug(`Optimizing ${file.name} (${formatFileSize(originalSize)})`)
    const compressedFile = await imageCompression(file, options)
    const compressedSize = compressedFile.size
    const compressionPercentage = calculateCompressionPercentage(originalSize, compressedSize)
    logger.debug(`Optimized ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (-${compressionPercentage}%)`)

    // Create a new File object with the original name
    const optimizedFile = new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    })

    return {
      optimizedFile,
      originalSize,
      compressedSize,
      compressionPercentage,
      skipped: false,
    }
  } catch (error) {
    logger.error(`Image optimization failed for ${file.name}: ${error}`)
    // Return original file if optimization fails
    return {
      optimizedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionPercentage: 0,
      skipped: true,
    }
  }
}

/**
 * Optimizes multiple images in parallel with progress tracking
 */
export async function optimizeImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<OptimizationResult[]> {
  let completed = 0
  const total = files.length

  const promises = files.map(async (file) => {
    const result = await optimizeImage(file)
    completed++
    onProgress?.(completed, total)
    return result
  })

  return Promise.all(promises)
}

/**
 * Generates a thumbnail version of an image
 */
export async function generateThumbnail(file: File): Promise<File> {
  try {
    const options = {
      maxSizeMB: IMAGE_OPTIMIZATION_CONFIG.thumbnail.maxSizeMB,
      maxWidthOrHeight: IMAGE_OPTIMIZATION_CONFIG.thumbnail.maxWidthOrHeight,
      useWebWorker: IMAGE_OPTIMIZATION_CONFIG.useWebWorker,
      initialQuality: IMAGE_OPTIMIZATION_CONFIG.thumbnail.quality,
      alwaysKeepRatio: IMAGE_OPTIMIZATION_CONFIG.alwaysKeepRatio,
    }

    const thumbnailBlob = await imageCompression(file, options)

    // Create thumbnail filename
    const nameParts = file.name.split('.')
    const extension = nameParts.pop()
    const baseName = nameParts.join('.')
    const thumbnailName = `${baseName}_thumb.${extension}`

    return new File([thumbnailBlob], thumbnailName, {
      type: thumbnailBlob.type,
      lastModified: Date.now(),
    })
  } catch (error) {
    logger.error(`Thumbnail generation failed: ${error}`)
    throw error
  }
}

/**
 * Formats optimization results for display
 */
export function formatOptimizationResult(result: OptimizationResult): string {
  if (result.skipped) {
    return `Skipped (already optimized: ${formatFileSize(result.originalSize)})`
  }

  const originalStr = formatFileSize(result.originalSize)
  const compressedStr = formatFileSize(result.compressedSize)

  return `${originalStr} → ${compressedStr} (-${result.compressionPercentage}%)`
}