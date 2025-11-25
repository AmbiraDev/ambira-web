import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom Activities - Ambira',
  description:
    'Create and manage custom activity types for unique projects or hobbies. Track your productivity with personalized activities.',
}

export default function ActivitiesSettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
