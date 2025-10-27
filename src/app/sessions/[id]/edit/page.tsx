'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Session } from '@/types';
import { firebaseApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { EditSessionModal } from '@/components/EditSessionModal';
import Header from '@/components/HeaderComponent';
import MobileHeader from '@/components/MobileHeader';

interface SessionEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

function SessionEditContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
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

      // Fetch the session
      const sessionData = await firebaseApi.session.getSession(sessionId);

      // Check if user owns this session
      if (!user || sessionData.userId !== user.id) {
        setError('You do not have permission to edit this session');
        return;
      }

      setSession(sessionData);
    } catch (err: unknown) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (
    sessionId: string,
    data: {
      title: string;
      description?: string;
      projectId?: string;
      tags?: string[];
      visibility?: 'everyone' | 'followers' | 'private';
      images?: string[];
      startTime?: Date;
      duration?: number;
    }
  ) => {
    try {
      await firebaseApi.session.updateSession(sessionId, data);
      // Navigate back to the session detail page
      router.push(`/sessions/${sessionId}`);
    } catch (err: unknown) {
      console.error('Failed to update session:', err);
      throw err; // Let the modal handle the error
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="hidden md:block">
          <Header />
        </div>
        <MobileHeader title="Edit Session" />

        <div className="max-w-[600px] mx-auto px-4 py-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-10 bg-gray-300 rounded"></div>
              <div className="h-24 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
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
        <MobileHeader title="Edit Session" />

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
              <p className="font-medium text-lg">Cannot Edit Session</p>
              <p className="text-sm text-gray-600 mt-1">
                {error ||
                  'This session may have been deleted or you may not have permission to edit it.'}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Header />
      </div>
      <MobileHeader title="Edit Session" />

      <div className="max-w-[600px] mx-auto md:px-4 md:py-6">
        {/* Back button for desktop */}
        <button
          onClick={() => router.back()}
          className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Edit Form - Not in modal, just as page content */}
        <EditSessionModal
          session={session}
          onClose={handleClose}
          onSave={handleSave}
          isPage={true}
        />
      </div>
    </div>
  );
}

export default function SessionEditPageWrapper({
  params,
}: SessionEditPageProps) {
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
          <MobileHeader title="Edit Session" />
          <div className="max-w-[600px] mx-auto px-4 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <SessionEditContent sessionId={sessionId} />
      )}
    </>
  );
}
