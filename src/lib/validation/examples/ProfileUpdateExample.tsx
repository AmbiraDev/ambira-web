/**
 * Profile Update Example
 *
 * Demonstrates how to use UpdateProfileSchema for validating profile updates
 * with support for optional fields, social links, and success/error states.
 *
 * Key patterns:
 * - Multi-field form validation
 * - Optional field handling
 * - Nested object validation (social links)
 * - URL validation
 * - Success/error state management
 */

'use client';

import { useState, useEffect } from 'react';
import {
  validate,
  UpdateProfileSchema,
  type UpdateProfileInput,
  type UpdateProfileData,
} from '@/lib/validation';

interface ProfileFormData {
  name: string;
  username: string;
  bio: string;
  tagline: string;
  pronouns: string;
  location: string;
  website: string;
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
  };
}

interface ProfileFormErrors {
  name?: string;
  username?: string;
  bio?: string;
  tagline?: string;
  pronouns?: string;
  location?: string;
  website?: string;
  'socialLinks.twitter'?: string;
  'socialLinks.github'?: string;
  'socialLinks.linkedin'?: string;
}

interface ProfileUpdateExampleProps {
  initialData?: Partial<ProfileFormData>;
}

export function ProfileUpdateExample({
  initialData,
}: ProfileUpdateExampleProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: initialData?.name || '',
    username: initialData?.username || '',
    bio: initialData?.bio || '',
    tagline: initialData?.tagline || '',
    pronouns: initialData?.pronouns || '',
    location: initialData?.location || '',
    website: initialData?.website || '',
    socialLinks: {
      twitter: initialData?.socialLinks?.twitter || '',
      github: initialData?.socialLinks?.github || '',
      linkedin: initialData?.socialLinks?.linkedin || '',
    },
  });

  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if form has changes
  useEffect(() => {
    const hasChanged =
      JSON.stringify(formData) !== JSON.stringify(initialData || {});
    setHasChanges(hasChanged);
  }, [formData, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Handle nested socialLinks fields
    if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1] as string;
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear field-specific error
    if (errors[name as keyof ProfileFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear submit messages
    if (submitError) setSubmitError('');
    if (submitSuccess) setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setSubmitSuccess(false);

    // Only include fields that have values (optional field handling)
    const dataToValidate: UpdateProfileInput = {};

    if (formData.name.trim()) dataToValidate.name = formData.name;
    if (formData.username.trim()) dataToValidate.username = formData.username;
    if (formData.bio.trim()) dataToValidate.bio = formData.bio;
    if (formData.tagline.trim()) dataToValidate.tagline = formData.tagline;
    if (formData.pronouns.trim()) dataToValidate.pronouns = formData.pronouns;
    if (formData.location.trim()) dataToValidate.location = formData.location;
    if (formData.website.trim()) dataToValidate.website = formData.website;

    // Only include social links if any are provided
    const hasSocialLinks =
      formData.socialLinks.twitter ||
      formData.socialLinks.github ||
      formData.socialLinks.linkedin;

    if (hasSocialLinks) {
      dataToValidate.socialLinks = {
        ...(formData.socialLinks.twitter && {
          twitter: formData.socialLinks.twitter,
        }),
        ...(formData.socialLinks.github && {
          github: formData.socialLinks.github,
        }),
        ...(formData.socialLinks.linkedin && {
          linkedin: formData.socialLinks.linkedin,
        }),
      };
    }

    // Validate with schema
    const result = validate(UpdateProfileSchema, dataToValidate);

    if (!result.success) {
      // Map validation errors to form fields
      const newErrors: ProfileFormErrors = {};
      result.errors.forEach(error => {
        if (error.path) {
          newErrors[error.path as keyof ProfileFormErrors] = error.message;
        } else {
          setSubmitError(error.message);
        }
      });
      setErrors(newErrors);
      return;
    }

    // Type-safe validated data
    const validatedData: UpdateProfileData = result.data;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSubmitSuccess(true);
      setHasChanges(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: initialData?.name || '',
      username: initialData?.username || '',
      bio: initialData?.bio || '',
      tagline: initialData?.tagline || '',
      pronouns: initialData?.pronouns || '',
      location: initialData?.location || '',
      website: initialData?.website || '',
      socialLinks: {
        twitter: initialData?.socialLinks?.twitter || '',
        github: initialData?.socialLinks?.github || '',
        linkedin: initialData?.socialLinks?.linkedin || '',
      },
    });
    setErrors({});
    setSubmitError('');
    setSubmitSuccess(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          Profile updated successfully!
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {submitError}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Basic Information
        </h3>

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.name ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Your name"
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.username ? 'border-destructive' : 'border-border'
            }`}
            placeholder="yourusername"
            maxLength={30}
          />
          {errors.username && (
            <p className="mt-2 text-sm text-destructive">{errors.username}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            3-30 characters, letters, numbers, hyphens, and underscores only
          </p>
        </div>

        {/* Tagline */}
        <div>
          <label
            htmlFor="tagline"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            value={formData.tagline}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.tagline ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Software Engineer | Coffee Enthusiast"
            maxLength={60}
          />
          {errors.tagline && (
            <p className="mt-2 text-sm text-destructive">{errors.tagline}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {formData.tagline.length}/60 characters
          </p>
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.bio ? 'border-destructive' : 'border-border'
            }`}
            placeholder="Tell us about yourself..."
            maxLength={500}
          />
          {errors.bio && (
            <p className="mt-2 text-sm text-destructive">{errors.bio}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {formData.bio.length}/500 characters
          </p>
        </div>

        {/* Pronouns & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="pronouns"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Pronouns
            </label>
            <input
              id="pronouns"
              name="pronouns"
              type="text"
              value={formData.pronouns}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-md ${
                errors.pronouns ? 'border-destructive' : 'border-border'
              }`}
              placeholder="she/her, he/him, they/them"
              maxLength={20}
            />
            {errors.pronouns && (
              <p className="mt-2 text-sm text-destructive">{errors.pronouns}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-md ${
                errors.location ? 'border-destructive' : 'border-border'
              }`}
              placeholder="San Francisco, CA"
            />
            {errors.location && (
              <p className="mt-2 text-sm text-destructive">{errors.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Links</h3>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.website ? 'border-destructive' : 'border-border'
            }`}
            placeholder="https://yourwebsite.com"
          />
          {errors.website && (
            <p className="mt-2 text-sm text-destructive">{errors.website}</p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Social Links</h4>

          {/* Twitter */}
          <div>
            <label
              htmlFor="socialLinks.twitter"
              className="block text-sm text-muted-foreground mb-1"
            >
              Twitter
            </label>
            <input
              id="socialLinks.twitter"
              name="socialLinks.twitter"
              type="text"
              value={formData.socialLinks.twitter}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md ${
                errors['socialLinks.twitter']
                  ? 'border-destructive'
                  : 'border-border'
              }`}
              placeholder="@username or https://twitter.com/username"
            />
            {errors['socialLinks.twitter'] && (
              <p className="mt-1 text-sm text-destructive">
                {errors['socialLinks.twitter']}
              </p>
            )}
          </div>

          {/* GitHub */}
          <div>
            <label
              htmlFor="socialLinks.github"
              className="block text-sm text-muted-foreground mb-1"
            >
              GitHub
            </label>
            <input
              id="socialLinks.github"
              name="socialLinks.github"
              type="text"
              value={formData.socialLinks.github}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md ${
                errors['socialLinks.github']
                  ? 'border-destructive'
                  : 'border-border'
              }`}
              placeholder="username or https://github.com/username"
            />
            {errors['socialLinks.github'] && (
              <p className="mt-1 text-sm text-destructive">
                {errors['socialLinks.github']}
              </p>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <label
              htmlFor="socialLinks.linkedin"
              className="block text-sm text-muted-foreground mb-1"
            >
              LinkedIn
            </label>
            <input
              id="socialLinks.linkedin"
              name="socialLinks.linkedin"
              type="text"
              value={formData.socialLinks.linkedin}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md ${
                errors['socialLinks.linkedin']
                  ? 'border-destructive'
                  : 'border-border'
              }`}
              placeholder="username or https://linkedin.com/in/username"
            />
            {errors['socialLinks.linkedin'] && (
              <p className="mt-1 text-sm text-destructive">
                {errors['socialLinks.linkedin']}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !hasChanges}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting || !hasChanges}
          className="px-6 py-3 text-foreground border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
