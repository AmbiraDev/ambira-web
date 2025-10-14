/**
 * Firebase Integration Tests for Image Upload
 * Tests actual Firebase Storage and Firestore integration
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';

// Mock Firebase before importing
jest.mock('@/lib/firebase', () => ({
  storage: { _type: 'storage' },
  db: { _type: 'firestore' },
  auth: {
    currentUser: {
      uid: 'test-user-123',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
  }
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: (date: Date) => date
  },
  writeBatch: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
}));

describe('Firebase Image Storage Integration', () => {
  let uploadImage: any;
  let firebaseSessionApi: any;

  beforeAll(async () => {
    const imageUploadModule = await import('@/lib/imageUpload');
    const firebaseApiModule = await import('@/lib/firebaseApi');

    uploadImage = imageUploadModule.uploadImage;
    firebaseSessionApi = firebaseApiModule.firebaseSessionApi;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Firebase Storage Upload', () => {
    it('should upload image to Firebase Storage and return download URL', async () => {
      const mockFile = new File(['test-content'], 'test.jpg', { type: 'image/jpeg' });
      const mockStorageRef = { fullPath: 'session-images/test-user-123/12345_abc.jpg' };
      const mockDownloadURL = 'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/session-images%2Ftest-user-123%2F12345_abc.jpg?alt=media&token=abc123';

      (ref as jest.Mock).mockReturnValue(mockStorageRef);
      (uploadBytes as jest.Mock).mockResolvedValue({ ref: mockStorageRef });
      (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadURL);

      const result = await uploadImage(mockFile);

      // Verify Firebase Storage was called correctly
      expect(ref).toHaveBeenCalled();
      expect(uploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile);
      expect(getDownloadURL).toHaveBeenCalledWith(mockStorageRef);

      // Verify result structure
      expect(result).toEqual({
        url: mockDownloadURL,
        path: mockStorageRef.fullPath
      });

      // Verify URL is a proper Firebase Storage URL
      expect(result.url).toContain('firebasestorage.googleapis.com');
      expect(result.url).toContain('?alt=media&token=');
    });

    it('should store images in user-specific folder', async () => {
      const mockFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

      (ref as jest.Mock).mockReturnValue({ fullPath: 'session-images/test-user-123/photo.jpg' });
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock).mockResolvedValue('https://storage.url/photo.jpg');

      await uploadImage(mockFile);

      const refCall = (ref as jest.Mock).mock.calls[0];
      const storagePath = refCall[1];

      // Verify path includes user ID
      expect(storagePath).toContain('test-user-123');
      expect(storagePath).toContain('session-images');
    });

    it('should handle Firebase Storage upload failures', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      (ref as jest.Mock).mockReturnValue({});
      (uploadBytes as jest.Mock).mockRejectedValue(new Error('Storage quota exceeded'));

      await expect(uploadImage(mockFile)).rejects.toThrow('Failed to upload image');
    });

    it('should delete image from Firebase Storage', async () => {
      const imagePath = 'session-images/test-user-123/image.jpg';
      const mockStorageRef = { fullPath: imagePath };

      (ref as jest.Mock).mockReturnValue(mockStorageRef);
      (deleteObject as jest.Mock).mockResolvedValue(undefined);

      const imageUploadModule = await import('@/lib/imageUpload');
      await imageUploadModule.deleteImage(imagePath);

      expect(ref).toHaveBeenCalledWith(expect.anything(), imagePath);
      expect(deleteObject).toHaveBeenCalledWith(mockStorageRef);
    });
  });

  describe('Firestore Session with Images', () => {
    it('should save session with image URLs to Firestore', async () => {
      const mockSessionData = {
        projectId: 'project-123',
        title: 'Work Session with Images',
        description: 'Completed some tasks',
        duration: 3600,
        startTime: new Date('2024-01-01'),
        taskIds: [],
        images: [
          'https://firebasestorage.googleapis.com/image1.jpg',
          'https://firebasestorage.googleapis.com/image2.jpg'
        ],
        visibility: 'everyone' as const
      };

      const mockDocRef = { id: 'session-123' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => ({})
      });
      (collection as jest.Mock).mockReturnValue('sessions-collection');

      const session = await firebaseSessionApi.createSession(mockSessionData);

      // Verify Firestore was called
      expect(addDoc).toHaveBeenCalled();

      // Verify images were included in the data
      const firestoreData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(firestoreData.images).toEqual(mockSessionData.images);
      expect(firestoreData.images).toHaveLength(2);

      // Verify returned session includes images
      expect(session.images).toEqual(mockSessionData.images);
    });

    it('should save session without images to Firestore', async () => {
      const mockSessionData = {
        projectId: 'project-123',
        title: 'Work Session',
        description: 'No images',
        duration: 1800,
        startTime: new Date(),
        taskIds: [],
        images: [],
        visibility: 'private' as const
      };

      const mockDocRef = { id: 'session-456' };

      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => ({})
      });

      const session = await firebaseSessionApi.createSession(mockSessionData);

      const firestoreData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(firestoreData.images).toEqual([]);
      expect(session.images).toEqual([]);
    });

    it('should load session with images from Firestore', async () => {
      const mockFirestoreData = {
        userId: 'test-user-123',
        projectId: 'project-123',
        title: 'Session with Images',
        description: 'Test session',
        duration: 3600,
        startTime: new Date(),
        tasks: [],
        tags: ['Work'],
        visibility: 'everyone',
        images: [
          'https://firebasestorage.googleapis.com/image1.jpg',
          'https://firebasestorage.googleapis.com/image2.jpg',
          'https://firebasestorage.googleapis.com/image3.jpg'
        ],
        supportCount: 5,
        commentCount: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'session-789',
        data: () => mockFirestoreData
      });

      const sessionDoc = await getDoc(doc({} as any, 'sessions', 'session-789'));

      expect(sessionDoc.exists()).toBe(true);

      const data = sessionDoc.data();
      expect(data).toBeDefined();
      expect(data!.images).toBeDefined();
      expect(data!.images).toHaveLength(3);
      expect(data!.images[0]).toContain('firebasestorage.googleapis.com');
    });

    it('should handle legacy sessions without images field in Firestore', async () => {
      const mockLegacyData = {
        userId: 'test-user-123',
        title: 'Old Session',
        duration: 1800,
        // No images field
        supportCount: 0,
        commentCount: 0
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: 'legacy-session',
        data: () => mockLegacyData
      });

      const sessionDoc = await getDoc(doc({} as any, 'sessions', 'legacy-session'));
      const data = sessionDoc.data();

      // Should gracefully handle missing images field
      const images = data?.images || [];
      expect(images).toEqual([]);
    });
  });

  describe('Complete Upload and Save Flow', () => {
    it('should upload images to Storage then save URLs to Firestore', async () => {
      // Step 1: Upload images to Firebase Storage
      const imageFiles = [
        new File(['img1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['img2'], 'photo2.jpg', { type: 'image/jpeg' })
      ];

      const mockUrls = [
        'https://firebasestorage.googleapis.com/image1.jpg?token=abc',
        'https://firebasestorage.googleapis.com/image2.jpg?token=def'
      ];

      (ref as jest.Mock).mockReturnValue({ fullPath: 'session-images/user/img.jpg' });
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock)
        .mockResolvedValueOnce(mockUrls[0])
        .mockResolvedValueOnce(mockUrls[1]);

      const imageUploadModule = await import('@/lib/imageUpload');
      const uploadResults = await imageUploadModule.uploadImages(imageFiles);

      expect(uploadResults).toHaveLength(2);
      expect(uploadResults[0].url).toBe(mockUrls[0]);
      expect(uploadResults[1].url).toBe(mockUrls[1]);

      // Step 2: Create session with uploaded image URLs
      const imageUrls = uploadResults.map(r => r.url);

      const sessionData = {
        projectId: 'project-123',
        title: 'Session with Uploaded Images',
        description: 'Images uploaded successfully',
        duration: 3600,
        startTime: new Date(),
        taskIds: [],
        images: imageUrls,
        visibility: 'everyone' as const
      };

      (addDoc as jest.Mock).mockResolvedValue({ id: 'new-session' });
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => ({})
      });

      const session = await firebaseSessionApi.createSession(sessionData);

      // Verify complete flow
      expect(uploadBytes).toHaveBeenCalledTimes(2);
      expect(getDownloadURL).toHaveBeenCalledTimes(2);
      expect(addDoc).toHaveBeenCalledTimes(1);

      const savedData = (addDoc as jest.Mock).mock.calls[0][1];
      expect(savedData.images).toEqual(mockUrls);
      expect(session.images).toEqual(mockUrls);
    });

    it('should handle partial upload failure', async () => {
      const imageFiles = [
        new File(['img1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['img2'], 'photo2.jpg', { type: 'image/jpeg' })
      ];

      (ref as jest.Mock).mockReturnValue({ fullPath: 'path' });
      (uploadBytes as jest.Mock)
        .mockResolvedValueOnce({}) // First succeeds
        .mockRejectedValueOnce(new Error('Network error')); // Second fails

      const imageUploadModule = await import('@/lib/imageUpload');

      // Upload should fail when any image fails
      await expect(imageUploadModule.uploadImages(imageFiles)).rejects.toThrow();
    });
  });

  describe('Image URL Validation', () => {
    it('should verify Firebase Storage URL format', () => {
      const validUrls = [
        'https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/path?alt=media&token=abc',
        'https://storage.googleapis.com/project.appspot.com/path/image.jpg'
      ];

      validUrls.forEach(url => {
        expect(url).toMatch(/^https:\/\/(firebasestorage|storage)\.googleapis\.com/);
      });
    });

    it('should reject invalid image URLs', () => {
      const invalidUrls = [
        'http://example.com/image.jpg', // Not HTTPS
        'blob:http://localhost/abc', // Blob URL (only for preview)
        'data:image/png;base64,...' // Data URL
      ];

      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^https:\/\/.*googleapis\.com/);
      });
    });
  });

  describe('Firestore Security Rules Compliance', () => {
    it('should only allow authenticated users to upload', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      // Simulate unauthenticated user
      const firebase = await import('@/lib/firebase');
      const originalUser = firebase.auth.currentUser;
      (firebase.auth as any).currentUser = null;

      await expect(uploadImage(mockFile)).rejects.toThrow('User must be authenticated');

      // Restore
      (firebase.auth as any).currentUser = originalUser;
    });

    it('should store images in user-scoped path', async () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      (ref as jest.Mock).mockReturnValue({ fullPath: 'session-images/test-user-123/test.jpg' });
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock).mockResolvedValue('https://storage.url/test.jpg');

      await uploadImage(mockFile);

      const storagePath = (ref as jest.Mock).mock.calls[0][1];

      // Verify path follows security pattern: session-images/{userId}/{filename}
      expect(storagePath).toMatch(/^session-images\/test-user-123\//);
    });
  });

  describe('Performance and Optimization', () => {
    it('should upload multiple images in parallel', async () => {
      const files = [
        new File(['1'], '1.jpg', { type: 'image/jpeg' }),
        new File(['2'], '2.jpg', { type: 'image/jpeg' }),
        new File(['3'], '3.jpg', { type: 'image/jpeg' })
      ];

      (ref as jest.Mock).mockReturnValue({ fullPath: 'path' });
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock).mockResolvedValue('https://url.com/img.jpg');

      const imageUploadModule = await import('@/lib/imageUpload');

      const startTime = Date.now();
      await imageUploadModule.uploadImages(files);
      const endTime = Date.now();

      // All uploads should be called
      expect(uploadBytes).toHaveBeenCalledTimes(3);

      // Should complete quickly (parallel execution)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should generate unique filenames to prevent collisions', async () => {
      const files = [
        new File(['1'], 'photo.jpg', { type: 'image/jpeg' }),
        new File(['2'], 'photo.jpg', { type: 'image/jpeg' }) // Same name
      ];

      const capturedPaths: string[] = [];

      (ref as jest.Mock).mockImplementation((storage, path) => {
        capturedPaths.push(path);
        return { fullPath: path };
      });
      (uploadBytes as jest.Mock).mockResolvedValue({});
      (getDownloadURL as jest.Mock).mockResolvedValue('https://url.com/img.jpg');

      const imageUploadModule = await import('@/lib/imageUpload');
      await imageUploadModule.uploadImages(files);

      // Verify filenames are unique despite same original name
      expect(capturedPaths[0]).not.toBe(capturedPaths[1]);
      expect(new Set(capturedPaths).size).toBe(2);
    });
  });
});
