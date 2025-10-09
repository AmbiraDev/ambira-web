'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Redirect /you to /analytics for backwards compatibility
export default function YouRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    // Preserve any query parameters when redirecting
    const tab = searchParams?.get('tab');
    if (tab) {
      router.replace(`/analytics?tab=${tab}`);
    } else {
      router.replace('/analytics');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
