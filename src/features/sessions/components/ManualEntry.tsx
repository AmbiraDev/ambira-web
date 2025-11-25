'use client'

import React, { useState, useEffect } from 'react'
import { SessionFormData } from '@/types'
import { parseLocalDateTime } from '@/lib/utils'
import { ERROR_MESSAGES } from '@/config/errorMessages'

interface ManualEntryProps {
  onSave: (data: SessionFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const TAGS = [
  'Study',
  'Work',
  'Side Project',
  'Reading',
  'Learning',
  'Exercise',
  'Creative',
  'Other',
]

const PRIVACY_OPTIONS = [
  { value: 'everyone', label: 'Everyone', description: 'Visible to all users' },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Visible to your followers',
  },
  { value: 'private', label: 'Only You', description: 'Private to you only' },
]

export const ManualEntry: React.FC<ManualEntryProps> = ({
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SessionFormData>({
    activityId: '',
    projectId: '',
    title: '',
    description: '',
    duration: 0,
    startTime: new Date(),
    tags: [],
    visibility: 'everyone',
    howFelt: 3,
    privateNotes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Time inputs
  const [durationHours, setDurationHours] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('12:00')

  // Update duration when time inputs change
  useEffect(() => {
    const totalSeconds = durationHours * 3600 + durationMinutes * 60 + durationSeconds
    setFormData((prev) => ({ ...prev, duration: totalSeconds }))
  }, [durationHours, durationMinutes, durationSeconds])

  // Update start time when date/time inputs change
  useEffect(() => {
    // Parse date and time in local timezone to avoid UTC interpretation issues
    const dateTime = parseLocalDateTime(startDate || '', startTime || '00:00')
    setFormData((prev) => ({ ...prev, startTime: dateTime }))
  }, [startDate, startTime])

  const handleInputChange = (
    field: keyof SessionFormData,
    value: string | number | Date | string[] | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleTagToggle = (tag: string) => {
    const tags = formData.tags || []
    const isSelected = tags.includes(tag)
    const newTags = isSelected ? tags.filter((t) => t !== tag) : [...tags, tag]

    setFormData((prev) => ({ ...prev, tags: newTags }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a session title'
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0'
    }

    if (!startDate) {
      newErrors.startDate = 'Please select a date'
    }

    if (!startTime) {
      newErrors.startTime = 'Please select a time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSave(formData)
    } catch (_error) {
      setErrors({ submit: ERROR_MESSAGES.SESSION_SAVE_FAILED })
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Add Manual Session</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="What did you work on?"
                disabled={isLoading}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  {Array.from({ length: 48 }, (_, i) => {
                    const hour = Math.floor(i / 2)
                    const minute = (i % 2) * 30
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                    return (
                      <option key={i} value={timeString}>
                        {timeString}
                      </option>
                    )
                  })}
                </select>
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>
            </div>

            {/* Duration Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
              {formData.duration > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Total: {formatDuration(formData.duration)}
                </p>
              )}
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What did you accomplish?"
                disabled={isLoading}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      (formData.tags || []).includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    disabled={isLoading}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  handleInputChange(
                    'visibility',
                    e.target.value as 'everyone' | 'followers' | 'private'
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {PRIVACY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            {/* How did it feel? */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How did it feel? (Private)
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleInputChange('howFelt', rating)}
                    className={`w-10 h-10 rounded-full border-2 transition-colors ${
                      formData.howFelt === rating
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                    disabled={isLoading}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Private Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Private Notes</label>
              <textarea
                value={formData.privateNotes || ''}
                onChange={(e) => handleInputChange('privateNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Any private notes about this session..."
                disabled={isLoading}
              />
            </div>

            {/* Error Messages */}
            {errors.submit && <div className="text-red-500 text-sm">{errors.submit}</div>}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
