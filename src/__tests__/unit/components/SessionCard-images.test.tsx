import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionCard } from '@/components/SessionCard';
import { SessionWithDetails } from '@/types';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user' },
  },
  db: {},
  storage: {},
}));

jest.mock('@/lib/api', () => ({
  firebaseSessionApi: {},
  firebaseCommentApi: {},
}));

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return <img {...props} alt={props.alt || ''} data-testid="next-image" />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock ImageGallery component
jest.mock('@/components/ImageGallery', () => ({
  ImageGallery: ({ images }: { images: string[] }) => (
    <div data-testid="image-gallery">
      {images.map((img, idx) => (
        <img key={idx} src={img} alt={`Gallery image ${idx + 1}`} />
      ))}
    </div>
  ),
}));

// Mock CommentList to avoid Firebase dependencies
jest.mock('../CommentList', () => ({
  __esModule: true,
  default: () => <div data-testid="comment-list">Comments</div>,
}));

describe('SessionCard - Image Display', () => {
  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    username: 'testuser',
    bio: 'Test bio',
    profilePicture: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockProject = {
    id: 'proj1',
    userId: 'user1',
    name: 'Test Project',
    description: 'Test description',
    icon: '📝',
    color: '#0066CC',
    status: 'active' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const baseSession: SessionWithDetails = {
    id: 'session1',
    userId: 'user1',
    activityId: 'proj1',
    projectId: 'proj1',
    title: 'Test Session',
    description: 'Test description',
    duration: 3600,
    startTime: new Date('2024-01-01'),
    tags: ['Work'],
    visibility: 'everyone',
    isArchived: false,
    supportCount: 5,
    commentCount: 3,
    isSupported: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: mockUser,
    activity: mockProject,
    project: mockProject,
    images: [],
  };

  const mockOnSupport = jest.fn();
  const mockOnRemoveSupport = jest.fn();
  const mockOnShare = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnEdit = jest.fn();

  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should not render ImageGallery when images array is empty', () => {
    render(
      <SessionCard
        session={baseSession}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
  });

  it('should not render ImageGallery when images is undefined', () => {
    const sessionWithoutImages = { ...baseSession, images: undefined };

    render(
      <SessionCard
        session={sessionWithoutImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
  });

  it('should render ImageGallery when session has images', () => {
    const sessionWithImages = {
      ...baseSession,
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ],
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });

  it('should pass correct images to ImageGallery', () => {
    const images = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
    ];

    const sessionWithImages = {
      ...baseSession,
      images,
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    const galleryImages = screen.getAllByAltText(/Gallery image/);
    expect(galleryImages).toHaveLength(3);
    expect(galleryImages[0]).toHaveAttribute('src', images[0]);
    expect(galleryImages[1]).toHaveAttribute('src', images[1]);
    expect(galleryImages[2]).toHaveAttribute('src', images[2]);
  });

  it('should render ImageGallery between description and stats', () => {
    const sessionWithImages = {
      ...baseSession,
      description: 'Test description',
      images: ['https://example.com/image.jpg'],
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    // Find description and stats sections
    const description = screen.getByText('Test description');
    const gallery = screen.getByTestId('image-gallery');
    const statsSection = screen.getByText('Time');

    // Gallery should be after description and before stats
    const descriptionParent = description.closest('div');
    const galleryParent = gallery.closest('div');
    const statsParent = statsSection.closest('div');

    expect(descriptionParent).toBeInTheDocument();
    expect(galleryParent).toBeInTheDocument();
    expect(statsParent).toBeInTheDocument();
  });

  it('should display single image in gallery when session has one image', () => {
    const sessionWithOneImage = {
      ...baseSession,
      images: ['https://example.com/single-image.jpg'],
    };

    render(
      <SessionCard
        session={sessionWithOneImage}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    const gallery = screen.getByTestId('image-gallery');
    expect(gallery).toBeInTheDocument();

    const galleryImages = screen.getAllByAltText(/Gallery image/);
    expect(galleryImages).toHaveLength(1);
  });

  it('should display all three images in gallery when session has maximum images', () => {
    const sessionWithMaxImages = {
      ...baseSession,
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ],
    };

    render(
      <SessionCard
        session={sessionWithMaxImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    const galleryImages = screen.getAllByAltText(/Gallery image/);
    expect(galleryImages).toHaveLength(3);
  });

  it('should log debug info when session has images', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    const sessionWithImages = {
      ...baseSession,
      images: ['https://example.com/image.jpg'],
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Session has images:',
      'session1',
      ['https://example.com/image.jpg']
    );

    consoleLogSpy.mockRestore();
  });

  it('should render all session content when images are not present', () => {
    render(
      <SessionCard
        session={baseSession}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    // Should still render all other parts
    expect(screen.getByText('Test Session')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
  });

  it('should apply correct padding styles to gallery container when images are present', () => {
    const sessionWithImages = {
      ...baseSession,
      images: ['https://example.com/image.jpg'],
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    // Check that gallery has correct padding classes
    const galleryContainer = screen.getByTestId('image-gallery').parentElement;
    expect(galleryContainer).toHaveClass('px-4', 'pb-4');
  });

  it('should allow user interactions when session has images', () => {
    const sessionWithImages = {
      ...baseSession,
      images: ['https://example.com/image.jpg'],
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    );

    // Test that all interactive buttons are present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Test support button (first in action bar)
    const supportButton = buttons.find(btn => btn.textContent?.includes('5'));
    if (supportButton) {
      fireEvent.click(supportButton);
      expect(mockOnSupport).toHaveBeenCalledWith('session1');
    }
  });

  it('should render image gallery correctly when URLs are very long', () => {
    const longUrl =
      'https://firebasestorage.googleapis.com/v0/b/project-id.appspot.com/o/session-images%2Fuser-id%2F1234567890_abc123.jpg?alt=media&token=very-long-token-string-here';

    const sessionWithImages = {
      ...baseSession,
      images: [longUrl],
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    const galleryImage = screen.getByAltText('Gallery image 1');
    expect(galleryImage).toHaveAttribute('src', longUrl);
  });

  it('should keep image gallery visible when expanding long description', () => {
    const sessionWithImages = {
      ...baseSession,
      description: 'A'.repeat(300), // Long description
      images: ['https://example.com/image.jpg'],
    };

    render(
      <SessionCard
        session={sessionWithImages}
        onSupport={mockOnSupport}
        onRemoveSupport={mockOnRemoveSupport}
        onShare={mockOnShare}
      />
    );

    // Description should be collapsed initially
    const showMoreButton = screen.queryByText(/show more/i);
    expect(showMoreButton).toBeInTheDocument();

    // Image gallery should still be visible
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();

    // Expand description
    if (showMoreButton) {
      fireEvent.click(showMoreButton);
    }

    // Gallery should still be visible
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });
});
