import { storage } from './firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { auth } from './firebase';
import { checkRateLimit } from './rateLimit';

export interface ImageUploadResult {
  url: string;
  path: string;
}

/**
 * Check if a file is actually HEIC/HEIF by reading its magic bytes
 */
async function isActuallyHeic(file: File): Promise<boolean> {
  try {
    // Read the first 12 bytes of the file
    const arrayBuffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check for HEIC/HEIF file signatures
    // HEIC files start with: ftyp followed by heic, heix, hevc, hevx, heim, heis, hevm, or hevs
    // Bytes 4-11 should contain "ftypheic", "ftypheix", "ftyphevc", etc.
    const signature = String.fromCharCode(...bytes.slice(4, 12));

    return (
      signature.startsWith('ftyphei') ||
      signature.startsWith('ftyphev') ||
      signature.startsWith('ftypmif1')
    ); // mif1 is also used for HEIF
  } catch (error) {
    console.error('Error checking file signature:', error);
    return false;
  }
}

/**
 * Convert HEIC/HEIF images to JPEG
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  // Check if it's a HEIC/HEIF file by extension or type
  const hasHeicExtension =
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');
  const hasHeicType = file.type === 'image/heic' || file.type === 'image/heif';

  // Also check the actual file content (magic bytes)
  const isActualHeic = await isActuallyHeic(file);

  const isHeic = hasHeicExtension || hasHeicType || isActualHeic;

  if (!isHeic) {
    return file;
  }

  try {
    const heic2any = (await import('heic2any')).default;

    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });

    // heic2any can return Blob or Blob[]
    const blob = Array.isArray(convertedBlob)
      ? convertedBlob[0]
      : convertedBlob;

    // Create a new File from the converted blob
    const convertedFile = new File(
      [blob],
      file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    return convertedFile;
  } catch (error) {
    console.error('❌ Failed to convert HEIC:', error);
    throw new Error(
      'Failed to convert HEIC image. Please use JPG or PNG format.'
    );
  }
}

/**
 * Upload an image to Firebase Storage
 * @param file - The image file to upload
 * @param folder - The storage folder (e.g., 'session-images')
 * @returns The download URL and storage path
 */
export async function uploadImage(
  file: File,
  folder: string = 'session-images'
): Promise<ImageUploadResult> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to upload images');
  }

  // Rate limit file uploads
  checkRateLimit(auth.currentUser.uid, 'FILE_UPLOAD');

  // Convert HEIC to JPEG if needed
  let processedFile = file;
  try {
    processedFile = await convertHeicToJpeg(file);
  } catch (error: any) {
    throw error; // Re-throw conversion errors
  }

  // Validate file type after conversion
  if (!processedFile.type.startsWith('image/')) {
    throw new Error('File must be an image (JPG, PNG, GIF, WebP)');
  }

  // Compress if file is larger than 5MB
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (processedFile.size > maxSize) {
    const sizeMB = (processedFile.size / 1024 / 1024).toFixed(1);
    try {
      processedFile = await compressToSize(processedFile, 5);
    } catch (error: any) {
      console.error('❌ Compression failed:', error);
      throw new Error('Failed to compress image. Please try a smaller file.');
    }
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = processedFile.name.split('.').pop();
  const filename = `${timestamp}_${randomString}.${extension}`;

  // Create storage reference
  const storageRef = ref(
    storage,
    `${folder}/${auth.currentUser.uid}/${filename}`
  );

  try {
    // Upload the processed file (not the original)
    const snapshot = await uploadBytes(storageRef, processedFile);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return {
      url,
      path: storageRef.fullPath,
    };
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please make sure you are logged in.');
    }
    throw new Error(error.message || 'Failed to upload image');
  }
}

/**
 * Upload multiple images (max 3)
 * @param files - Array of image files
 * @param folder - The storage folder
 * @returns Array of download URLs and storage paths
 */
export async function uploadImages(
  files: File[],
  folder: string = 'session-images'
): Promise<ImageUploadResult[]> {
  if (files.length > 3) {
    throw new Error('Maximum 3 images allowed');
  }

  const uploadPromises = files.map(file => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Firebase Storage
 * @param path - The storage path of the image
 */
export async function deleteImage(path: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to delete images');
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Delete multiple images
 * @param paths - Array of storage paths
 */
export async function deleteImages(paths: string[]): Promise<void> {
  const deletePromises = paths.map(path => deleteImage(path));
  await Promise.all(deletePromises);
}

/**
 * Compress and resize image before upload using Canvas API
 * @param file - The image file
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param quality - Image quality (0-1)
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Use better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new file from blob
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { type: 'image/jpeg' }
              );

              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Progressively compress an image until it's under the target size
 * @param file - The image file
 * @param maxSizeMB - Maximum size in megabytes
 * @returns Compressed image file
 */
async function compressToSize(
  file: File,
  maxSizeMB: number = 5
): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // If file is already under the limit, return it
  if (file.size <= maxSizeBytes) {
    return file;
  }

  // Start with aggressive compression settings
  let compressedFile = file;

  // Try progressively more aggressive compression
  const attempts = [
    { quality: 0.8, maxDimension: 1920 },
    { quality: 0.7, maxDimension: 1600 },
    { quality: 0.6, maxDimension: 1400 },
    { quality: 0.5, maxDimension: 1200 },
  ];

  for (const attempt of attempts) {
    compressedFile = await compressImage(
      file,
      attempt.maxDimension,
      attempt.maxDimension,
      attempt.quality
    );

    if (compressedFile.size <= maxSizeBytes) {
      return compressedFile;
    }
  }

  // If still too large after all attempts, return the smallest version
  console.warn(
    `⚠️ Could not compress to under ${maxSizeMB}MB, using smallest version (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`
  );
  return compressedFile;
}
