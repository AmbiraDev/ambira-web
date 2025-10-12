'use client';

import React from 'react';
import { ProjectDetailPage } from '@/components/ProjectDetailPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Header from '@/components/HeaderComponent';

interface ActivityDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function ActivityDetailContent({ activityId }: { activityId: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <ProjectDetailPage projectId={activityId} />
      </div>
    </div>
  );
}

export default function ActivityDetailPageWrapper({ params }: ActivityDetailPageProps) {
  const [activityId, setActivityId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => setActivityId(id));
  }, [params]);

  return (
    <ProtectedRoute>
      {!activityId ? (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-[1400px] mx-auto px-4 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <ActivityDetailContent activityId={activityId} />
      )}
    </ProtectedRoute>
  );
}
