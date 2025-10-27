'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { SessionCard } from '@/components/SessionCard';
import { SessionWithDetails } from '@/types';

interface ActivitySessionsListProps {
  sessions: SessionWithDetails[];
  isLoading: boolean;
  onSupport: (sessionId: string) => Promise<void>;
  onRemoveSupport: (sessionId: string) => Promise<void>;
  onShare: (sessionId: string) => Promise<void>;
}

export function ActivitySessionsList({
  sessions,
  isLoading,
  onSupport,
  onRemoveSupport,
  onShare,
}: ActivitySessionsListProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-2">
            <Clock className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No sessions yet
          </h3>
          <p className="text-gray-600">
            Start tracking time on this activity to see sessions here.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onSupport={onSupport}
              onRemoveSupport={onRemoveSupport}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}
