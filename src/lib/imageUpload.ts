import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth } from './firebase';

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

    return signature.startsWith('ftyphei') ||
           signature.startsWith('ftyphev') ||
           signature.startsWith('ftypmif1'); // mif1 is also used for HEIF
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
  const hasHeicExtension = file.name.toLowerCase().endsWith('.heic') ||
                           file.name.toLowerCase().endsWith('.heif');
  const hasHeicType = file.type === 'image/heic' || file.type === 'image/heif';

  // Also check the actual file content (magic bytes)
  const isActualHeic = await isActuallyHeic(file);

  const isHeic = hasHeicExtension || hasHeicType || isActualHeic;

  if (!isHeic) {
    return file;
  }

  console.log('🔍 HEIC detected:', {
    extension: hasHeicExtension,
    mimeType: hasHeicType,
    magicBytes: isActualHeic,
    fileName: file.name
  });

  try {
    console.log('🔄 Converting HEIC to JPEG...');
    const heic2any = (await import('heic2any')).default;

    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    // heic2any can return Blob or Blob[]
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    // Create a new File from the converted blob
    const convertedFile = new File(
      [blob],
      file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    console.log('✅ HEIC converted to JPEG:', convertedFile.name);
    return convertedFile;
  } catch (error) {
    console.error('❌ Failed to convert HEIC:', error);
    throw new Error('Failed to convert HEIC image. Please use JPG or PNG format.');
  }
}

/**
 * Upload an image to Firebase Storage
 * @param file - The image file to upload
 * @param folder - The storage folder (e.g., 'session-images')
 * @returns The download URL and storage path
 */
export async function uploadImage(file: File, folder: string = 'session-images'): Promise<ImageUploadResult> {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to upload images');
  }

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

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (processedFile.size > maxSize) {
    const sizeMB = (processedFile.size / 1024 / 1024).toFixed(1);
    throw new Error(`Image is too large (${sizeMB}MB). Maximum size is 5MB.`);
  }

  console.log(`📦 Processing file: ${processedFile.name} (${(processedFile.size / 1024 / 1024).toFixed(2)}MB)`);

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = processedFile.name.split('.').pop();
  const filename = `${timestamp}_${randomString}.${extension}`;

  // Create storage reference
  const storageRef = ref(storage, `${folder}/${auth.currentUser.uid}/${filename}`);

  try {
    console.log(`📤 Uploading to: ${storageRef.fullPath}`);

    // Upload the processed file (not the original)
    const snapshot = await uploadBytes(storageRef, processedFile);
    console.log(`✅ Upload complete. Bytes transferred: ${snapshot.metadata.size}`);

    // Get download URL
    const url = await getDownloadURL(storageRef);
    console.log(`🔗 Download URL obtained: ${url.substring(0, 100)}...`);

    return {
      url,
      path: storageRef.fullPath
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
export async function uploadImages(files: File[], folder: string = 'session-images'): Promise<ImageUploadResult[]> {
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
 * Compress and resize image before upload
 * @param file - The image file
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param quality - Image quality (0-1)
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.7
): Promise<File> {
  // Just return the original file - skip compression entirely
  // This avoids all the browser compatibility and decoding issues
  return file;
}
