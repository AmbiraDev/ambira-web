import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Timer - Focumo',
  description:
    'Track your work sessions with the activity timer. Select an activity, start the timer, and log your productivity.',
}

export default function TimerLayout({ children }: { children: React.ReactNode }) {
  return children
}
