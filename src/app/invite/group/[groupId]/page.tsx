import { Metadata } from 'next';
import { firebaseApi } from '@/lib/firebaseApi';
import GroupInviteLanding from '@/components/GroupInviteLanding';

type Props = {
  params: { groupId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Fetch group data for metadata
    const group = await firebaseApi.group.getGroup(params.groupId);

    if (!group) {
      return {
        title: 'Group Not Found - Ambira',
        description: 'Join Ambira to track your productivity with friends',
      };
    }

    const groupIcon = group.imageUrl || '💼';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ambira.com';

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

export default function GroupInvitePage({ params }: Props) {
  return <GroupInviteLanding groupId={params.groupId} />;
}
