'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { firebaseChallengeApi } from '@/lib/api';
import {
  Challenge,
  ChallengeStats,
  ChallengeLeaderboard,
  ChallengeProgress,
} from '@/types';
import Header from '@/components/HeaderComponent';
import ChallengeDetail from '@/components/ChallengeDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboard | null>(
    null
  );
  const [userProgress, setUserProgress] = useState<ChallengeProgress | null>(
    null
  );
  const [isParticipating, setIsParticipating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (challengeId && user) {
      loadChallengeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, user]);

  const loadChallengeData = async () => {
    try {
      setIsLoading(true);

      // Load challenge details
      const challengeData =
        await firebaseChallengeApi.getChallenge(challengeId);
      setChallenge(challengeData);

      // Load challenge stats
      const statsData =
        await firebaseChallengeApi.getChallengeStats(challengeId);
      setStats(statsData);

      // Load leaderboard
      const leaderboardData =
        await firebaseChallengeApi.getChallengeLeaderboard(challengeId);
      setLeaderboard(leaderboardData);

      // Check if user is participating and load progress
      if (user) {
        const progressData =
          await firebaseChallengeApi.getChallengeProgress(challengeId);
        if (progressData) {
          setUserProgress(progressData);
          setIsParticipating(true);
        } else {
          setIsParticipating(false);
        }

        // Check if user is admin (challenge creator)
        setIsAdmin(challengeData.createdByUserId === user.id);
      }
    } catch {
      // TODO: Show error message or redirect
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      await firebaseChallengeApi.joinChallenge(challengeId);
      await loadChallengeData(); // Reload to update participation status
    } catch {
      alert('Failed to join challenge. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    const confirmed = confirm(
      'Are you sure you want to leave this challenge? Your progress will be lost.'
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await firebaseChallengeApi.leaveChallenge(challengeId);
      await loadChallengeData(); // Reload to update participation status
    } catch {
      alert('Failed to leave challenge. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit challenge modal
    alert('Edit challenge functionality will be implemented');
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete this challenge? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await firebaseChallengeApi.deleteChallenge(challengeId);
      router.push('/challenges');
    } catch {
      alert('Failed to delete challenge. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic metadata using useEffect for client component
  // MUST be called before any conditional returns
  useEffect(() => {
    if (challenge) {
      document.title = `${challenge.name} - Ambira`;

      // Update meta tags
      const description =
        challenge.description ||
        `Join the ${challenge.name} challenge and compete with others`;

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
      ogTitle.setAttribute('content', `${challenge.name} - Ambira`);

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
      ogType.setAttribute('content', 'website');

      // Twitter card tags
      let twitterCard = document.querySelector('meta[name="twitter:card"]');
      if (!twitterCard) {
        twitterCard = document.createElement('meta');
        twitterCard.setAttribute('name', 'twitter:card');
        document.head.appendChild(twitterCard);
      }
      twitterCard.setAttribute('content', 'summary');

      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', `${challenge.name} - Ambira`);

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
  }, [challenge]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!challenge || !stats || !leaderboard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Challenge Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The challenge you're looking for doesn't exist or has been
              removed.
            </p>
            <Button onClick={() => router.push('/challenges')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error loading challenge
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong while loading this challenge.
            </p>
            <Button onClick={() => router.push('/challenges')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/challenges')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Challenges
            </Button>
          </div>

          {/* Challenge Detail */}
          <ChallengeDetail
            challenge={challenge}
            stats={stats}
            leaderboard={leaderboard}
            userProgress={userProgress}
            isParticipating={isParticipating}
            isAdmin={isAdmin}
            onJoin={handleJoin}
            onLeave={handleLeave}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={actionLoading}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
