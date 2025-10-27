'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserSearchResult } from '@/types';
import { firebaseUserApi } from '@/lib/api';

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
  user: UserSearchResult;
  index: number;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  sessionId,
  parentId,
  placeholder = 'Add a comment, @ to mention',
  onSubmit,
  onCancel,
  autoFocus = false,
  initialValue = '',
}) => {
  const maxCharacters = 1000;
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<
    UserSearchResult[]
  >([]);
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

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Handle mention search
  useEffect(() => {
    const searchMentions = async () => {
      if (mentionQuery.length > 0) {
        try {
          const results = await firebaseUserApi.searchUsers(mentionQuery, 5);
          setMentionSuggestions(results.users);
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

    // Enforce character limit
    if (value.length > maxCharacters) {
      return;
    }

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

  const insertMention = (user: UserSearchResult) => {
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
        setSelectedMentionIndex(prev =>
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev =>
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
        );
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const selectedUser = mentionSuggestions[selectedMentionIndex];
        if (selectedUser) {
          insertMention(selectedUser);
        }
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
      <div className="flex items-center gap-3 border-t border-gray-200 pt-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className="flex-1 px-0 pt-2 pb-0 bg-transparent border-0 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[20px] max-h-[120px] scrollbar-hide overflow-y-auto text-base placeholder:text-gray-400 leading-5"
          rows={1}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          aria-label="Comment input"
          aria-describedby="comment-help-text"
          maxLength={1000}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`text-base font-semibold transition-colors flex-shrink-0 leading-5 ${
            content.trim() && !isSubmitting
              ? 'text-[#007AFF] hover:text-[#0051D5]'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          aria-label="Post comment"
        >
          Send
        </button>
      </div>
      <span id="comment-help-text" className="sr-only">
        Use @ to mention users. Press Cmd+Enter or Ctrl+Enter to submit.
      </span>

      {/* Mention Suggestions Dropdown */}
      {showMentions && mentionSuggestions.length > 0 && (
        <div
          ref={mentionDropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-60 overflow-y-auto"
          role="listbox"
          aria-label="User mentions"
        >
          {mentionSuggestions.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                index === selectedMentionIndex ? 'bg-blue-50' : ''
              }`}
              role="option"
              aria-selected={index === selectedMentionIndex}
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
                    {user.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
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
    </div>
  );
};

export default CommentInput;
