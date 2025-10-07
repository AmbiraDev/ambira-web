# ImageUpload Component

A reusable React component for uploading images with progress indicators, previews, and comprehensive validation.

## Features

- ✅ **Preview Thumbnails**: Displays image previews after selection
- ✅ **Upload Progress**: Shows progress bar during upload (optional)
- ✅ **Validation**: File size and type validation with clear error messages
- ✅ **Size Indicators**: Shows file size on each preview
- ✅ **Multiple Images**: Supports uploading multiple images (configurable)
- ✅ **Single Image Mode**: Special mode for profile pictures
- ✅ **Instant or Deferred Upload**: Choose when to upload
- ✅ **HEIC Support**: Accepts HEIC/HEIF images
- ✅ **Drag & Drop UI**: Clean, accessible upload interface

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxImages` | `number` | `3` | Maximum number of images allowed |
| `maxSizeMB` | `number` | `5` | Maximum file size in MB |
| `acceptedTypes` | `string[]` | `['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']` | Accepted MIME types |
| `showTypeHint` | `boolean` | `true` | Show accepted file types hint |
| `images` | `File[]` | `[]` | Current images (controlled component) |
| `previewUrls` | `string[]` | `[]` | Preview URLs (controlled component) |
| `onImagesChange` | `(images: File[], previewUrls: string[]) => void` | - | Callback when images change |
| `uploadMode` | `'instant' \| 'deferred'` | `'deferred'` | Upload timing mode |
| `onUpload` | `(files: File[]) => Promise<string[]>` | - | Upload function for instant mode |
| `label` | `string` | - | Label text above component |
| `showProgress` | `boolean` | `true` | Show upload progress bar |
| `placeholder` | `string` | Auto-generated | Custom placeholder text |
| `disabled` | `boolean` | `false` | Disable the component |
| `singleImage` | `boolean` | `false` | Single image mode (for profile pictures) |

## Usage Examples

### Example 1: Session Images (Deferred Upload)

Images are stored locally and uploaded when the form is submitted.

```tsx
import { ImageUpload } from '@/components/ImageUpload';

const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

const handleImagesChange = (images: File[], previewUrls: string[]) => {
  setSelectedImages(images);
  setImagePreviewUrls(previewUrls);
};

const handleSubmit = async () => {
  // Upload images when form is submitted
  const uploadResults = await uploadImages(selectedImages);
  const imageUrls = uploadResults.map(result => result.url);
  // Save session with image URLs...
};

<ImageUpload
  label="Add Images (Optional, max 3)"
  maxImages={3}
  maxSizeMB={5}
  images={selectedImages}
  previewUrls={imagePreviewUrls}
  onImagesChange={handleImagesChange}
  uploadMode="deferred"
  showProgress={false}
/>
```

### Example 2: Profile Picture (Instant Upload)

Image uploads immediately when selected.

```tsx
import { ImageUpload } from '@/components/ImageUpload';

const [profileImageFile, setProfileImageFile] = useState<File[]>([]);
const [profileImagePreview, setProfileImagePreview] = useState<string[]>([]);

const handleProfileImageUpload = async (files: File[]): Promise<string[]> => {
  const file = files[0];
  const downloadURL = await uploadProfilePicture(file);
  return [downloadURL];
};

<ImageUpload
  label="Profile Picture"
  singleImage={true}
  maxSizeMB={5}
  images={profileImageFile}
  previewUrls={profileImagePreview}
  onImagesChange={(images, previewUrls) => {
    setProfileImageFile(images);
    setProfileImagePreview(previewUrls);
  }}
  uploadMode="instant"
  onUpload={handleProfileImageUpload}
  showProgress={true}
  placeholder="Upload profile picture"
/>
```

### Example 3: Custom Configuration

```tsx
<ImageUpload
  label="Product Images"
  maxImages={5}
  maxSizeMB={10}
  acceptedTypes={['image/jpeg', 'image/png']}
  showTypeHint={true}
  placeholder="Add up to 5 product images"
  images={images}
  previewUrls={previewUrls}
  onImagesChange={handleChange}
  uploadMode="deferred"
/>
```

## Validation

The component validates:

1. **File Size**: Shows error if file exceeds `maxSizeMB`
2. **File Type**: Shows error if file type not in `acceptedTypes`
3. **Max Images**: Shows error if trying to add more than `maxImages`

Error messages are displayed in a red alert box above the upload area.

## Styling

The component uses Tailwind CSS classes and integrates with your design system:

- Gray border that turns blue on hover
- Red error styling with alert icon
- Blue progress bar for uploads
- Circular thumbnails for profile pictures
- Grid layout for multiple images

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Hidden file input with visible label
- Clear error messages
- Remove button with aria-label

## Notes

- Preview URLs are automatically cleaned up on component unmount
- HEIC/HEIF images are accepted and converted during upload (handled by imageUpload.ts)
- File input is reset after selection to allow re-selecting the same file
- Supports both controlled component pattern (with `images` and `previewUrls` props)
