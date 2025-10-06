import { uploadImage, uploadImages, deleteImage, deleteImages, compressImage } from '../imageUpload';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Mock Firebase modules
jest.mock('../firebase', () => ({
  storage: {},
  auth: {
    currentUser: {
      uid: 'test-user-123'
    }
  }
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

describe('imageUpload utilities', () => {
  const mockFile = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' });
  const mockStorageRef = { fullPath: 'session-images/test-user-123/test-image.jpg' };
  const mockDownloadURL = 'https://firebasestorage.googleapis.com/test-image.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
    (ref as jest.Mock).mockReturnValue(mockStorageRef);
    (uploadBytes as jest.Mock).mockResolvedValue({});
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
  });

  describe('uploadImage', () => {
    it('should upload a valid image file', async () => {
      const result = await uploadImage(mockFile);

      expect(result).toEqual({
        url: mockDownloadURL,
        path: mockStorageRef.fullPath
      });
      expect(ref).toHaveBeenCalled();
      expect(uploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile);
      expect(getDownloadURL).toHaveBeenCalledWith(mockStorageRef);
    });

    it('should throw error if user is not authenticated', async () => {
      const originalUser = auth.currentUser;
      (auth as any).currentUser = null;

      await expect(uploadImage(mockFile)).rejects.toThrow('User must be authenticated to upload images');

      (auth as any).currentUser = originalUser;
    });

    it('should throw error for non-image files', async () => {
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });

      await expect(uploadImage(textFile)).rejects.toThrow('File must be an image');
    });

    it('should throw error for files larger than 5MB', async () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      await expect(uploadImage(largeFile)).rejects.toThrow('Image must be less than 5MB');
    });

    it('should use custom folder path', async () => {
      await uploadImage(mockFile, 'custom-folder');

      expect(ref).toHaveBeenCalledWith(
        storage,
        expect.stringContaining('custom-folder/test-user-123/')
      );
    });

    it('should generate unique filenames', async () => {
      await uploadImage(mockFile);
      const firstCall = (ref as jest.Mock).mock.calls[0][1];

      jest.clearAllMocks();
      (ref as jest.Mock).mockReturnValue(mockStorageRef);

      await uploadImage(mockFile);
      const secondCall = (ref as jest.Mock).mock.calls[0][1];

      expect(firstCall).not.toBe(secondCall);
    });

    it('should handle upload errors gracefully', async () => {
      (uploadBytes as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(uploadImage(mockFile)).rejects.toThrow('Failed to upload image');
    });
  });

  describe('uploadImages', () => {
    it('should upload multiple images', async () => {
      const files = [
        new File(['content1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'image2.jpg', { type: 'image/jpeg' }),
        new File(['content3'], 'image3.jpg', { type: 'image/jpeg' })
      ];

      const results = await uploadImages(files);

      expect(results).toHaveLength(3);
      expect(uploadBytes).toHaveBeenCalledTimes(3);
      expect(results.every(r => r.url === mockDownloadURL)).toBe(true);
    });

    it('should throw error for more than 3 images', async () => {
      const files = [
        new File(['1'], '1.jpg', { type: 'image/jpeg' }),
        new File(['2'], '2.jpg', { type: 'image/jpeg' }),
        new File(['3'], '3.jpg', { type: 'image/jpeg' }),
        new File(['4'], '4.jpg', { type: 'image/jpeg' })
      ];

      await expect(uploadImages(files)).rejects.toThrow('Maximum 3 images allowed');
    });

    it('should handle empty array', async () => {
      const results = await uploadImages([]);

      expect(results).toHaveLength(0);
      expect(uploadBytes).not.toHaveBeenCalled();
    });

    it('should upload all images in parallel', async () => {
      const files = [
        new File(['1'], '1.jpg', { type: 'image/jpeg' }),
        new File(['2'], '2.jpg', { type: 'image/jpeg' })
      ];

      const uploadPromise = uploadImages(files);

      // All uploads should be initiated before any completes
      await Promise.resolve(); // Let promises start
      expect(uploadBytes).toHaveBeenCalledTimes(2);

      await uploadPromise;
    });
  });

  describe('deleteImage', () => {
    it('should delete an image by path', async () => {
      const path = 'session-images/test-user-123/test-image.jpg';

      await deleteImage(path);

      expect(ref).toHaveBeenCalledWith(storage, path);
      expect(deleteObject).toHaveBeenCalledWith(mockStorageRef);
    });

    it('should throw error if user is not authenticated', async () => {
      const originalUser = auth.currentUser;
      (auth as any).currentUser = null;

      await expect(deleteImage('test-path')).rejects.toThrow('User must be authenticated to delete images');

      (auth as any).currentUser = originalUser;
    });

    it('should handle delete errors gracefully', async () => {
      (deleteObject as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(deleteImage('test-path')).rejects.toThrow('Failed to delete image');
    });
  });

  describe('deleteImages', () => {
    it('should delete multiple images', async () => {
      const paths = [
        'session-images/user/image1.jpg',
        'session-images/user/image2.jpg',
        'session-images/user/image3.jpg'
      ];

      await deleteImages(paths);

      expect(deleteObject).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', async () => {
      await deleteImages([]);

      expect(deleteObject).not.toHaveBeenCalled();
    });

    it('should delete all images in parallel', async () => {
      const paths = ['path1.jpg', 'path2.jpg'];

      const deletePromise = deleteImages(paths);

      await Promise.resolve();
      expect(deleteObject).toHaveBeenCalledTimes(2);

      await deletePromise;
    });
  });

  describe('compressImage', () => {
    it('should return the original file without compression', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      const result = await compressImage(file);

      expect(result).toBe(file);
      expect(result.name).toBe('test.jpg');
      expect(result.type).toBe('image/jpeg');
    });

    it('should accept optional parameters without using them', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      const result = await compressImage(file, 800, 800, 0.5);

      expect(result).toBe(file);
    });
  });
});
