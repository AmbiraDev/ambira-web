'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User } from '@/types';
import { firebaseUserApi } from '@/lib/firebaseApi';

interface CommentInputProps {
  sessionId: string;
  parentId?: string;
  placeholder?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  initialValue?: string;
}

interface MentionSuggestion {
  user: User;
  index: number;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  sessionId,
  parentId,
  placeholder = 'Write a comment...',
  onSubmit,
  onCancel,
  autoFocus = false,
  initialValue = ''
}) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Handle mention search
  useEffect(() => {
    const searchMentions = async () => {
      if (mentionQuery.length > 0) {
        try {
          const results = await firebaseUserApi.searchUsers(mentionQuery, 5);
          setMentionSuggestions(results);
        } catch (error) {
          console.error('Failed to search users:', error);
          setMentionSuggestions([]);
        }
      } else {
        setMentionSuggestions([]);
      }
    };

    const debounce = setTimeout(searchMentions, 200);
    return () => clearTimeout(debounce);
  }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setContent(value);

    // Check for @ mentions
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      
      // Check if there's a space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length < 20) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: User) => {
    if (mentionStartPos === null) return;

    const beforeMention = content.slice(0, mentionStartPos);
    const cursorPos = textareaRef.current?.selectionStart || content.length;
    const afterCursor = content.slice(cursorPos);
    
    const newContent = `${beforeMention}@${user.username} ${afterCursor}`;
    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartPos(null);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartPos + user.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(mentionSuggestions[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      setShowMentions(false);
      setMentionQuery('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setShowMentions(false);
    if (onCancel) onCancel();
  };

  return (
    <div className="relative">
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] max-h-[200px]"
          rows={1}
        />
      </div>

      {/* Mention Suggestions Dropdown */}
      {showMentions && mentionSuggestions.length > 0 && (
        <div
          ref={mentionDropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-60 overflow-y-auto"
        >
          {mentionSuggestions.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                index === selectedMentionIndex ? 'bg-orange-50' : ''
              }`}
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {user.name}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  @{user.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">
          {showMentions ? 'Use ↑↓ to navigate, Enter to select' : 'Use @ to mention users • Cmd/Ctrl+Enter to post'}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;

