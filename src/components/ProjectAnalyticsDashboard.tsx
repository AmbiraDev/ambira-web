'use client';

import React from 'react';
import { PersonalAnalyticsDashboard } from './PersonalAnalyticsDashboard';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectAnalyticsDashboardProps {
  projectId: string;
}

export const ProjectAnalyticsDashboard: React.FC<ProjectAnalyticsDashboardProps> = ({
  projectId
}) => {
  const { user } = useAuth();

  if (!user) return null;

  // Simply render PersonalAnalyticsDashboard with projectId filter
  return <PersonalAnalyticsDashboard userId={user.id} projectId={projectId} />;
};
