'use client';

import React, { useRef, useState } from 'react';
import { SessionWithDetails, User } from '@/types';
import { toPng } from 'html-to-image';
import { Download, X, Share2 } from 'lucide-react';
import Image from 'next/image';

interface ShareSessionImageProps {
  session: SessionWithDetails;
  isOpen: boolean;
  onClose: () => void;
  isPage?: boolean;
}

export const ShareSessionImage: React.FC<ShareSessionImageProps> = ({
  session,
  isOpen,
  onClose,
  isPage = false
}) => {
  const imageRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getUserInitials = (user: User): string => {
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleExport = async () => {
    if (!imageRef.current) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const dataUrl = await toPng(imageRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `ambira-session-${session.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
      setExportError('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!imageRef.current) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const dataUrl = await toPng(imageRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `ambira-session-${session.id}.png`, { type: 'image/png' });

      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: session.title || 'My Ambira Session',
          text: `Check out my session on Ambira: ${session.title}`
        });
      } else {
        // Fallback to download
        await handleExport();
      }
    } catch (error) {
      console.error('Failed to share image:', error);
      setExportError('Failed to share image. Downloading instead...');
      await handleExport();
    } finally {
      setIsExporting(false);
    }
  };

  const content = (
    <>
      {/* Header - Only show for modal */}
      {!isPage && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Share Session</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {isPage && (
        <div className="px-4 md:px-0 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Share Session</h2>
        </div>
      )}

        {/* Preview */}
        <div className={`${isPage ? 'px-4 md:px-0 py-4' : 'p-6 bg-gray-50'}`}>
          {!isPage && (
            <div className="mb-4 text-sm text-gray-600 text-center">
              Preview of your session share image
            </div>
          )}

          {/* Image to Export */}
          <div
            ref={imageRef}
            className="bg-white rounded-lg shadow-lg overflow-hidden mx-auto"
            style={{ maxWidth: '600px' }}
          >
            {/* Ambira Header with Brand Color */}
            <div className="bg-gradient-to-r from-[#007AFF] to-[#00C6FF] px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Logo/Icon */}
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2">
                    <Image
                      src="/logo.svg"
                      alt="Ambira"
                      width={48}
                      height={48}
                      className="w-full h-full"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Ambira</h1>
                    <p className="text-sm text-white/90">Track your productivity</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/90 text-sm">{formatDate(session.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                {session.user.profilePicture ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-[#007AFF]/20">
                    <Image
                      src={session.user.profilePicture}
                      alt={session.user.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FC4C02] to-[#FC4C02]/80 rounded-full flex items-center justify-center ring-4 ring-[#007AFF]/20">
                    <span className="text-white font-bold text-2xl">
                      {getUserInitials(session.user)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{session.user.name}</h2>
                  <p className="text-gray-600">@{session.user.username}</p>
                </div>
              </div>
            </div>

            {/* Session Content */}
            <div className="px-8 py-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                {session.title || 'Focus Session'}
              </h3>
              {session.description && (
                <p className="text-gray-600 text-base mb-4 line-clamp-3">
                  {session.description}
                </p>
              )}

              {/* Images - Show if session has images */}
              {session.images && session.images.length > 0 && (
                <div className={`mb-4 ${session.images.length === 1 ? '' : session.images.length === 2 ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-2'}`}>
                  {session.images.slice(0, 3).map((imageUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt={`Session image ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Stats Grid - Strava Style */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Duration</div>
                  <div className="text-2xl font-bold text-[#007AFF]">
                    {formatTime(session.duration)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Activity</div>
                  <div className="text-lg font-bold text-gray-900 truncate">
                    {session.project?.name || session.activity?.name || 'Work'}
                  </div>
                </div>
              </div>

              {/* Tasks Completed (if any) */}
              {false && (
                <div className="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-800 font-semibold">
                      0 task(s) completed
                    </span>
                  </div>
                </div>
              )}

              {/* Social Proof */}
              {session.supportCount > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="font-semibold">{session.supportCount}</span>
                  <span>support{session.supportCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Join me on Ambira
                </div>
                <div className="text-sm font-semibold text-[#007AFF]">
                  ambira.app
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {exportError && (
          <div className={`${isPage ? 'px-4 md:px-0' : 'mx-6'} mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm`}>
            {exportError}
          </div>
        )}

        {/* Actions */}
        <div className={`flex items-center justify-end gap-3 ${isPage ? 'px-4 md:px-0 py-6' : 'p-4 border-t border-gray-200'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExporting}
          >
            <Share2 className="w-4 h-4" />
            {isExporting ? 'Processing...' : 'Share'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExporting}
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Processing...' : 'Download'}
          </button>
        </div>
      </>
  );

  if (isPage) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};

export default ShareSessionImage;
