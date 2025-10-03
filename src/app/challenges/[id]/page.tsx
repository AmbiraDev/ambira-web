'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseChallengeApi } from '@/lib/firebaseApi';
import { Challenge, ChallengeStats, ChallengeLeaderboard, ChallengeProgress } from '@/types';
import Header from '@/components/HeaderComponent';
import ChallengeDetail from '@/components/ChallengeDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboard | null>(null);
  const [userProgress, setUserProgress] = useState<ChallengeProgress | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (challengeId) {
      loadChallengeData();
    }
  }, [challengeId, user]);

  const loadChallengeData = async () => {
    try {
      setIsLoading(true);

      // Load challenge details
      const challengeData = await firebaseChallengeApi.getChallenge(challengeId);
      setChallenge(challengeData);

      // Load challenge stats
      const statsData = await firebaseChallengeApi.getChallengeStats(challengeId);
      setStats(statsData);

      // Load leaderboard
      const leaderboardData = await firebaseChallengeApi.getChallengeLeaderboard(challengeId);
      setLeaderboard(leaderboardData);

      // Check if user is participating and load progress
      if (user) {
        const progressData = await firebaseChallengeApi.getChallengeProgress(challengeId);
        if (progressData) {
          setUserProgress(progressData);
          setIsParticipating(true);
        } else {
          setIsParticipating(false);
        }

        // Check if user is admin (challenge creator)
        setIsAdmin(challengeData.createdByUserId === user.id);
      }
    } catch (error) {
      console.error('Failed to load challenge data:', error);
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
    } catch (error) {
      console.error('Failed to join challenge:', error);
      alert('Failed to join challenge. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    
    const confirmed = confirm('Are you sure you want to leave this challenge? Your progress will be lost.');
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await firebaseChallengeApi.leaveChallenge(challengeId);
      await loadChallengeData(); // Reload to update participation status
    } catch (error) {
      console.error('Failed to leave challenge:', error);
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
    const confirmed = confirm('Are you sure you want to delete this challenge? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await firebaseChallengeApi.deleteChallenge(challengeId);
      router.push('/challenges');
    } catch (error) {
      console.error('Failed to delete challenge:', error);
      alert('Failed to delete challenge. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Challenge Not Found</h2>
            <p className="text-gray-600 mb-6">The challenge you're looking for doesn't exist or has been removed.</p>
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
  );
}