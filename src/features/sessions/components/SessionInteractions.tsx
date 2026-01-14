'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
} from 'lucide-react'

interface SessionInteractionsProps {
  sessionId: string
  supportCount: number
  commentCount: number
  isSupported: boolean
  supportedBy?: string[]
  onSupport: (sessionId: string) => Promise<void>
  onRemoveSupport: (sessionId: string) => Promise<void>
  onShare: (sessionId: string) => Promise<void>
  onShareImage?: () => void
  isOwnPost?: boolean
  onCommentClick?: () => void
  onLikesClick?: () => void
  className?: string
}

export const SessionInteractions: React.FC<SessionInteractionsProps> = ({
  sessionId,
  supportCount,
  commentCount,
  isSupported,
  onSupport,
  onRemoveSupport,
  onShare,
  onShareImage,
  isOwnPost = false,
  onCommentClick,
  onLikesClick,
  className = '',
}) => {
  const [isSupporting, setIsSupporting] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  const handleSupport = async () => {
    if (isSupporting) return

    setIsSupporting(true)
    try {
      if (isSupported) {
        await onRemoveSupport(sessionId)
      } else {
        await onSupport(sessionId)
      }
    } catch {
    } finally {
      setIsSupporting(false)
    }
  }

  const handleShare = async () => {
    if (isSharing) return

    setIsSharing(true)
    try {
      await onShare(sessionId)
    } catch {
    } finally {
      setIsSharing(false)
      setShowShareMenu(false)
    }
  }

  const handleShareImage = () => {
    if (onShareImage) {
      onShareImage()
      setShowShareMenu(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      const sessionUrl = `${window.location.origin}/sessions/${sessionId}`
      await navigator.clipboard.writeText(sessionUrl)
      setShowShareMenu(false)
      // Optional: Show a toast notification here
    } catch {}
  }

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowShareMenu(false)
      }
    }

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showShareMenu])

  return (
    <div className={className}>
      {/* Desktop layout - Duolingo style */}
      <div className="hidden md:block">
        {/* Counts section - top left */}
        <div className="px-4 pb-3 flex items-center justify-between text-sm text-[#777777]">
          <div className="flex items-center gap-4">
            {supportCount > 0 && (
              <button
                onClick={onLikesClick}
                className="hover:text-[#3C3C3C] transition-colors font-bold"
                aria-label={`View ${supportCount} ${supportCount === 1 ? 'person who liked this' : 'people who liked this'}`}
              >
                {supportCount} {supportCount === 1 ? 'like' : 'likes'}
              </button>
            )}
          </div>
        </div>

        {/* Action buttons - Duolingo style (bottom right on desktop) */}
        <div className="px-4 py-3 border-t-2 border-[#E5E5E5]">
          <div className="flex items-center justify-end gap-2">
            {/* Like button */}
            <button
              onClick={handleSupport}
              disabled={isSupporting}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors ${
                isSupporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              aria-label={
                isSupported
                  ? `Unlike session (${supportCount} ${supportCount === 1 ? 'like' : 'likes'})`
                  : `Like session (${supportCount} ${supportCount === 1 ? 'like' : 'likes'})`
              }
            >
              <ThumbsUp
                className={`w-5 h-5 transition-colors ${
                  isSupported ? 'fill-[#58CC02] text-[#58CC02]' : 'text-[#AFAFAF]'
                }`}
                strokeWidth={2}
                aria-hidden="true"
              />
              <span
                className={`text-sm font-bold ${isSupported ? 'text-[#58CC02]' : 'text-[#AFAFAF]'}`}
                aria-hidden="true"
              >
                {supportCount > 0 ? supportCount : ''}
              </span>
            </button>

            {/* Comment button */}
            <button
              onClick={onCommentClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors"
              aria-label={`View and add comments (${commentCount} ${commentCount === 1 ? 'comment' : 'comments'})`}
            >
              <MessageSquare
                className="w-5 h-5 text-[#AFAFAF]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="text-sm font-bold text-[#AFAFAF]" aria-hidden="true">
                {commentCount > 0 ? commentCount : ''}
              </span>
            </button>

            {/* Share button with dropdown */}
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                disabled={isSharing}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors ${
                  isSharing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                aria-label="Share session"
                aria-expanded={showShareMenu}
                aria-haspopup="true"
              >
                <Share2 className="w-5 h-5 text-[#AFAFAF]" strokeWidth={2} aria-hidden="true" />
              </button>

              {/* Share dropdown menu */}
              {showShareMenu && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border-2 border-[#E5E5E5] py-2 z-50"
                  role="menu"
                  aria-label="Share options"
                >
                  {isOwnPost && onShareImage && (
                    <>
                      <button
                        onClick={handleShareImage}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-[#3C3C3C] hover:bg-[#F7F7F7] flex items-center gap-3"
                        role="menuitem"
                        aria-label="Share session as image"
                      >
                        <ImageIcon className="w-5 h-5 text-[#1CB0F6]" aria-hidden="true" />
                        Share as image
                      </button>
                      <div className="border-t-2 border-[#E5E5E5] my-1" aria-hidden="true"></div>
                    </>
                  )}
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-[#3C3C3C] hover:bg-[#F7F7F7] flex items-center gap-3"
                    role="menuitem"
                    aria-label="Share session link"
                  >
                    <LinkIcon className="w-5 h-5 text-[#1CB0F6]" aria-hidden="true" />
                    Share link
                  </button>
                  <div className="border-t-2 border-[#E5E5E5] my-1" aria-hidden="true"></div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-3 text-left text-sm font-bold text-[#3C3C3C] hover:bg-[#F7F7F7] flex items-center gap-3"
                    role="menuitem"
                    aria-label="Copy session link to clipboard"
                  >
                    <Copy className="w-5 h-5 text-[#1CB0F6]" aria-hidden="true" />
                    Copy to clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout - Duolingo style */}
      <div className="md:hidden">
        {/* Counts section */}
        <div className="px-4 py-2 flex items-center justify-between text-sm text-[#777777] font-semibold">
          <button
            onClick={onLikesClick}
            className="hover:text-[#3C3C3C] transition-colors min-h-[44px] flex items-center"
            disabled={supportCount === 0}
            aria-label={`View ${supportCount} ${supportCount === 1 ? 'person who liked this' : 'people who liked this'}`}
          >
            {supportCount} {supportCount === 1 ? 'like' : 'likes'}
          </button>
          <button
            onClick={onCommentClick}
            className="hover:text-[#3C3C3C] transition-colors min-h-[44px] flex items-center"
            aria-label={`View ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
          >
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </button>
        </div>

        {/* Action buttons - 3 equal width columns */}
        <div className="px-4 pb-3 border-t-2 border-[#E5E5E5]">
          <div className="grid grid-cols-3 gap-1 pt-2">
            {/* Like button */}
            <button
              onClick={handleSupport}
              disabled={isSupporting}
              className={`flex flex-col items-center justify-center py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors min-h-[44px] ${
                isSupporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              aria-label={
                isSupported
                  ? `Unlike session (${supportCount} ${supportCount === 1 ? 'like' : 'likes'})`
                  : `Like session (${supportCount} ${supportCount === 1 ? 'like' : 'likes'})`
              }
            >
              <ThumbsUp
                className={`w-6 h-6 transition-colors ${
                  isSupported ? 'fill-[#58CC02] text-[#58CC02]' : 'text-[#AFAFAF]'
                }`}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>

            {/* Comment button */}
            <button
              onClick={onCommentClick}
              className="flex flex-col items-center justify-center py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors min-h-[44px]"
              aria-label={`View and add comments (${commentCount} ${commentCount === 1 ? 'comment' : 'comments'})`}
            >
              <MessageSquare
                className="w-6 h-6 text-[#AFAFAF]"
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>

            {/* Share button with dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                disabled={isSharing}
                className={`flex flex-col items-center justify-center py-2 rounded-xl hover:bg-[#F7F7F7] transition-colors w-full min-h-[44px] ${
                  isSharing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                aria-label="Share session"
                aria-expanded={showShareMenu}
                aria-haspopup="true"
              >
                <Share2 className="w-6 h-6 text-[#AFAFAF]" strokeWidth={2} aria-hidden="true" />
              </button>

              {/* Share dropdown menu (mobile) */}
              {showShareMenu && (
                <div
                  className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-2xl shadow-lg border-2 border-[#E5E5E5] py-2 z-50"
                  role="menu"
                  aria-label="Share options"
                >
                  {isOwnPost && onShareImage && (
                    <>
                      <button
                        onClick={handleShareImage}
                        className="w-full px-4 py-3 text-left text-base font-bold text-[#3C3C3C] hover:bg-[#F7F7F7] flex items-center gap-3"
                        role="menuitem"
                        aria-label="Share session as image"
                      >
                        <ImageIcon className="w-5 h-5 text-[#1CB0F6]" aria-hidden="true" />
                        Share as image
                      </button>
                      <div className="border-t-2 border-[#E5E5E5] my-1" aria-hidden="true"></div>
                    </>
                  )}
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-3 text-left text-base font-bold text-[#3C3C3C] hover:bg-[#F7F7F7] flex items-center gap-3"
                    role="menuitem"
                    aria-label="Share session link"
                  >
                    <LinkIcon className="w-5 h-5 text-[#1CB0F6]" aria-hidden="true" />
                    Share link
                  </button>
                  <div className="border-t-2 border-[#E5E5E5] my-1" aria-hidden="true"></div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-3 text-left text-base font-bold text-[#3C3C3C] hover:bg-[#F7F7F7] flex items-center gap-3"
                    role="menuitem"
                    aria-label="Copy session link to clipboard"
                  >
                    <Copy className="w-5 h-5 text-[#1CB0F6]" aria-hidden="true" />
                    Copy to clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionInteractions
