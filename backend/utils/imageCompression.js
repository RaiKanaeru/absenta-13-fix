import sharp from 'sharp';

/**
 * Compress base64 image to reduce file size
 * @param {string} base64Data - Base64 encoded image data
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 800)
 * @param {number} options.maxHeight - Maximum height in pixels (default: 600)
 * @param {number} options.quality - JPEG quality 1-100 (default: 80)
 * @param {number} options.maxSizeKB - Maximum file size in KB (default: 500)
 * @returns {Promise<{success: boolean, data?: string, error?: string, originalSize?: number, compressedSize?: number}>}
 */
export async function compressImage(base64Data, options = {}) {
    try {
        const {
            maxWidth = 800,
            maxHeight = 600,
            quality = 80,
            maxSizeKB = 500
        } = options;

        // Validate base64 data
        if (!base64Data || typeof base64Data !== 'string') {
            return {
                success: false,
                error: 'Invalid base64 data provided'
            };
        }

        // Extract base64 data (remove data:image/...;base64, prefix if present)
        const base64String = base64Data.includes(',') 
            ? base64Data.split(',')[1] 
            : base64Data;

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64String, 'base64');
        const originalSize = Math.round(imageBuffer.length / 1024); // Size in KB

        console.log(`📸 Compressing image - Original size: ${originalSize}KB`);

        // If image is already small enough, return as is
        if (originalSize <= maxSizeKB) {
            console.log(`✅ Image already within size limit (${originalSize}KB <= ${maxSizeKB}KB)`);
            return {
                success: true,
                data: base64Data,
                originalSize,
                compressedSize: originalSize
            };
        }

        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        console.log(`📐 Original dimensions: ${metadata.width}x${metadata.height}`);

        // Calculate new dimensions maintaining aspect ratio
        let newWidth = metadata.width;
        let newHeight = metadata.height;

        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            const aspectRatio = metadata.width / metadata.height;
            
            if (metadata.width > metadata.height) {
                newWidth = Math.min(maxWidth, metadata.width);
                newHeight = Math.round(newWidth / aspectRatio);
            } else {
                newHeight = Math.min(maxHeight, metadata.height);
                newWidth = Math.round(newHeight * aspectRatio);
            }
        }

        console.log(`📐 New dimensions: ${newWidth}x${newHeight}`);

        // Compress image
        const compressedBuffer = await sharp(imageBuffer)
            .resize(newWidth, newHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ 
                quality,
                progressive: true,
                mozjpeg: true
            })
            .toBuffer();

        const compressedSize = Math.round(compressedBuffer.length / 1024); // Size in KB
        console.log(`📸 Compressed size: ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`);

        // If still too large, try with lower quality
        if (compressedSize > maxSizeKB && quality > 20) {
            console.log(`⚠️ Still too large, trying with lower quality...`);
            const lowerQuality = Math.max(20, Math.round(quality * 0.7));
            
            const retryBuffer = await sharp(imageBuffer)
                .resize(newWidth, newHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ 
                    quality: lowerQuality,
                    progressive: true,
                    mozjpeg: true
                })
                .toBuffer();

            const retrySize = Math.round(retryBuffer.length / 1024);
            console.log(`📸 Retry compressed size: ${retrySize}KB (quality: ${lowerQuality})`);

            if (retrySize <= maxSizeKB || retrySize < compressedSize) {
                const retryBase64 = `data:image/jpeg;base64,${retryBuffer.toString('base64')}`;
                return {
                    success: true,
                    data: retryBase64,
                    originalSize,
                    compressedSize: retrySize
                };
            }
        }

        // Convert compressed buffer back to base64
        const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

        return {
            success: true,
            data: compressedBase64,
            originalSize,
            compressedSize
        };

    } catch (error) {
        console.error('❌ Error compressing image:', error);
        return {
            success: false,
            error: `Image compression failed: ${error.message}`
        };
    }
}

/**
 * Validate image file size and type
 * @param {string} base64Data - Base64 encoded image data
 * @param {number} maxSizeKB - Maximum file size in KB
 * @returns {Object} Validation result
 */
export function validateImage(base64Data, maxSizeKB = 5000) {
    try {
        if (!base64Data || typeof base64Data !== 'string') {
            return {
                isValid: false,
                error: 'Invalid base64 data provided'
            };
        }

        // Extract base64 data
        const base64String = base64Data.includes(',') 
            ? base64Data.split(',')[1] 
            : base64Data;

        // Check if it's valid base64
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
            return {
                isValid: false,
                error: 'Invalid base64 format'
            };
        }

        // Calculate size
        const sizeInBytes = (base64String.length * 3) / 4;
        const sizeInKB = Math.round(sizeInBytes / 1024);

        if (sizeInKB > maxSizeKB) {
            return {
                isValid: false,
                error: `File size too large: ${sizeInKB}KB (max: ${maxSizeKB}KB)`,
                size: sizeInKB
            };
        }

        // Check if it's a valid image format
        const header = base64String.substring(0, 20);
        const isImage = header.includes('/9j/') || // JPEG
                       header.includes('iVBORw0KGgo') || // PNG
                       header.includes('R0lGOD') || // GIF
                       header.includes('UklGRg'); // WebP

        if (!isImage) {
            return {
                isValid: false,
                error: 'Invalid image format. Only JPEG, PNG, GIF, and WebP are supported'
            };
        }

        return {
            isValid: true,
            size: sizeInKB
        };

    } catch (error) {
        return {
            isValid: false,
            error: `Validation error: ${error.message}`
        };
    }
}

/**
 * Get image metadata without processing
 * @param {string} base64Data - Base64 encoded image data
 * @returns {Promise<Object>} Image metadata
 */
export async function getImageMetadata(base64Data) {
    try {
        const base64String = base64Data.includes(',') 
            ? base64Data.split(',')[1] 
            : base64Data;

        const imageBuffer = Buffer.from(base64String, 'base64');
        const metadata = await sharp(imageBuffer).metadata();

        return {
            success: true,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                channels: metadata.channels
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
