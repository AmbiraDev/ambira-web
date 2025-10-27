import { Metadata } from 'next';
import { firebaseApi } from '@/lib/api';
import GroupInviteLanding from '@/components/GroupInviteLanding';

type Props = {
  params: Promise<{ groupId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { groupId } = await params;
    // Fetch group data for metadata
    const group = await firebaseApi.group.getGroup(groupId);

    if (!group) {
      return {
        title: 'Group Not Found - Ambira',
        description: 'Join Ambira to track your productivity with friends',
      };
    }

    const _groupIcon = group.imageUrl || '💼';
    const _baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ambira.com';

    return {
      title: `Join ${group.name} on Ambira`,
      description: `${group.description.slice(0, 160)}`,
      openGraph: {
        title: `Join ${group.name} on Ambira`,
        description: group.description,
        images: group.imageUrl ? [group.imageUrl] : [],
        siteName: 'Ambira',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Join ${group.name} on Ambira`,
        description: group.description,
        images: group.imageUrl ? [group.imageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Join Group on Ambira',
      description: 'Join Ambira to track your productivity with friends',
    };
  }
}

export default async function GroupInvitePage({ params }: Props) {
  const { groupId } = await params;
  return <GroupInviteLanding groupId={groupId} />;
}
