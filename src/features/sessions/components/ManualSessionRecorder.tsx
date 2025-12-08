'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { CreateSessionData, Activity } from '@/types'
import { firebaseApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'
import { Image as ImageIcon, X, ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'
import { uploadImages } from '@/lib/imageUpload'
import { parseLocalDateTime } from '@/lib/utils'
import Header from '@/components/HeaderComponent'
import { debug } from '@/lib/debug'
import { useAllActivityTypes } from '@/hooks/useActivityTypes'
import Link from 'next/link'
import { IconRenderer } from '@/components/IconRenderer'

interface DeleteConfirmProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

const DeleteConfirm: React.FC<DeleteConfirmProps> = ({ isOpen, onClose, onDelete }) => {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 md:hidden flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Image?</h3>
          <p className="text-sm text-gray-600 mb-6">
            This image will be removed from your session.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 active:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete()
                onClose()
              }}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 active:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function ManualSessionRecorder() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Activity data
  const { data: activityTypes = [] } = useAllActivityTypes(user?.id || '', {
    enabled: !!user?.id,
  })

  const allActivities: Activity[] = useMemo(
    () =>
      activityTypes.map((type) => ({
        id: type.id,
        name: type.name,
        description: type.description || '',
        icon: type.icon,
        color: type.defaultColor,
        userId: type.userId || '',
        status: 'active' as const,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
      })),
    [activityTypes]
  )

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Activity selection state
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [showActivityPicker, setShowActivityPicker] = useState(false)
  const [showActivityError, setShowActivityError] = useState(false)

  const selectedActivity = allActivities.find((a) => a.id === selectedActivityId) || null

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'everyone' | 'followers' | 'private'>('everyone')
  const [privateNotes] = useState('')

  // Manual time inputs
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  })
  const [manualDurationHours, setManualDurationHours] = useState('1')
  const [manualDurationMinutes, setManualDurationMinutes] = useState('0')

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [actionSheetIndex, setActionSheetIndex] = useState<number | null>(null)

  // Auto-generate title based on time of day and activity
  useEffect(() => {
    if (!title && selectedActivityId && allActivities.length > 0) {
      const activity = allActivities.find((a) => a.id === selectedActivityId)
      const hour = new Date().getHours()

      let timeOfDay = ''
      if (hour < 12) timeOfDay = 'Morning'
      else if (hour < 17) timeOfDay = 'Afternoon'
      else timeOfDay = 'Evening'

      const smartTitle = activity
        ? `${timeOfDay} ${activity.name} Session`
        : `${timeOfDay} Work Session`
      setTitle(smartTitle)
    }
  }, [selectedActivityId, allActivities, title])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length + selectedImages.length > 3) {
      showToast('Maximum 3 images allowed', 'warning')
      return
    }

    const validFiles: File[] = []
    const previewUrls: string[] = []

    for (const file of files) {
      try {
        // Convert HEIC to JPEG first if needed
        let processedFile = file

        const isHeic =
          file.name.toLowerCase().endsWith('.heic') ||
          file.name.toLowerCase().endsWith('.heif') ||
          file.type === 'image/heic' ||
          file.type === 'image/heif'

        if (isHeic) {
          try {
            const heic2anyModule = await import('heic2any')
            const heic2any = (heic2anyModule as any).default || heic2anyModule

            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.9,
            })
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob

            if (!blob) {
              throw new Error('Failed to convert HEIC file')
            }

            processedFile = new File(
              [blob],
              file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
              { type: 'image/jpeg' }
            )
          } catch (_error) {
            debug.error('ManualSessionRecorder - Error converting HEIC')
            showToast(
              `HEIC conversion is currently unavailable. Please convert ${file.name} to JPG or PNG before uploading, or try refreshing the page.`,
              'error'
            )
            continue
          }
        }

        if (!processedFile.type.startsWith('image/')) {
          showToast(`${file.name} is not an image file`, 'warning')
          continue
        }

        if (processedFile.size > 10 * 1024 * 1024) {
          showToast(`${file.name} is too large. Maximum size is 10MB`, 'warning')
          continue
        }

        validFiles.push(processedFile)
        const previewUrl = URL.createObjectURL(processedFile)
        previewUrls.push(previewUrl)
      } catch (_error) {
        debug.error('ManualSessionRecorder - Error processing image')
        showToast(`Failed to process ${file.name}`, 'error')
      }
    }

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles])
      setImagePreviewUrls((prev) => [...prev, ...previewUrls])
    }
  }

  const handleRemoveImage = (index: number) => {
    const imageUrl = imagePreviewUrls[index]
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const calculateDuration = (): number => {
    const hours = parseInt(manualDurationHours) || 0
    const minutes = parseInt(manualDurationMinutes) || 0
    return hours * 3600 + minutes * 60
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedActivityId) {
      newErrors.activityId = 'Please select an activity'
      setShowActivityError(true)
    }

    if (!title.trim()) {
      newErrors.title = 'Please enter a session title'
    }

    const duration = calculateDuration()
    if (duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0'
    }

    if (!sessionDate) {
      newErrors.sessionDate = 'Please select a date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) {
      return
    }

    if (!selectedActivityId) {
      setErrors((prev) => ({ ...prev, activityId: 'Please select an activity' }))
      setShowActivityError(true)
      return
    }

    setIsLoading(true)

    try {
      const duration = calculateDuration()

      if (!sessionDate || !startTime) {
        setErrors({ sessionDate: 'Date and time are required' })
        setIsLoading(false)
        return
      }
      const sessionDateTime = parseLocalDateTime(sessionDate, startTime)

      // Upload images first if any
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        setIsUploadingImages(true)
        try {
          const uploadResults = await uploadImages(selectedImages)
          imageUrls = uploadResults.map((result) => result.url)
        } catch (_error) {
          debug.error('ManualSessionRecorder - Failed to upload images')
          setErrors({ submit: 'Failed to upload images. Please try again.' })
          setIsUploadingImages(false)
          setIsLoading(false)
          return
        }
        setIsUploadingImages(false)
      }

      const formData: CreateSessionData = {
        activityId: selectedActivityId,
        // If your backend still needs projectId, you can map from activity->project here if needed.
        projectId: '',
        title,
        description,
        duration,
        startTime: sessionDateTime,
        tags: [],
        visibility,
        privateNotes,
        images: imageUrls,
      }

      await firebaseApi.session.createSessionWithPost(formData, description, visibility)

      showToast('Session created successfully!', 'success')

      if (user) {
        queryClient.invalidateQueries({
          queryKey: ['user', 'sessions', user.id],
        })
        queryClient.invalidateQueries({ queryKey: ['user', 'stats', user.id] })
        queryClient.invalidateQueries({ queryKey: ['streak', user.id] })
        queryClient.invalidateQueries({ queryKey: ['feed'] })
        queryClient.invalidateQueries({ queryKey: ['sessions', 'feed'] })
      }

      router.push('/')
    } catch (_error) {
      debug.error('ManualSessionRecorder - Failed to create manual session')
      showToast('Failed to create session. Please try again.', 'error')
      setErrors({ submit: 'Failed to create session. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header - hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Header with Cancel and Save Session title */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#0066CC] hover:text-[#0051D5] font-semibold text-base"
            disabled={isLoading}
          >
            Cancel
          </button>
          <h3 className="text-base font-semibold text-gray-900">Log Manual Session</h3>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Session Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Afternoon Work Session"
            disabled={isLoading}
          />
          {errors.title && <p className="text-red-500 text-sm -mt-2">{errors.title}</p>}

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-base"
            placeholder="How'd it go? Share more about your session."
            disabled={isLoading}
          />

          {/* Activity Selection (matches timer dropdown UI) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity{' '}
              {showActivityError && (
                <span className="text-red-600 ml-1">- Please select an activity</span>
              )}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActivityPicker(!showActivityPicker)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 bg-white cursor-pointer text-base flex items-center gap-3 transition-colors ${
                  showActivityError || errors.activityId
                    ? 'border-red-500 ring-2 ring-red-200 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-[#0066CC] focus:border-[#0066CC] hover:border-gray-400'
                }`}
                disabled={isLoading}
              >
                {selectedActivity ? (
                  <>
                    <IconRenderer
                      iconName={selectedActivity.icon}
                      className="w-6 h-6 text-gray-700 flex-shrink-0"
                    />
                    <span className="flex-1 text-left font-medium">{selectedActivity.name}</span>
                  </>
                ) : (
                  <span className="flex-1 text-left text-gray-500">Select an activity</span>
                )}
                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {showActivityPicker && (
                <>
                  {/* Backdrop for closing */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActivityPicker(false)}
                  />

                  {/* Dropdown content */}
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                    {allActivities.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-600 mb-3">No activities yet</p>
                        <Link
                          href="/settings/activities"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors text-sm font-medium"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Create Activity
                        </Link>
                      </div>
                    ) : (
                      <>
                        {allActivities.map((activity) => (
                          <button
                            key={activity.id}
                            type="button"
                            onClick={() => {
                              setSelectedActivityId(activity.id)
                              setShowActivityPicker(false)
                              setShowActivityError(false)
                              setErrors((prev) => {
                                const { activityId, ...rest } = prev
                                return rest
                              })
                            }}
                            className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                              selectedActivityId === activity.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <IconRenderer
                              iconName={activity.icon}
                              className="w-5 h-5 text-gray-700 flex-shrink-0"
                            />
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {activity.name}
                              </div>
                            </div>
                            {selectedActivityId === activity.id && (
                              <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            )}
                          </button>
                        ))}
                        <Link
                          href="/settings/activities"
                          className="w-full flex items-center gap-3 p-3 border-t border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                        >
                          <svg
                            className="w-5 h-5 text-gray-600 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span className="text-sm">Add custom activity</span>
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            {errors.activityId && <p className="text-red-500 text-sm mt-1">{errors.activityId}</p>}
          </div>

          {/* Image Upload */}
          <div className="max-w-md">
            <div className="space-y-3">
              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        width={300}
                        height={300}
                        quality={90}
                        className="w-full h-full object-cover"
                        unoptimized
                        onClick={() => setActionSheetIndex(index)}
                      />
                      {/* Desktop X button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="hidden md:block absolute top-1 right-1 p-0.5 text-white hover:text-red-500 transition-colors"
                        aria-label="Remove image"
                        style={{
                          filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.9))',
                        }}
                      >
                        <X className="w-5 h-5" strokeWidth={3} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Delete confirmation modal */}
              <DeleteConfirm
                isOpen={actionSheetIndex !== null}
                onClose={() => setActionSheetIndex(null)}
                onDelete={() => {
                  if (actionSheetIndex !== null) {
                    handleRemoveImage(actionSheetIndex)
                    setActionSheetIndex(null)
                  }
                }}
              />

              {/* Upload Button */}
              {selectedImages.length < 3 && (
                <label className="flex flex-col items-center justify-center gap-2 px-8 py-8 border-[3px] border-dashed border-[#0066CC] rounded-lg cursor-pointer hover:border-[#0051D5] hover:bg-gray-50 transition-colors max-w-[240px]">
                  <ImageIcon className="w-8 h-8 text-[#0066CC]" />
                  <span className="text-sm font-medium text-[#0066CC]">
                    {imagePreviewUrls.length === 0
                      ? 'Add images'
                      : `Add ${3 - imagePreviewUrls.length} more`}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Date and Time Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Date & Time</label>

            <div className="space-y-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm ${
                    errors.sessionDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                  required
                />
                {errors.sessionDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.sessionDate}</p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={manualDurationHours}
                      onChange={(e) => setManualDurationHours(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm ${
                        errors.duration ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Hours"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={manualDurationMinutes}
                      onChange={(e) => setManualDurationMinutes(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] text-sm ${
                        errors.duration ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minutes"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as 'everyone' | 'followers' | 'private')
              }
              className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] appearance-none bg-white min-h-[44px]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
              }}
              disabled={isLoading}
            >
              <option value="everyone">Everyone</option>
              <option value="followers">Followers</option>
              <option value="private">Only You</option>
            </select>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full px-4 py-3 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base mt-4"
            disabled={isLoading || isUploadingImages}
          >
            {isUploadingImages ? 'Uploading...' : isLoading ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </div>
    </div>
  )
}
