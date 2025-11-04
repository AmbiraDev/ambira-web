/**
 * Group Mapper
 *
 * Converts between Firestore documents and Group domain entities.
 * Handles all data transformation and ensures undefined values are stripped.
 */

import { DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { Group, GroupCategory, GroupPrivacy } from '@/domain/entities/Group';

export class GroupMapper {
  /**
   * Convert Firestore document to Group domain entity
   */
  toDomain(doc: DocumentSnapshot): Group {
    const data = doc.data();
    if (!data) {
      throw new Error(`Group document ${doc.id} does not exist`);
    }

    return new Group(
      doc.id,
      data.name,
      data.description || '',
      data.category as GroupCategory,
      (data.privacy as GroupPrivacy) || 'public',
      data.memberIds || [],
      data.adminUserIds || [],
      data.createdByUserId,
      this.timestampToDate(data.createdAt),
      data.location,
      data.imageUrl,
      data.memberCount
    );
  }

  /**
   * Convert Group domain entity to Firestore document data
   * Strips undefined values to prevent Firestore errors
   */
  toFirestore(group: Group): Record<string, unknown> {
    const data: Record<string, unknown> = {
      name: group.name,
      description: group.description,
      category: group.category,
      privacy: group.privacy,
      memberIds: Array.from(group.memberIds),
      adminUserIds: Array.from(group.adminUserIds),
      createdByUserId: group.createdByUserId,
      createdAt: Timestamp.fromDate(group.createdAt),
      memberCount: group.getMemberCount(),
    };

    // Add optional fields only if defined
    if (group.location !== undefined) {
      data.location = group.location;
    }

    if (group.imageUrl !== undefined) {
      data.imageUrl = group.imageUrl;
    }

    return data;
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private timestampToDate(timestamp: Timestamp | Date | undefined): Date {
    if (!timestamp) {
      return new Date();
    }

    if (timestamp instanceof Date) {
      return timestamp;
    }

    return timestamp.toDate();
  }

  /**
   * Convert multiple Firestore documents to Group entities
   */
  toDomainList(docs: DocumentSnapshot[]): Group[] {
    return docs.map(doc => this.toDomain(doc));
  }
}
