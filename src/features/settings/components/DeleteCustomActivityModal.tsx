/**
 * Delete Custom Activity Modal
 *
 * Confirmation dialog for deleting a custom activity.
 * Warns the user that:
 * - This action is permanent (hard delete)
 * - All sessions with this activity will be marked as "Unassigned"
 * - Displays session count if activity has been used
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDeleteCustomActivity } from '@/hooks/useActivityTypes';
import { IconRenderer } from '@/components/IconRenderer';
import { Button } from '@/components/ui/button';
import { ActivityType } from '@/types';

interface DeleteCustomActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  activity: ActivityType | null;
  sessionCount?: number; // Number of sessions using this activity
  totalHours?: number; // Total hours logged with this activity
}

export const DeleteCustomActivityModal: React.FC<
  DeleteCustomActivityModalProps
> = ({
  isOpen,
  onClose,
  onSuccess,
  activity,
  sessionCount = 0,
  totalHours = 0,
}) => {
  const deleteMutation = useDeleteCustomActivity();

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isDeleting]);

  const handleDelete = async () => {
    if (!activity) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteMutation.mutateAsync(activity.id);

      // Success
      onSuccess?.();
      onClose();
    } catch (err) {
      // Error handling
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete custom activity';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !activity) return null;

  const hasUsage = sessionCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete Activity?
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Activity Display */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: activity.defaultColor }}
            >
              <IconRenderer
                iconName={activity.icon}
                className="w-5 h-5"
                style={{ color: '#FFFFFF' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {activity.name}
              </p>
              {activity.description && (
                <p className="text-sm text-gray-500 truncate">
                  {activity.description}
                </p>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this custom activity? This action
              cannot be undone.
            </p>

            {hasUsage && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-1">
                  This activity has existing sessions
                </p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>
                    {sessionCount} session{sessionCount === 1 ? '' : 's'}
                  </li>
                  {totalHours > 0 && (
                    <li>
                      {totalHours.toFixed(1)} hour
                      {totalHours === 1 ? '' : 's'} total
                    </li>
                  )}
                  <li className="mt-2">
                    All sessions will be marked as <strong>Unassigned</strong>
                  </li>
                </ul>
              </div>
            )}

            {!hasUsage && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  This activity has never been used, so no sessions will be
                  affected.
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete Activity'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
