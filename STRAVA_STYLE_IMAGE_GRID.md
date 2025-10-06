# Strava-Style Image Grid Layout

## Overview
Updated the ImageGallery component to display images in a geometric grid layout (like Strava) when shown in the feed, while maintaining the carousel view for editing contexts.

## Layouts by Image Count

### 1 Image
- **Layout**: Full width rectangle
- **Aspect Ratio**: 16:10
- **Effect**: Hover scale (1.05x zoom)

```
┌─────────────────────┐
│                     │
│    Single Image     │
│                     │
└─────────────────────┘
```

### 2 Images
- **Layout**: Two equal squares side-by-side
- **Aspect Ratio**: 1:1 (square) each
- **Gap**: 1px between images
- **Effect**: Each image scales on hover

```
┌──────────┐┌──────────┐
│          ││          │
│ Image 1  ││ Image 2  │
│          ││          │
└──────────┘└──────────┘
```

### 3 Images
- **Layout**: Large image left, two stacked images right (Strava style!)
- **Left Image**: Square (1:1), spans full height
- **Right Images**: 4:3 aspect ratio each, stacked vertically
- **Gap**: 1px between all images
- **Effect**: Each image scales independently on hover

```
┌──────────┐┌──────────┐
│          ││          │
│          ││ Image 2  │
│ Image 1  │└──────────┘
│ (Large)  │┌──────────┐
│          ││          │
│          ││ Image 3  │
└──────────┘└──────────┘
```

## Component Variants

### Grid Variant (Default - for Feed)
```tsx
<ImageGallery images={session.images} />
// or explicitly
<ImageGallery images={session.images} variant="grid" />
```

**Features**:
- Geometric layouts (1, 2, or 3 images)
- Click any image to open lightbox at that position
- Hover effect: slight zoom (scale 1.05)
- Rounded corners on outer container
- 1px gap between images
- Optimized image sizes for performance

### Carousel Variant (for Edit Modal)
```tsx
<ImageGallery images={session.images} variant="carousel" />
```

**Features**:
- Swipeable carousel view
- Navigation arrows (desktop)
- Dot indicators
- Best for editing/previewing
- Full 16:10 aspect ratio

## Technical Implementation

### Grid Layouts

**Single Image**:
```tsx
<div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden">
  <Image fill className="object-cover group-hover:scale-105" />
</div>
```

**Two Images**:
```tsx
<div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
  {images.map(image => (
    <div className="relative aspect-square">
      <Image fill className="object-cover group-hover:scale-105" />
    </div>
  ))}
</div>
```

**Three Images**:
```tsx
<div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
  {/* Large image - left side, spans 2 rows */}
  <div className="relative row-span-2 aspect-square">
    <Image fill className="object-cover group-hover:scale-105" />
  </div>

  {/* Two smaller images - right side, stacked */}
  {images.slice(1).map(image => (
    <div className="relative aspect-[4/3]">
      <Image fill className="object-cover group-hover:scale-105" />
    </div>
  ))}
</div>
```

## Lightbox Integration

Each image in the grid opens the lightbox at the correct index:

```tsx
<div onClick={() => openLightbox(index)}>
  <Image src={image} />
</div>
```

The lightbox then allows navigation through all images with left/right arrows.

## Hover Effects

All images have a subtle zoom effect on hover:

```css
.group:hover .group-hover\:scale-105 {
  transform: scale(1.05);
}
```

Combined with `transition-transform`, this creates a smooth, professional feel.

## CSS Classes Breakdown

### Container (3 images example)
```css
grid grid-cols-2 gap-1 rounded-lg overflow-hidden
```
- `grid grid-cols-2`: 2-column grid
- `gap-1`: 4px gap between images
- `rounded-lg`: Rounded corners on container
- `overflow-hidden`: Clips children to rounded corners

### Large Image (left)
```css
relative row-span-2 aspect-square cursor-pointer group overflow-hidden
```
- `row-span-2`: Spans both rows
- `aspect-square`: 1:1 aspect ratio
- `group`: Enables group-hover effects
- `cursor-pointer`: Shows it's clickable

### Small Images (right)
```css
relative aspect-[4/3] cursor-pointer group overflow-hidden
```
- `aspect-[4/3]`: 4:3 aspect ratio (slightly wider than tall)
- Rest same as large image

### Image Element
```css
object-cover transition-transform group-hover:scale-105
```
- `object-cover`: Crops image to fill container
- `transition-transform`: Smooth scale animation
- `group-hover:scale-105`: Zoom on container hover

## Performance Optimizations

### Image Sizing
```tsx
sizes="(max-width: 768px) 50vw, 300px"
```
- Mobile: Images are 50% viewport width
- Desktop: Fixed at 300px width
- Next.js generates optimized versions

### Priority Loading
```tsx
priority={index === 0}
```
- First image loads with priority
- Other images lazy load

### Quality Settings
```tsx
quality={90}
```
- High quality for good appearance
- Balanced with file size

## Usage Examples

### In SessionCard (Feed)
```tsx
{session.images && session.images.length > 0 && (
  <div className="px-4 pb-4">
    <ImageGallery images={session.images} />
  </div>
)}
```

### In Edit Modal (Carousel)
```tsx
<ImageGallery
  images={previewImages}
  variant="carousel"
/>
```

### In You Page (Grid)
```tsx
{session.images && session.images.length > 0 && (
  <div className="px-4 pb-4">
    <ImageGallery images={session.images} variant="grid" />
  </div>
)}
```

## Comparison with Strava

| Feature | Strava | Our Implementation |
|---------|--------|-------------------|
| 1 image layout | Full width | ✅ Full width |
| 2 images layout | Side by side | ✅ Side by side |
| 3 images layout | Large + 2 stacked | ✅ Large + 2 stacked |
| Hover effect | None | ✅ Subtle zoom |
| Click to expand | ✅ Yes | ✅ Yes |
| Gap between images | Minimal | ✅ 1px (4px) |
| Rounded corners | Yes | ✅ Yes |

## Browser Compatibility

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari (desktop & iOS)
- ✅ Mobile browsers

All using standard CSS Grid and Flexbox.

## Future Enhancements

Potential improvements:
- Support for 4+ images (could add "+" overlay on last image)
- Video thumbnail support
- Lazy loading for better performance on long feeds
- Skeleton loading states
- Alt text from session description

## Files Modified

1. **src/components/ImageGallery.tsx** (247 lines)
   - Added `variant` prop ('grid' | 'carousel')
   - Implemented grid layouts for 1, 2, and 3 images
   - Maintained carousel functionality
   - Added hover effects
   - Integrated lightbox opening from specific image

No other files need changes - the component is backward compatible!

## Testing Checklist

- [ ] 1 image shows full width
- [ ] 2 images show side-by-side squares
- [ ] 3 images show large left + 2 stacked right
- [ ] Hover effect works on each image
- [ ] Click opens lightbox at correct image
- [ ] Lightbox navigation works through all images
- [ ] Works on mobile
- [ ] Works on desktop
- [ ] Proper aspect ratios maintained
- [ ] Images don't distort

## Visual Design Notes

The geometric grid creates visual interest and maximizes screen space usage, just like Strava. The asymmetric 3-image layout is particularly eye-catching and professional.

Key design principles:
1. **Consistency**: Same gap size (1px/4px) throughout
2. **Balance**: Large image balances two smaller ones
3. **Efficiency**: No wasted space
4. **Interaction**: Clear hover states and cursors
5. **Performance**: Optimized image sizes
