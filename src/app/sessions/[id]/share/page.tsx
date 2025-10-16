'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { SessionWithDetails, User } from '@/types';
import { firebaseApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import Image from 'next/image';
import { toPng } from 'html-to-image';

interface SessionSharePageProps {
  params: Promise<{
    id: string;
  }>;
}

type LayoutType = 'minimal';

function SessionShareContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('minimal');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const minimalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionData = await firebaseApi.session.getSessionWithDetails(sessionId);
      setSession(sessionData as unknown as SessionWithDetails);
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

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
    const dateStr = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);

    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);

    return `${dateStr} at ${timeStr}`;
  };

  const getCurrentRef = () => {
    return minimalRef;
  };

  const handleExport = async () => {
    const imageRef = getCurrentRef();
    if (!imageRef.current) return;

    setIsExporting(true);
    setExportError(null);

    try {
      // Create a temporary container off-screen with the full-size layout
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      document.body.appendChild(tempContainer);

      // Clone the layout content
      const clonedLayout = imageRef.current.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clonedLayout);

      // Generate the image from the full-size layout
      const dataUrl = await toPng(clonedLayout, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: 1080,
        height: 1080
      });

      // Clean up
      document.body.removeChild(tempContainer);

      const link = document.createElement('a');
      link.download = `ambira-${session?.title?.toLowerCase().replace(/\s+/g, '-') || 'session'}-${selectedLayout}.png`;
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
    const imageRef = getCurrentRef();
    if (!imageRef.current) return;

    setIsExporting(true);
    setExportError(null);

    try {
      // Create a temporary container off-screen with the full-size layout
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      document.body.appendChild(tempContainer);

      // Clone the layout content
      const clonedLayout = imageRef.current.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clonedLayout);

      // Generate the image from the full-size layout
      const dataUrl = await toPng(clonedLayout, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: 1080,
        height: 1080
      });

      // Clean up
      document.body.removeChild(tempContainer);

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `ambira-session.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: session?.title || 'My Ambira Session',
          text: `Check out my productivity session on Ambira!`
        });
      } else {
        await handleExport();
      }
    } catch (error) {
      console.error('Failed to share image:', error);
      if ((error as Error).name !== 'AbortError') {
        setExportError('Failed to share. Downloading instead...');
        await handleExport();
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Share Session" />

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-300 rounded w-32"></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-gray-300 rounded"></div>
              <div className="aspect-square bg-gray-300 rounded"></div>
              <div className="aspect-square bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Share Session" />

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="font-medium text-lg">Cannot Share Session</p>
              <p className="text-sm text-gray-600 mt-1">
                {error || 'This session may have been deleted or you may not have permission to view it.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if the current user owns this session
  if (session.userId !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Share Session" />

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="font-medium text-lg">Cannot Share This Session</p>
              <p className="text-sm text-gray-600 mt-1">
                You can only create share images for your own sessions.
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0051D5] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Minimal Clean Layout (no images)
  const MinimalLayout = () => (
    <div
      ref={minimalRef}
      style={{
        width: '1080px',
        height: '1080px',
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}
    >
      <div style={{
        height: '100%',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #111827',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg width="70" height="70" viewBox="0 0 375 375" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 56.387 320.265 L 105.145 307.202 L 134.619 191.47 L 222.369 275.789 L 300.91 254.743 C 300.91 254.743 327.644 243.277 327.701 205.067 C 327.765 162.452 292.22 150.864 292.22 150.864 C 292.22 150.864 311.586 129.825 286.573 94.501 C 265.409 64.612 226.767 75.885 226.767 75.885 L 131.479 100.996 L 163.14 132.378 L 240.652 113.004 C 240.652 113.004 253.429 109.011 259.254 125.122 C 264.463 139.529 249.128 146.798 249.139 146.809 C 249.186 146.856 192.6 161.379 192.553 161.379 C 192.506 161.379 224.354 193.363 224.406 193.466 C 224.435 193.523 259.751 183.839 259.751 183.839 C 259.751 183.839 281.184 181.354 285.882 196.467 C 292.14 216.599 271.779 222.147 271.79 222.147 C 271.837 222.147 239.215 231.316 239.215 231.316 C 239.215 231.316 113.277 106.094 113.228 106.045 C 113.179 105.996 56.211 321.004 56.387 320.265 Z" fill="#007AFF" transform="matrix(0.96592605, 0.25881901, -0.25881901, 0.96592605, 57.2958925, -43.02296686)"/>
            </svg>
          </div>
          <div style={{ color: '#4b5563', fontSize: '22px' }}>{formatDate(session.createdAt)}</div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '32px',
          paddingTop: '32px',
          paddingBottom: '32px'
        }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{
              fontSize: '68px',
              fontWeight: 'bold',
              color: '#111827',
              lineHeight: '1.2',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              {session.title || 'Focus Session'}
            </h1>
            {session.description && (
              <p style={{
                color: '#4b5563',
                fontSize: '28px',
                lineHeight: '1.5',
                maxWidth: '880px',
                margin: '0 auto',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {session.description}
              </p>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '48px',
            paddingTop: '28px',
            paddingBottom: '28px'
          }}>
            <div style={{ textAlign: 'center', minWidth: '380px' }}>
              <div style={{ color: '#6b7280', fontSize: '19px', marginBottom: '10px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Duration</div>
              <div style={{ color: '#111827', fontSize: '58px', fontWeight: 'bold', whiteSpace: 'nowrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{formatTime(session.duration)}</div>
            </div>
            <div style={{ width: '1px', height: '90px', backgroundColor: '#d1d5db' }}></div>
            <div style={{ textAlign: 'center', minWidth: '480px' }}>
              <div style={{ color: '#6b7280', fontSize: '19px', marginBottom: '10px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Activity</div>
              <div style={{ color: '#111827', fontSize: '46px', fontWeight: 'bold', wordBreak: 'break-word', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{session.activity?.name || 'Work'}</div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '3px solid #111827',
          paddingTop: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {session.user.profilePicture ? (
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden' }}>
                <img src={session.user.profilePicture} alt={session.user.name} width="60" height="60" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#111827',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{getUserInitials(session.user)}</span>
              </div>
            )}
            <div>
              <div style={{ color: '#111827', fontSize: '34px', fontWeight: 'bold', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{session.user.name}</div>
              <div style={{ color: '#4b5563', fontSize: '22px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>@{session.user.username}</div>
            </div>
          </div>
          <div style={{ color: '#111827', fontSize: '46px', fontWeight: 'bold', fontFamily: 'system-ui, -apple-system, sans-serif' }}>ambira.app</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="Share Session" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Share Your Session</h1>
          <p className="text-gray-600 text-lg">Download or share your session card</p>
        </div>

        {/* Error Message */}
        {exportError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {exportError}
          </div>
        )}

        {/* Preview */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative rounded-2xl overflow-hidden ring-2 ring-gray-200 shadow-xl" style={{ width: '420px', height: '420px' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="transform scale-[0.389] origin-center">
                <MinimalLayout />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056b3] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl active:scale-95"
            disabled={isExporting}
          >
            <Share2 className="w-4 h-4" />
            {isExporting ? 'Processing...' : 'Share'}
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl active:scale-95"
            disabled={isExporting}
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Processing...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SessionSharePageWrapper({ params }: SessionSharePageProps) {
  const [sessionId, setSessionId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => setSessionId(id));
  }, [params]);

  return (
    <>
      {!sessionId ? (
        <div className="min-h-screen bg-white">
          <div className="hidden md:block">
            <Header />
          </div>
          <MobileHeader title="Share Session" />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <SessionShareContent sessionId={sessionId} />
      )}
    </>
  );
}
