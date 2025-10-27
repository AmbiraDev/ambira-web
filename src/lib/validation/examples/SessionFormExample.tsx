/**
 * Session Form Example
 *
 * Demonstrates how to use SessionFormSchema for validating session creation forms
 * with proper error handling and user-friendly error messages.
 *
 * Key patterns:
 * - Controlled form with useState
 * - Real-time validation clearing
 * - Structured error display
 * - Type-safe form submission
 */

'use client';

import { useState } from 'react';
import { validate, SessionFormSchema } from '@/lib/validation';

interface SessionFormData {
  activityId: string;
  title: string;
  duration: string;
  startTime: string;
  description?: string;
  visibility?: 'everyone' | 'followers' | 'private';
  tags?: string;
  howFelt?: string;
  privateNotes?: string;
  allowComments?: boolean;
}

interface SessionFormErrors {
  activityId?: string;
  title?: string;
  duration?: string;
  startTime?: string;
  description?: string;
  visibility?: string;
  tags?: string;
  howFelt?: string;
  privateNotes?: string;
  allowComments?: string;
}

export function SessionFormExample() {
  const [formData, setFormData] = useState<SessionFormData>({
    activityId: '',
    title: '',
    duration: '',
    startTime: new Date().toISOString().slice(0, 16), // datetime-local format
    visibility: 'everyone',
    allowComments: true,
  });

  const [errors, setErrors] = useState<SessionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof SessionFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setSubmitSuccess(false);

    // Validate form data with SessionFormSchema
    const result = validate(SessionFormSchema, formData);

    if (!result.success) {
      // Map validation errors to form fields
      const newErrors: SessionFormErrors = {};
      result.errors.forEach(error => {
        if (error.path) {
          newErrors[error.path as keyof SessionFormErrors] = error.message;
        } else {
          // Generic errors go to submit error
          setSubmitError(error.message);
        }
      });
      setErrors(newErrors);
      return;
    }

    // Type-safe validated data
    const validatedData = result.data;

    setIsSubmitting(true);

    try {
      // Submit to API
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      setSubmitSuccess(true);
      // Reset form
      setFormData({
        activityId: '',
        title: '',
        duration: '',
        startTime: new Date().toISOString().slice(0, 16),
        visibility: 'everyone',
        allowComments: true,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create session'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          Session created successfully!
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {submitError}
        </div>
      )}

      {/* Activity ID */}
      <div>
        <label
          htmlFor="activityId"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Project/Activity <span className="text-destructive">*</span>
        </label>
        <input
          id="activityId"
          name="activityId"
          type="text"
          value={formData.activityId}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-md ${
            errors.activityId ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Select project..."
        />
        {errors.activityId && (
          <p className="mt-2 text-sm text-destructive">{errors.activityId}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Session Title <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-md ${
            errors.title ? 'border-destructive' : 'border-border'
          }`}
          placeholder="What did you work on?"
          maxLength={200}
        />
        {errors.title && (
          <p className="mt-2 text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      {/* Duration & Start Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Duration (minutes) <span className="text-destructive">*</span>
          </label>
          <input
            id="duration"
            name="duration"
            type="number"
            min="1"
            value={formData.duration}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.duration ? 'border-destructive' : 'border-border'
            }`}
            placeholder="60"
          />
          {errors.duration && (
            <p className="mt-2 text-sm text-destructive">{errors.duration}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Start Time <span className="text-destructive">*</span>
          </label>
          <input
            id="startTime"
            name="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-md ${
              errors.startTime ? 'border-destructive' : 'border-border'
            }`}
          />
          {errors.startTime && (
            <p className="mt-2 text-sm text-destructive">{errors.startTime}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={4}
          className={`w-full px-4 py-3 border rounded-md ${
            errors.description ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Add details about your session..."
          maxLength={5000}
        />
        {errors.description && (
          <p className="mt-2 text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Visibility */}
      <div>
        <label
          htmlFor="visibility"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Visibility
        </label>
        <select
          id="visibility"
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-md ${
            errors.visibility ? 'border-destructive' : 'border-border'
          }`}
        >
          <option value="everyone">Everyone</option>
          <option value="followers">Followers only</option>
          <option value="private">Private</option>
        </select>
        {errors.visibility && (
          <p className="mt-2 text-sm text-destructive">{errors.visibility}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          value={formData.tags || ''}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-md ${
            errors.tags ? 'border-destructive' : 'border-border'
          }`}
          placeholder="coding, learning, project"
        />
        {errors.tags && (
          <p className="mt-2 text-sm text-destructive">{errors.tags}</p>
        )}
      </div>

      {/* How Felt */}
      <div>
        <label
          htmlFor="howFelt"
          className="block text-sm font-medium text-foreground mb-2"
        >
          How did you feel? (1-5)
        </label>
        <input
          id="howFelt"
          name="howFelt"
          type="number"
          min="1"
          max="5"
          value={formData.howFelt || ''}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-md ${
            errors.howFelt ? 'border-destructive' : 'border-border'
          }`}
          placeholder="1-5"
        />
        {errors.howFelt && (
          <p className="mt-2 text-sm text-destructive">{errors.howFelt}</p>
        )}
      </div>

      {/* Private Notes */}
      <div>
        <label
          htmlFor="privateNotes"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Private Notes (only visible to you)
        </label>
        <textarea
          id="privateNotes"
          name="privateNotes"
          value={formData.privateNotes || ''}
          onChange={handleChange}
          rows={3}
          className={`w-full px-4 py-3 border rounded-md ${
            errors.privateNotes ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Personal notes about this session..."
          maxLength={10000}
        />
        {errors.privateNotes && (
          <p className="mt-2 text-sm text-destructive">{errors.privateNotes}</p>
        )}
      </div>

      {/* Allow Comments */}
      <div className="flex items-center">
        <input
          id="allowComments"
          name="allowComments"
          type="checkbox"
          checked={formData.allowComments}
          onChange={handleChange}
          className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
        />
        <label htmlFor="allowComments" className="ml-2 text-sm text-foreground">
          Allow comments on this session
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Creating...' : 'Create Session'}
      </button>
    </form>
  );
}
