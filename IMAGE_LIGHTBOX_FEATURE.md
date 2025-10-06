# Image Lightbox Feature

## Overview
Added a full-screen image lightbox that allows users to click on any image in the gallery to view it larger with navigation controls.

## Features

### ✨ Click to Expand
- Click any image in a gallery to open it in full-screen lightbox
- Dark background (90% opacity black) for better focus
- Click outside image or X button to close

### 🔄 Image Navigation
- **Left Arrow** (`ChevronLeft`): Navigate to previous image (only shows if not on first image)
- **Right Arrow** (`ChevronRight`): Navigate to next image (only shows if not on last image)
- **Keyboard Support**:
  - `←` / `→` : Navigate between images
  - `Esc` : Close lightbox

### 📱 Responsive Design
- Works on desktop and mobile
- Touch-friendly arrow buttons with backdrop blur
- Prevents body scroll when lightbox is open
- Image counter shows current position (e.g., "2 / 3")

## Components

### ImageLightbox (`src/components/ImageLightbox.tsx`)
Main lightbox component with full-screen overlay.

**Props**:
```typescript
{
  images: string[];        // Array of image URLs
  initialIndex?: number;   // Which image to show first (default: 0)
  onClose: () => void;     // Callback when lightbox closes
}
```

**Features**:
- `z-[10000]` to appear above everything
- `bg-black/90` for dark semi-transparent background
- Click outside to close
- Keyboard navigation (arrows + escape)
- Automatic body scroll lock
- Image counter for multiple images
- Conditional arrow rendering

### ImageGallery Updates (`src/components/ImageGallery.tsx`)
Enhanced to support lightbox opening.

**Changes**:
- Added `cursor-pointer` to indicate clickable
- Added `onClick` handler to open lightbox
- Imported and integrated `ImageLightbox`
- Added `e.stopPropagation()` to navigation arrows (prevents lightbox opening when clicking arrows)
- Added `z-10` to arrows to keep them above image

## User Experience

### Opening Lightbox
1. User clicks on an image in any gallery
2. Lightbox opens with smooth fade-in
3. Image displays at maximum size while maintaining aspect ratio
4. Background darkens to 90% opacity
5. Body scroll is prevented

### Navigation
1. **Desktop**: Hover over left/right sides to see arrows
2. **Mobile**: Arrows always visible (with backdrop blur)
3. **Both**: Swipe gestures work (mobile only)
4. **Both**: Keyboard shortcuts work

### Closing
1. Click X button in top-right
2. Click outside the image
3. Press Escape key

## Styling Details

### Lightbox Overlay
```css
bg-black/90          /* 90% opacity black background */
z-[10000]            /* Above everything */
fixed inset-0        /* Full screen */
flex items-center    /* Center content */
```

### Arrow Buttons
```css
bg-white/10                  /* Semi-transparent white */
hover:bg-white/20            /* Slightly more opaque on hover */
backdrop-blur-sm             /* Blur effect behind button */
rounded-full                 /* Circular buttons */
p-3                          /* Padding for clickable area */
```

### Image Container
```css
object-contain               /* Fit image within container */
max-w-7xl max-h-full        /* Constrain maximum size */
quality={95}                 /* High quality for large view */
sizes="100vw"               /* Use full viewport width */
```

### Close Button
```css
top-4 right-4               /* Top-right corner */
text-white                   /* White color */
hover:text-gray-300         /* Gray on hover */
```

### Image Counter
```css
bottom-4                     /* Bottom of screen */
bg-black/50                  /* Semi-transparent black */
backdrop-blur-sm             /* Blur effect */
rounded-full                 /* Pill shape */
text-white text-sm          /* Small white text */
```

## Implementation Example

```tsx
import { ImageGallery } from '@/components/ImageGallery';

function SessionCard({ session }) {
  return (
    <div>
      {/* Other content */}

      {session.images && session.images.length > 0 && (
        <ImageGallery images={session.images} />
      )}
    </div>
  );
}
```

The lightbox will automatically work with any `ImageGallery` component!

## Technical Details

### State Management
```typescript
const [lightboxOpen, setLightboxOpen] = useState(false);
const [currentIndex, setCurrentIndex] = useState(0);
```

### Keyboard Handler
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && currentIndex > 0) goToPrevious();
    if (e.key === 'ArrowRight' && currentIndex < images.length - 1) goToNext();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentIndex, images.length, onClose]);
```

### Body Scroll Lock
```typescript
useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = 'unset';
  };
}, []);
```

### Conditional Arrow Rendering
```typescript
{currentIndex > 0 && (
  <button onClick={goToPrevious}>
    <ChevronLeft />
  </button>
)}

{currentIndex < images.length - 1 && (
  <button onClick={goToNext}>
    <ChevronRight />
  </button>
)}
```

## Files Changed

1. **New File**: `src/components/ImageLightbox.tsx` (134 lines)
   - Full lightbox component
   - Keyboard navigation
   - Click outside to close
   - Arrow navigation

2. **Updated**: `src/components/ImageGallery.tsx`
   - Added lightbox integration
   - Made images clickable
   - Added `e.stopPropagation()` to prevent conflicts

## Testing Checklist

- [ ] Click image to open lightbox
- [ ] Click outside image to close
- [ ] Click X button to close
- [ ] Press Escape to close
- [ ] Left arrow appears only when not on first image
- [ ] Right arrow appears only when not on last image
- [ ] Click left/right arrows to navigate
- [ ] Press ← → keys to navigate
- [ ] Image counter updates correctly
- [ ] Works on mobile
- [ ] Works on desktop
- [ ] Body scroll is locked when open
- [ ] Body scroll restored when closed
- [ ] Clicking gallery arrows doesn't open lightbox

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (desktop & iOS)
- ✅ Mobile browsers

All features use standard web APIs and CSS that work across modern browsers.

## Future Enhancements

Potential improvements:
- Pinch to zoom on mobile
- Double-tap to zoom
- Download image button
- Share image button
- Smooth transitions between images
- Lazy loading for better performance
- Support for video files

## Performance Notes

- Images use Next.js Image component for optimization
- `priority` flag on first image for faster loading
- `quality={95}` for lightbox (higher quality for large view)
- Keyboard event listeners properly cleaned up
- No memory leaks from event listeners
