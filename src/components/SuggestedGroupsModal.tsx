'use client';

import { useState, useEffect } from 'react';
import { X, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
import { firebaseApi } from '@/lib/firebaseApi';
import { useAuth } from '@/contexts/AuthContext';
import GroupAvatar from '@/components/GroupAvatar';

interface SuggestedGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuggestedGroupsModal({ isOpen, onClose }: SuggestedGroupsModalProps) {
  const { user } = useAuth();
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user) {
      loadGroups();
    }
  }, [isOpen, user]);

  const loadGroups = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const groups = await firebaseApi.group.searchGroups({}, 50);
      setSuggestedGroups(groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      setSuggestedGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || joiningGroups.has(groupId)) return;

    setJoiningGroups(prev => new Set(prev).add(groupId));
    try {
      await firebaseApi.group.joinGroup(groupId, user.id);
      // Remove from suggestions after joining
      setSuggestedGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setJoiningGroups(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Suggested Groups</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
              <p className="text-gray-600 mt-4">Loading groups...</p>
            </div>
          ) : suggestedGroups.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups available</h3>
              <p className="text-gray-600">Check back later for groups to join</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestedGroups.map(group => {
                const isJoining = joiningGroups.has(group.id);
                return (
                  <div
                    key={group.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Group Icon */}
                      <Link href={`/groups/${group.id}`}>
                        <GroupAvatar
                          imageUrl={group.imageUrl}
                          name={group.name}
                          size="md"
                        />
                      </Link>

                      {/* Group Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/groups/${group.id}`}>
                          <h3 className="font-semibold text-base text-gray-900 truncate hover:text-[#007AFF] transition-colors">
                            {group.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{group.description}</p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                          </span>
                          {group.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {group.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Join Button */}
                      <button
                        onClick={(e) => handleJoinGroup(group.id, e)}
                        disabled={isJoining}
                        className={`text-sm font-semibold transition-colors flex-shrink-0 ${
                          isJoining
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-[#007AFF] hover:text-[#0051D5]'
                        }`}
                      >
                        {isJoining ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
