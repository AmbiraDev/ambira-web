/**
 * User Mapper
 *
 * Converts between Firestore documents and User domain entities.
 */

import { DocumentSnapshot, Timestamp } from 'firebase/firestore'
import { User, ProfileVisibility } from '@/domain/entities/User'

export class UserMapper {
  /**
   * Convert Firestore document to User domain entity
   */
  toDomain(doc: DocumentSnapshot): User {
    const data = doc.data()
    if (!data) {
      throw new Error(`User document ${doc.id} does not exist`)
    }

    return new User(
      doc.id,
      data.username,
      data.name,
      data.email,
      this.timestampToDate(data.createdAt),
      data.bio,
      data.location,
      data.profilePicture,
      data.followerCount || 0,
      data.followingCount || 0,
      (data.profileVisibility as ProfileVisibility) || 'everyone',
      {
        tagline: data.tagline,
        pronouns: data.pronouns,
        website: data.website,
        socialLinks: data.socialLinks,
      }
    )
  }

  /**
   * Convert User domain entity to Firestore document data
   */
  toFirestore(user: User): Record<string, unknown> {
    const data: Record<string, unknown> = {
      username: user.username,
      name: user.name,
      email: user.email,
      createdAt: Timestamp.fromDate(user.createdAt),
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      profileVisibility: user.profileVisibility,
    }

    // Add optional fields only if defined
    if (user.bio !== undefined) {
      data.bio = user.bio
    }

    if (user.location !== undefined) {
      data.location = user.location
    }

    if (user.tagline !== undefined) {
      data.tagline = user.tagline
    }

    if (user.pronouns !== undefined) {
      data.pronouns = user.pronouns
    }

    if (user.website !== undefined) {
      data.website = user.website
    }

    if (user.socialLinks !== undefined) {
      data.socialLinks = user.socialLinks
    }

    if (user.profilePicture !== undefined) {
      data.profilePicture = user.profilePicture
    }

    return data
  }

  /**
   * Convert Firestore Timestamp to Date
   */
  private timestampToDate(timestamp: Timestamp | Date | undefined): Date {
    if (!timestamp) {
      return new Date()
    }

    if (timestamp instanceof Date) {
      return timestamp
    }

    return timestamp.toDate()
  }

  /**
   * Convert multiple Firestore documents to User entities
   */
  toDomainList(docs: DocumentSnapshot[]): User[] {
    return docs.map((doc) => this.toDomain(doc))
  }
}
