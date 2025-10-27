'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Group } from '@/types';
import { firebaseApi } from '@/lib/api';
import { Users, MapPin, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface GroupInviteLandingProps {
  groupId: string;
}

export default function GroupInviteLanding({
  groupId,
}: GroupInviteLandingProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    try {
      setIsLoading(true);
      const groupData = await firebaseApi.group.getGroup(groupId);
      if (!groupData) {
        setError('Group not found');
        return;
      }
      setGroup(groupData);
    } catch (_error) {
      console.error('Error loading group:', _error);
      setError('Failed to load group information');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const handleJoinGroup = useCallback(async () => {
    if (!user || !group) return;

    try {
      setIsJoining(true);
      await firebaseApi.group.joinGroup(group.id, user.id);
      // Redirect to group page
      router.push(`/groups/${groupId}`);
    } catch (err: unknown) {
      console.error('Error joining group:', err);
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Failed to join group';
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  }, [user, group, router, groupId]);

  const checkMembershipAndRedirect = useCallback(async () => {
    if (!user || !group) return;

    // Check if user is already a member
    if (group.memberIds.includes(user.id)) {
      // Already a member, redirect to group
      router.push(`/groups/${groupId}`);
      return;
    }

    // Not a member, auto-join them
    await handleJoinGroup();
  }, [user, group, router, groupId, handleJoinGroup]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // If user is already logged in, check membership and redirect
  useEffect(() => {
    if (!authLoading && user && group) {
      checkMembershipAndRedirect();
    }
  }, [user, authLoading, group, checkMembershipAndRedirect]);

  const handleSignUp = () => {
    // Store invite context in sessionStorage for post-signup redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'inviteContext',
        JSON.stringify({
          type: 'group',
          groupId: groupId,
        })
      );
    }
    router.push('/signup');
  };

  const handleLogin = () => {
    // Store invite context in sessionStorage for post-login redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'inviteContext',
        JSON.stringify({
          type: 'group',
          groupId: groupId,
        })
      );
    }
    router.push('/login');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work':
        return '💼';
      case 'study':
        return '📚';
      case 'side-project':
        return '💻';
      case 'learning':
        return '🎓';
      default:
        return '📌';
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#0066CC] mx-auto mb-4" />
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Group Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The group you're looking for doesn't exist or has been deleted."}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#0066CC] text-white px-6 py-3 rounded-lg hover:bg-[#0051D5] transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // If user is logged in and joining, show loading state
  if (user && isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#0066CC] mx-auto mb-4" />
          <p className="text-gray-600">Joining {group.name}...</p>
        </div>
      </div>
    );
  }

  // Show invite landing page for non-logged-in users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image
              src="/logo.svg"
              alt="Ambira"
              width={64}
              height={64}
              className="w-16 h-16"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Ambira</h1>
        </div>

        {/* Group Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Group Header */}
          <div className="bg-gradient-to-r from-[#0066CC] to-[#0051D5] px-8 py-12 text-center">
            {/* Group Avatar */}
            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center overflow-hidden">
              {group.imageUrl ? (
                <Image
                  src={group.imageUrl}
                  alt={group.name}
                  width={96}
                  height={96}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Users className="w-12 h-12 text-[#0066CC]" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Join {group.name}
            </h2>
            <p className="text-blue-100 text-lg">on Ambira</p>
          </div>

          {/* Group Details */}
          <div className="px-8 py-6">
            {/* Description */}
            {group.description && (
              <div className="mb-6">
                <p className="text-gray-700 text-center leading-relaxed">
                  {group.description}
                </p>
              </div>
            )}

            {/* Meta Information */}
            <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-600">
              {/* Category */}
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {getCategoryIcon(group.category)}
                </span>
                <span className="capitalize">
                  {group.category.replace('-', ' ')}
                </span>
              </div>

              {/* Member Count */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {group.memberCount}{' '}
                  {group.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>

              {/* Location */}
              {group.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{group.location}</span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="w-full bg-[#0066CC] text-white px-6 py-4 rounded-lg hover:bg-[#0051D5] transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
              >
                Sign Up to Join {group.name}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={handleLogin}
                    className="text-[#0066CC] hover:underline font-medium"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What is Ambira section */}
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">What is Ambira?</h3>
          <p className="text-gray-600 text-sm">
            Ambira is a social productivity tracking app that helps you track
            work sessions, build streaks, and compete with friends. Think
            Strava, but for productivity.
          </p>
        </div>
      </div>
    </div>
  );
}
