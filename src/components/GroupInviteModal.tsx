'use client';

import React, { useState, useRef } from 'react';
import { Group } from '@/types';
import { X, Copy, Check, Share2, Download, QrCode, Image as ImageIcon } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface GroupInviteModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}

type ShareTab = 'link' | 'qr' | 'image';

export default function GroupInviteModal({ group, isOpen, onClose }: GroupInviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ShareTab>('link');
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const inviteCardRef = useRef<HTMLDivElement>(null);

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
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${group.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const handleDownloadInviteCard = async () => {
    if (!inviteCardRef.current) return;

    try {
      // Use html2canvas for better rendering
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(inviteCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${group.name.replace(/\s+/g, '-').toLowerCase()}-invite.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error('Failed to download invite card:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
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

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('link')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'link'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Link
              </div>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'qr'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </div>
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'image'
                  ? 'border-[#007AFF] text-[#007AFF]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Share Image
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
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

          {/* Tab Content */}
          {activeTab === 'link' && (
            <div className="space-y-4">
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
                    className="px-4 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
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
              {typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined' && (
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
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div ref={qrCodeRef} className="p-6 bg-white border-2 border-gray-200 rounded-2xl">
                  <QRCodeCanvas
                    value={inviteLink}
                    size={256}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: '/logo.png',
                      excavate: true,
                      width: 40,
                      height: 40,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Scan this QR code with a mobile device to join <strong>{group.name}</strong>
                </p>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadQR}
                className="w-full px-4 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>

              {/* Info Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Share this QR code in presentations, posters, or print materials. Anyone can scan it to join your group.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-4">
              {/* Invite Card Preview */}
              <div className="flex flex-col items-center">
                <div
                  ref={inviteCardRef}
                  className="w-full max-w-lg bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-2xl p-8 text-white"
                >
                  {/* Logo/Branding */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">Join us on Ambira</h3>
                    <div className="h-1 w-16 bg-white/50 mx-auto rounded-full"></div>
                  </div>

                  {/* Group Info */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                      {group.imageUrl ? (
                        <img
                          src={group.imageUrl}
                          alt={group.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">💼</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{group.name}</h2>
                    {group.description && (
                      <p className="text-white/90 text-sm line-clamp-2 mb-3">{group.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-4 text-sm text-white/80">
                      <span>{group.memberCount} members</span>
                      {group.location && (
                        <>
                          <span>•</span>
                          <span>{group.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <QRCodeCanvas
                      value={inviteLink}
                      size={200}
                      level="H"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-1">Scan to join the group</p>
                    <p className="text-xs text-white/60 font-mono break-all">{inviteLink}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadInviteCard}
                  className="flex-1 px-4 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
                {typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined' && (
                  <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                )}
              </div>

              {/* Info Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Download and share this invite card on social media, messaging apps, or email to invite people to join <strong>{group.name}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
