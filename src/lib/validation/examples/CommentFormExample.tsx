/**
 * Comment Form Example
 *
 * Demonstrates how to use CreateCommentSchema for validating comment submissions
 * with inline validation and real-time feedback.
 *
 * Key patterns:
 * - Inline validation on blur
 * - Character counter
 * - Real-time error clearing
 * - Optimistic UI updates
 */

'use client';

import { useState } from 'react';
import {
  validate,
  CreateCommentSchema,
  type CreateCommentInput,
} from '@/lib/validation';

interface CommentFormProps {
  sessionId: string;
  parentCommentId?: string;
  onCommentCreated?: (commentId: string) => void;
  onCancel?: () => void;
}

export function CommentFormExample({
  sessionId,
  parentCommentId,
  onCommentCreated,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const MAX_LENGTH = 2000;
  const remainingChars = MAX_LENGTH - content.length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }

    // Show validation after user has typed something
    if (!showValidation && newContent.length > 0) {
      setShowValidation(true);
    }
  };

  const handleBlur = () => {
    // Validate on blur if there's content
    if (content.trim()) {
      const result = validate(CreateCommentSchema, {
        sessionId,
        content,
        ...(parentCommentId && { parentCommentId }),
      });

      if (!result.success) {
        const contentError = result.errors.find(err => err.path === 'content');
        if (contentError) {
          setError(contentError.message);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowValidation(true);

    // Prepare data for validation
    const formData: CreateCommentInput = {
      sessionId,
      content,
      ...(parentCommentId && { parentCommentId }),
    };

    // Validate with schema
    const result = validate(CreateCommentSchema, formData);

    if (!result.success) {
      // Show first error
      const firstError = result.errors[0];
      setError(firstError.message);
      return;
    }

    // Type-safe validated data
    const validatedData = result.data;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      const { commentId } = await response.json();

      // Reset form
      setContent('');
      setShowValidation(false);

      // Notify parent
      if (onCommentCreated) {
        onCommentCreated(commentId);
      }
    } catch (_err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError('');
    setShowValidation(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={3}
          maxLength={MAX_LENGTH}
          className={`w-full px-4 py-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? 'border-destructive' : 'border-border'
          }`}
          placeholder={
            parentCommentId ? 'Write a reply...' : 'Write a comment...'
          }
          disabled={isSubmitting}
        />

        {/* Character Counter & Error */}
        <div className="flex items-center justify-between mt-2">
          <div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="text-sm text-muted-foreground">
            {showValidation && (
              <span className={remainingChars < 100 ? 'text-orange-500' : ''}>
                {remainingChars} characters remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Posting...' : parentCommentId ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  );
}

/**
 * Simple inline comment example for quick replies
 */
export function InlineCommentExample({ sessionId }: { sessionId: string }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');

    // Quick validation
    const result = validate(CreateCommentSchema, { sessionId, content });

    if (!result.success) {
      setError(result.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      setContent('');
    } catch (_err) {
      setError('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={content}
          onChange={e => {
            setContent(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          className={`w-full px-4 py-2 pr-20 border rounded-full ${
            error ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Add a comment... (Cmd/Ctrl+Enter to post)"
          disabled={isSubmitting}
          maxLength={2000}
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post
        </button>
      </div>
      {error && <p className="text-sm text-destructive px-4">{error}</p>}
    </div>
  );
}
