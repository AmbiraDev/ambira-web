'use client';

import React, { useState } from 'react';
import { Group } from '@/types';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface GroupInviteModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupInviteModal({ group, isOpen, onClose }: GroupInviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || 'https://ambira.com';

  const inviteLink = `${baseUrl}/invite/group/${group.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on Ambira`,
          text: `I'd like to invite you to join ${group.name} on Ambira!`,
          url: inviteLink,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Invite People</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Group Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-full flex items-center justify-center flex-shrink-0">
              {group.imageUrl ? (
                <img
                  src={group.imageUrl}
                  alt={group.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xl">💼</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
              <p className="text-sm text-gray-600 truncate">
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>

          {/* Invite Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share this invite link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors flex items-center gap-2 font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Button (shows on mobile with Web Share API support) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleShare}
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share Link
            </button>
          )}

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Anyone with this link can join <strong>{group.name}</strong>. They'll need to sign up or log in to Ambira first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
