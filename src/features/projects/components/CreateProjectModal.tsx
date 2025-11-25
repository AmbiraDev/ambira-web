'use client'

import React, { useState } from 'react'
import { CreateProjectData } from '@/types'
import { useCreateActivity } from '@/hooks/useActivitiesQuery'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (projectId: string) => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createProject = useCreateActivity()
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    icon: '💻',
    color: 'orange',
    weeklyTarget: undefined,
    totalTarget: undefined,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectData, string>>>({})

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Preset icons
  const availableIcons = ['💻', '⚛️', '💪', '📚', '🎨', '🏃', '🎵', '🔬', '📝', '🚀']

  // Preset colors
  const availableColors = [
    { name: 'orange', class: 'bg-orange-500', hex: '#f97316' },
    { name: 'blue', class: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'green', class: 'bg-green-500', hex: '#22c55e' },
    { name: 'purple', class: 'bg-purple-500', hex: '#a855f7' },
    { name: 'red', class: 'bg-red-500', hex: '#ef4444' },
    { name: 'yellow', class: 'bg-yellow-500', hex: '#eab308' },
    { name: 'pink', class: 'bg-pink-500', hex: '#ec4899' },
    { name: 'indigo', class: 'bg-indigo-500', hex: '#6366f1' },
  ]

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateProjectData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Project name must be less than 50 characters'
    }

    if (formData.description.trim() && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters'
    }

    if (formData.weeklyTarget && (formData.weeklyTarget < 0 || formData.weeklyTarget > 168)) {
      newErrors.weeklyTarget = 'Weekly target must be between 0 and 168 hours'
    }

    if (formData.totalTarget && (formData.totalTarget < 0 || formData.totalTarget > 10000)) {
      newErrors.totalTarget = 'Total target must be between 0 and 10,000 hours'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!createProject) {
      return
    }

    try {
      setIsSubmitting(true)
      const project = await createProject.mutateAsync({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        weeklyTarget: formData.weeklyTarget || undefined,
        totalTarget: formData.totalTarget || undefined,
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        icon: '💻',
        color: 'orange',
        weeklyTarget: undefined,
        totalTarget: undefined,
      })
      setErrors({})

      onSuccess?.(project.id)
      onClose()
    } catch (_err) {
      setErrors({ name: 'Failed to create project. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    field: keyof CreateProjectData,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 id="create-project-title" className="text-xl sm:text-2xl font-bold text-gray-900">
              Create New Project
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close dialog"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Preview */}
            <div className="flex flex-col items-center pb-6 border-b border-gray-200">
              <div
                className={`w-24 h-24 ${availableColors.find((c) => c.name === formData.color)?.class || 'bg-orange-500'} rounded-xl flex items-center justify-center text-white text-4xl mb-3 shadow-md`}
              >
                {formData.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{formData.name || 'Project Name'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formData.description || 'Project description'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter project name"
                  maxLength={50}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  autoFocus
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] resize-none transition-colors ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your project (optional)"
                  rows={3}
                  maxLength={200}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/200 characters
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Icon Picker */}
              <div>
                <label
                  id="icon-picker-label"
                  className="block text-sm font-semibold text-gray-900 mb-3"
                >
                  Icon
                </label>
                <div
                  className="grid grid-cols-5 gap-3"
                  role="radiogroup"
                  aria-labelledby="icon-picker-label"
                >
                  {availableIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      role="radio"
                      aria-checked={formData.icon === icon}
                      onClick={() => handleInputChange('icon', icon)}
                      className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                        formData.icon === icon
                          ? 'border-[#0066CC] bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      aria-label={`Select ${icon} icon`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label
                  id="color-picker-label"
                  className="block text-sm font-semibold text-gray-900 mb-3"
                >
                  Color
                </label>
                <div
                  className="grid grid-cols-4 gap-3"
                  role="radiogroup"
                  aria-labelledby="color-picker-label"
                >
                  {availableColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      role="radio"
                      aria-checked={formData.color === color.name}
                      onClick={() => handleInputChange('color', color.name)}
                      className={`w-14 h-14 rounded-lg border-2 transition-all ${
                        formData.color === color.name
                          ? 'border-gray-800 scale-110 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`Select ${color.name} color`}
                    >
                      {formData.color === color.name && (
                        <svg
                          className="w-6 h-6 text-white drop-shadow-md"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div>
                <label
                  htmlFor="weeklyTarget"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Weekly Target (hours)
                </label>
                <input
                  type="number"
                  id="weeklyTarget"
                  value={formData.weeklyTarget || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'weeklyTarget',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] transition-colors ${
                    errors.weeklyTarget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Optional"
                  min="0"
                  max="168"
                  step="0.5"
                />
                {errors.weeklyTarget && (
                  <p className="mt-1 text-sm text-red-600">{errors.weeklyTarget}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Set a weekly goal for this project</p>
              </div>

              <div>
                <label
                  htmlFor="totalTarget"
                  className="block text-sm font-semibold text-gray-900 mb-2"
                >
                  Total Target (hours)
                </label>
                <input
                  type="number"
                  id="totalTarget"
                  value={formData.totalTarget || ''}
                  onChange={(e) =>
                    handleInputChange(
                      'totalTarget',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] transition-colors ${
                    errors.totalTarget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Optional"
                  min="0"
                  max="10000"
                  step="1"
                />
                {errors.totalTarget && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalTarget}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Set an overall project goal</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
