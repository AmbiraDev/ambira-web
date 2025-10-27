'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SessionWithDetails } from '@/types';
import { firebaseApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import SessionCard from '@/components/SessionCard';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SessionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch the session with details
      const sessionData =
        await firebaseApi.session.getSessionWithDetails(sessionId);
      setSession(sessionData as unknown as SessionWithDetails);
    } catch (err: unknown) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupport = async (sessionId: string) => {
    try {
      await firebaseApi.post.supportSession(sessionId);

      // Optimistic update
      setSession(prev =>
        prev
          ? {
              ...prev,
              isSupported: true,
              supportCount: prev.supportCount + 1,
              supportedBy: [...(prev.supportedBy || []), user?.id || ''].filter(
                Boolean
              ),
            }
          : null
      );
    } catch (err: unknown) {
      console.error('Failed to support session:', err);
    }
  };

  const handleRemoveSupport = async (sessionId: string) => {
    try {
      await firebaseApi.post.removeSupportFromSession(sessionId);

      // Optimistic update
      setSession(prev =>
        prev
          ? {
              ...prev,
              isSupported: false,
              supportCount: Math.max(0, prev.supportCount - 1),
              supportedBy: (prev.supportedBy || []).filter(
                id => id !== user?.id
              ),
            }
          : null
      );
    } catch (err: unknown) {
      console.error('Failed to remove support:', err);
    }
  };

  const handleShare = async (sessionId: string) => {
    try {
      const sessionUrl = `${window.location.origin}/sessions/${sessionId}`;

      if (navigator.share) {
        await navigator.share({
          title: session?.title || 'Check out this session on Ambira',
          text: session?.description || 'Look at this productive session!',
          url: sessionUrl,
        });
      } else {
        await navigator.clipboard.writeText(sessionUrl);
        alert('Link copied to clipboard!');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Failed to share session:', err);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await firebaseApi.session.deleteSession(sessionId);
      router.push('/');
    } catch (err: unknown) {
      console.error('Failed to delete session:', err);
      alert('Failed to delete session. Please try again.');
    }
  };

  // Dynamic metadata using useEffect for client component
  // MUST be called before any conditional returns
  React.useEffect(() => {
    if (session) {
      const title = session.title || 'Session';
      document.title = `${title} by ${session.user?.name || 'User'} - Ambira`;

      const description =
        session.description || `Check out this productive session on Ambira`;

      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);

      // Open Graph tags
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `${title} - Ambira`);

      let ogDescription = document.querySelector(
        'meta[property="og:description"]'
      );
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', description);

      let ogType = document.querySelector('meta[property="og:type"]');
      if (!ogType) {
        ogType = document.createElement('meta');
        ogType.setAttribute('property', 'og:type');
        document.head.appendChild(ogType);
      }
      ogType.setAttribute('content', 'article');

      // Twitter card tags
      let twitterCard = document.querySelector('meta[name="twitter:card"]');
      if (!twitterCard) {
        twitterCard = document.createElement('meta');
        twitterCard.setAttribute('name', 'twitter:card');
        document.head.appendChild(twitterCard);
      }
      twitterCard.setAttribute('content', 'summary_large_image');

      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', `${title} - Ambira`);

      let twitterDescription = document.querySelector(
        'meta[name="twitter:description"]'
      );
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', description);
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Session" />

        <div className="max-w-[600px] mx-auto px-4 py-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-48 bg-gray-300 rounded"></div>
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
        <MobileHeader title="Session" />

        <div className="max-w-[600px] mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="font-medium text-lg">Session not found</p>
              <p className="text-sm text-gray-600 mt-1">
                {error ||
                  'This session may have been deleted or you may not have permission to view it.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnSession = user && session.userId === user.id;

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="hidden md:block">
            <Header />
          </div>
          <MobileHeader title="Session" />
          <div className="max-w-[600px] mx-auto px-4 py-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error loading session
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong while loading this session.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0051D5] transition-colors"
            >
              Back to Feed
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Session" />

        <div className="max-w-[600px] mx-auto md:px-4 md:py-6">
          {/* Back button for desktop */}
          <button
            onClick={() => router.back()}
            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {/* Session Card */}
          <SessionCard
            session={session}
            onSupport={handleSupport}
            onRemoveSupport={handleRemoveSupport}
            onShare={handleShare}
            onEdit={
              isOwnSession
                ? sessionId => router.push(`/sessions/${sessionId}/edit`)
                : undefined
            }
            onDelete={isOwnSession ? handleDelete : undefined}
            showComments={true}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function SessionDetailPageWrapper({
  params,
}: SessionDetailPageProps) {
  const [sessionId, setSessionId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => setSessionId(id));
  }, [params]);

  return (
    <>
      {!sessionId ? (
        <div className="min-h-screen bg-gray-50">
          <div className="hidden md:block">
            <Header />
          </div>
          <MobileHeader title="Session" />
          <div className="max-w-[600px] mx-auto px-4 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <SessionDetailContent sessionId={sessionId} />
      )}
    </>
  );
}
