'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Group, UpdateGroupData, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Save, AlertTriangle, Image as ImageIcon, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GroupSettingsProps {
  group: Group
  admins: User[]
  onUpdate: (data: UpdateGroupData) => Promise<void>
  onDelete: () => Promise<void>
  onAddAdmin: (userId: string) => Promise<void>
  onRemoveAdmin: (userId: string) => Promise<void>
  isLoading?: boolean
}

const categoryOptions = [
  { value: 'work', label: 'Work' },
  { value: 'study', label: 'Study' },
  { value: 'side-project', label: 'Side Project' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' },
]

const typeOptions = [
  { value: 'just-for-fun', label: 'Just for Fun' },
  { value: 'professional', label: 'Professional' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'other', label: 'Other' },
]

export default function GroupSettings({
  group,
  admins,
  onUpdate,
  onDelete,
  onAddAdmin,
  onRemoveAdmin,
  isLoading = false,
}: GroupSettingsProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<UpdateGroupData>({
    name: group.name,
    description: group.description,
    category: group.category,
    type: group.type,
    privacySetting: group.privacySetting,
    location: group.location || '',
    imageUrl: group.imageUrl || '',
    bannerUrl: group.bannerUrl || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newAdminUsername, setNewAdminUsername] = useState('')

  const handleInputChange = (field: keyof UpdateGroupData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Group name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Group name must be less than 50 characters'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Group description is required'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location must be less than 100 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      await onUpdate(formData)
    } catch (_error) {
      // Silent failure
    }
  }

  const handleImageUpload = (type: 'imageUrl' | 'bannerUrl', file: File) => {
    // In a real implementation, you would upload the file to a storage service
    const url = URL.createObjectURL(file)
    handleInputChange(type, url)
  }

  const handleAddAdmin = async () => {
    if (!newAdminUsername.trim()) return

    try {
      await onAddAdmin(newAdminUsername.trim())
      setNewAdminUsername('')
    } catch (_error) {
      // Silent failure
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-50 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">Edit Group</h1>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-[#0066CC] text-white rounded-lg font-semibold text-sm hover:bg-[#0051D5] transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Edit Group</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#0066CC] text-white rounded-xl font-semibold hover:bg-[#0051D5] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>

          <div className="space-y-4">
            {/* Group Name */}
            <div>
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              <div className="flex justify-between mt-1">
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                <p className="text-sm text-gray-500 ml-auto">
                  {(formData.description || '').length}/500
                </p>
              </div>
            </div>

            {/* Category and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category || 'other'}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={formData.type || 'just-for-fun'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Privacy Setting */}
            <div>
              <Label htmlFor="privacySetting">Privacy Setting *</Label>
              <select
                id="privacySetting"
                value={formData.privacySetting || 'public'}
                onChange={(e) => handleInputChange('privacySetting', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="approval-required">Approval Required - Admins must approve</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
              />
              {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
            </div>
          </div>
        </div>

        {/* Group Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Group Images</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group Avatar */}
            <div>
              <Label>Group Avatar</Label>
              <div className="mt-2">
                {formData.imageUrl ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <Image
                      src={formData.imageUrl}
                      alt="Group avatar"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('imageUrl', '')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload('imageUrl', file)
                      }}
                      className="hidden"
                    />
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </label>
                )}
              </div>
            </div>

            {/* Group Banner */}
            <div>
              <Label>Group Banner</Label>
              <div className="mt-2">
                {formData.bannerUrl ? (
                  <div className="relative w-full h-20 rounded-lg overflow-hidden border">
                    <Image
                      src={formData.bannerUrl}
                      alt="Group banner"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('bannerUrl', '')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload('bannerUrl', file)
                      }}
                      className="hidden"
                    />
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Administrators */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Administrators</h3>

          {/* Current Admins */}
          <div className="space-y-3 mb-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-600 text-sm font-medium">
                      {admin.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{admin.name}</p>
                    <p className="text-sm text-gray-500">@{admin.username}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveAdmin(admin.id)}
                  disabled={admins.length === 1} // Can't remove the last admin
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Admin */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter username to add as admin"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
            />
            <Button onClick={handleAddAdmin} disabled={!newAdminUsername.trim()}>
              Add Admin
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4">Danger Zone</h3>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Delete Group</h4>
              <p className="text-sm text-red-700 mt-1">
                Once you delete a group, there is no going back. Please be certain.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Group
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Are you absolutely sure?</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This action cannot be undone. This will permanently delete the group and remove
                    all associated data.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="destructive" size="sm" onClick={onDelete} disabled={isLoading}>
                      Yes, delete the group
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
