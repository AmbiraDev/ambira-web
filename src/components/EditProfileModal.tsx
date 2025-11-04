'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { firebaseUserApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { X, User, MapPin, FileText, Globe } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

interface EditProfileModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onProfileUpdate,
}) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    bio: profile.bio || '',
    location: profile.location || '',
    profilePicture: profile.profilePicture || '',
  });
  const [profileVisibility, setProfileVisibility] = useState<
    'everyone' | 'followers' | 'private'
  >('everyone');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File[]>([]);
  const [profileImagePreview, setProfileImagePreview] = useState<string[]>(
    profile.profilePicture ? [profile.profilePicture] : []
  );

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        // Reset form data to original values
        setFormData({
          name: profile.name,
          bio: profile.bio || '',
          location: profile.location || '',
          profilePicture: profile.profilePicture || '',
        });
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose, profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileImageChange = (images: File[], previewUrls: string[]) => {
    setProfileImageFile(images);
    setProfileImagePreview(previewUrls);
  };

  const handleProfileImageUpload = async (files: File[]): Promise<string[]> => {
    const file = files[0];
    if (!file) return [];

    try {
      // Upload to Firebase Storage
      const downloadURL = await firebaseUserApi.uploadProfilePicture(file);

      // Delete old profile picture if it exists and is a Firebase Storage URL
      if (
        profile.profilePicture &&
        profile.profilePicture.includes('firebasestorage.googleapis.com')
      ) {
        try {
          await firebaseUserApi.deleteProfilePicture(profile.profilePicture);
        } catch {
          // Silently fail - old picture deletion is not critical
        }
      }

      setFormData(prev => ({ ...prev, profilePicture: downloadURL }));

      return [downloadURL];
    } catch (err) {
      console.error('File upload error:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const updatedProfile = await firebaseUserApi.updateProfile(formData);
      onProfileUpdate(updatedProfile);
      onClose();
    } catch (error: unknown) {
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form data to original values
      setFormData({
        name: profile.name,
        bio: profile.bio || '',
        location: profile.location || '',
        profilePicture: profile.profilePicture || '',
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="max-w-2xl w-full mx-auto p-4">
      <div className="bg-background rounded-lg shadow-xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Edit Profile
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="space-y-4">
            <ImageUpload
              label="Profile Picture"
              singleImage={true}
              maxSizeMB={5}
              images={profileImageFile}
              previewUrls={profileImagePreview}
              onImagesChange={handleProfileImageChange}
              uploadMode="instant"
              onUpload={handleProfileImageUpload}
              showProgress={true}
              placeholder="Upload profile picture"
              disabled={isLoading}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">
              <User className="w-4 h-4 inline mr-2" />
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
              required
              disabled={isLoading}
              className="text-base"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-base font-medium">
              <FileText className="w-4 h-4 inline mr-2" />
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={e => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={160}
              disabled={isLoading}
              className="text-base resize-none"
            />
            <div className="text-sm text-muted-foreground text-right">
              {formData.bio.length}/160
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-medium">
              <MapPin className="w-4 h-4 inline mr-2" />
              Location
            </Label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={e => handleInputChange('location', e.target.value)}
              placeholder="City, Country"
              disabled={isLoading}
              className="text-base"
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Privacy Settings
            </h3>

            <div className="space-y-2">
              <Label className="text-base font-medium">
                <Globe className="w-4 h-4 inline mr-2" />
                Profile Visibility
              </Label>
              <Select
                value={profileVisibility}
                onChange={e =>
                  setProfileVisibility(
                    e.target.value as 'everyone' | 'followers' | 'private'
                  )
                }
              >
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
