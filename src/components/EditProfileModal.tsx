'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, User, MapPin, FileText, Globe, Lock, Users } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'everyone' | 'followers' | 'private'>('everyone');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsLoading(true);
      
      // In a real app, you would upload to a cloud service like AWS S3, Cloudinary, etc.
      // For now, we'll simulate with a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, profilePicture: result }));
        toast.success('Profile picture updated');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const updatedProfile = await firebaseUserApi.updateProfile(formData);
      onProfileUpdate(updatedProfile);
      onClose();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Edit Profile</h2>
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
            <Label className="text-base font-medium">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="profile-picture"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {isLoading ? 'Uploading...' : 'Upload Photo'}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>
            </div>
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
              onChange={(e) => handleInputChange('name', e.target.value)}
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
              onChange={(e) => handleInputChange('bio', e.target.value)}
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
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, Country"
              disabled={isLoading}
              className="text-base"
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground">Privacy Settings</h3>
            
            <div className="space-y-2">
              <Label className="text-base font-medium">
                <Globe className="w-4 h-4 inline mr-2" />
                Profile Visibility
              </Label>
              <Select value={profileVisibility} onValueChange={(value: any) => setProfileVisibility(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Everyone</div>
                        <div className="text-sm text-muted-foreground">Anyone can view your profile</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="followers">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Followers Only</div>
                        <div className="text-sm text-muted-foreground">Only people you follow back can view</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Private</div>
                        <div className="text-sm text-muted-foreground">Only you can view your profile</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
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
