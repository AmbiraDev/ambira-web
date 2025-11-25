'use client'

import React from 'react'
import { PersonalAnalyticsDashboard } from '@/components/PersonalAnalyticsDashboard'
import { useAuth } from '@/hooks/useAuth'

interface ProjectAnalyticsDashboardProps {
  projectId: string
}

export const ProjectAnalyticsDashboard: React.FC<ProjectAnalyticsDashboardProps> = ({
  projectId,
}) => {
  const { user } = useAuth()

  if (!user) return null

  // Simply render PersonalAnalyticsDashboard with projectId filter
  return <PersonalAnalyticsDashboard userId={user.id} projectId={projectId} />
}
