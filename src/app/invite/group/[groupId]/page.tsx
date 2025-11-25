import { Metadata } from 'next'
import GroupInviteLanding from '@/features/groups/components/GroupInviteLanding'

type Props = {
  params: Promise<{ groupId: string }>
}

// Static metadata - group-specific metadata is handled client-side
export const metadata: Metadata = {
  title: 'Join Group on Ambira',
  description: 'Join Ambira to track your productivity with friends',
  openGraph: {
    title: 'Join Group on Ambira',
    description: 'Join Ambira to track your productivity with friends',
    siteName: 'Ambira',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join Group on Ambira',
    description: 'Join Ambira to track your productivity with friends',
  },
}

export default async function GroupInvitePage({ params }: Props) {
  const { groupId } = await params
  return <GroupInviteLanding groupId={groupId} />
}
