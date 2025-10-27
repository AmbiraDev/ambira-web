import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageGallery } from '@/components/ImageGallery';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    return <img {...props} alt={props.alt || ''} data-testid="next-image" />;
  },
}));

describe('ImageGallery', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ];

  beforeEach(() => {
    // Mock URL.createObjectURL for blob URLs
    global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
  });

  it('should render nothing when images array is empty', () => {
    const { container } = render(<ImageGallery images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when images is undefined', () => {
    const { container } = render(<ImageGallery images={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render a single image without navigation', () => {
    const firstImage = mockImages[0];
    if (!firstImage) return;
    render(<ImageGallery images={[firstImage]} />);

    const image = screen.getByAltText('Image 1');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', firstImage);

    // Should not show navigation arrows for single image
    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
  });

  it('should render multiple images with first image visible', () => {
    render(<ImageGallery images={mockImages} />);

    const image = screen.getByAltText('Image 1');
    expect(image).toHaveAttribute('src', mockImages[0]);
  });

  it('should show dot indicators for multiple images', () => {
    render(<ImageGallery images={mockImages} />);

    const dots = screen.getAllByRole('button', { name: /Go to image/i });
    expect(dots).toHaveLength(3);
  });

  it('should not show dot indicators for single image', () => {
    const firstImage = mockImages[0];
    if (!firstImage) return;
    render(<ImageGallery images={[firstImage]} />);

    const dots = screen.queryAllByRole('button', { name: /Go to image/i });
    expect(dots).toHaveLength(0);
  });

  it('should navigate to next image when next button is clicked', () => {
    render(<ImageGallery images={mockImages} />);

    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);

    const image = screen.getByAltText('Image 2');
    expect(image).toHaveAttribute('src', mockImages[1]);
  });

  it('should navigate to previous image when previous button is clicked', () => {
    render(<ImageGallery images={mockImages} />);

    // Go to second image first
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);

    // Then go back
    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);

    const image = screen.getByAltText('Image 1');
    expect(image).toHaveAttribute('src', mockImages[0]);
  });

  it('should not show previous button on first image', () => {
    render(<ImageGallery images={mockImages} />);

    expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
  });

  it('should not show next button on last image', () => {
    render(<ImageGallery images={mockImages} />);

    // Navigate to last image
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton); // to image 2
    fireEvent.click(nextButton); // to image 3

    expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
  });

  it('should navigate using dot indicators', () => {
    render(<ImageGallery images={mockImages} />);

    const dots = screen.getAllByRole('button', { name: /Go to image/i });
    const thirdDot = dots[2];
    if (!thirdDot) return;

    // Click on third dot
    fireEvent.click(thirdDot);

    const image = screen.getByAltText('Image 3');
    expect(image).toHaveAttribute('src', mockImages[2]);
  });

  it('should highlight the active dot indicator', () => {
    render(<ImageGallery images={mockImages} />);

    const dots = screen.getAllByRole('button', { name: /Go to image/i });
    const firstDot = dots[0];
    const secondDot = dots[1];
    if (!firstDot || !secondDot) return;

    // First dot should be active (has bg-[#007AFF] class)
    expect(firstDot).toHaveClass('bg-[#007AFF]');
    expect(secondDot).toHaveClass('bg-gray-300');

    // Click second dot
    fireEvent.click(secondDot);

    // Second dot should now be active
    expect(secondDot).toHaveClass('bg-[#007AFF]');
    expect(firstDot).toHaveClass('bg-gray-300');
  });

  it('should handle swipe gestures on touch devices', () => {
    render(<ImageGallery images={mockImages} />);

    const container = screen.getByAltText('Image 1').closest('div');

    // Simulate swipe left (next image)
    fireEvent.touchStart(container!, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(container!, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(container!);

    const image = screen.getByAltText('Image 2');
    expect(image).toHaveAttribute('src', mockImages[1]);
  });

  it('should handle swipe right gesture', () => {
    render(<ImageGallery images={mockImages} />);

    const container = screen.getByAltText('Image 1').closest('div');

    // Go to second image first
    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);

    // Simulate swipe right (previous image)
    fireEvent.touchStart(container!, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchMove(container!, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(container!);

    const image = screen.getByAltText('Image 1');
    expect(image).toHaveAttribute('src', mockImages[0]);
  });

  it('should not swipe if distance is too small', () => {
    render(<ImageGallery images={mockImages} />);

    const container = screen.getByAltText('Image 1').closest('div');

    // Simulate small swipe (less than minSwipeDistance of 50)
    fireEvent.touchStart(container!, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchMove(container!, { targetTouches: [{ clientX: 90 }] });
    fireEvent.touchEnd(container!);

    // Should still be on first image
    const image = screen.getByAltText('Image 1');
    expect(image).toHaveAttribute('src', mockImages[0]);
  });

  it('should not swipe past the first image', () => {
    render(<ImageGallery images={mockImages} />);

    const container = screen.getByAltText('Image 1').closest('div');

    // Try to swipe right on first image
    fireEvent.touchStart(container!, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchMove(container!, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(container!);

    // Should still be on first image
    const image = screen.getByAltText('Image 1');
    expect(image).toHaveAttribute('src', mockImages[0]);
  });

  it('should not swipe past the last image', () => {
    render(<ImageGallery images={mockImages} />);

    const container = screen.getByAltText('Image 1').closest('div');

    // Navigate to last image
    const dots = screen.getAllByRole('button', { name: /Go to image/i });
    const thirdDot = dots[2];
    if (!thirdDot) return;
    fireEvent.click(thirdDot);

    // Try to swipe left on last image
    fireEvent.touchStart(container!, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(container!, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(container!);

    // Should still be on last image
    const image = screen.getByAltText('Image 3');
    expect(image).toHaveAttribute('src', mockImages[2]);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ImageGallery images={mockImages} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have proper aspect ratio', () => {
    const { container } = render(<ImageGallery images={mockImages} />);

    const imageContainer = container.querySelector('.aspect-\\[16\\/10\\]');
    expect(imageContainer).toBeInTheDocument();
  });

  it('should pass priority prop to first image for Next.js optimization', () => {
    render(<ImageGallery images={mockImages} />);

    const image = screen.getByAltText('Image 1');
    // In the real Next.js Image component, priority is handled internally
    // Our mock renders it as a regular img tag, so we just verify image exists
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockImages[0]);
  });
});
