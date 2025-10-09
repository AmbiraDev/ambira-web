'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Redirect /projects/[id] to /activities/[id] for backwards compatibility
export default function ProjectDetailPageRedirect({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const [projectId, setProjectId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(({ id }) => {
      setProjectId(id);
      // Redirect to the new activities route
      router.replace(`/activities/${id}`);
    });
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
