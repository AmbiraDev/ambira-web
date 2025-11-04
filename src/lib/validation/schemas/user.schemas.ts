/**
 * User and Profile validation schemas
 *
 * Validates user registration, profile updates, and privacy settings
 * with proper type safety and input sanitization.
 */

import * as v from 'valibot';
import {
  EmailSchema,
  UrlSchema,
  UsernameSchema,
  OptionalStringSchema,
  ERROR_MESSAGES,
} from '../utils/common-schemas';

/**
 * Schema for user signup
 */
export const SignupSchema = v.object({
  email: EmailSchema,
  password: v.pipe(
    v.string(ERROR_MESSAGES.required),
    v.nonEmpty(ERROR_MESSAGES.required),
    v.minLength(8, ERROR_MESSAGES.tooShort(8)),
    v.maxLength(100, ERROR_MESSAGES.tooLong(100))
  ),
  name: v.pipe(
    v.string(ERROR_MESSAGES.required),
    v.nonEmpty(ERROR_MESSAGES.required),
    v.minLength(2, ERROR_MESSAGES.tooShort(2)),
    v.maxLength(100, ERROR_MESSAGES.tooLong(100)),
    v.transform(str => str.trim())
  ),
  username: UsernameSchema,
});

/**
 * Schema for user login
 */
export const LoginSchema = v.object({
  email: EmailSchema,
  password: v.pipe(
    v.string(ERROR_MESSAGES.required),
    v.nonEmpty(ERROR_MESSAGES.required)
  ),
});

/**
 * Schema for updating user profile
 */
export const UpdateProfileSchema = v.object({
  name: v.optional(
    v.pipe(
      v.string(),
      v.nonEmpty('Name cannot be empty'),
      v.minLength(2, ERROR_MESSAGES.tooShort(2)),
      v.maxLength(100, ERROR_MESSAGES.tooLong(100)),
      v.transform(str => str.trim())
    )
  ),
  username: v.optional(UsernameSchema),
  bio: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(500, ERROR_MESSAGES.tooLong(500)),
      v.transform(str => str.trim())
    )
  ),
  tagline: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(60, 'Tagline cannot exceed 60 characters'),
      v.transform(str => str.trim())
    )
  ),
  pronouns: v.optional(
    v.pipe(
      v.string(),
      v.maxLength(20, 'Pronouns cannot exceed 20 characters'),
      v.transform(str => str.trim())
    )
  ),
  location: OptionalStringSchema,
  website: v.optional(UrlSchema),
  socialLinks: v.optional(
    v.object({
      twitter: v.optional(
        v.pipe(
          v.string(),
          v.transform(str => str.trim())
        )
      ),
      github: v.optional(
        v.pipe(
          v.string(),
          v.transform(str => str.trim())
        )
      ),
      linkedin: v.optional(
        v.pipe(
          v.string(),
          v.transform(str => str.trim())
        )
      ),
    })
  ),
  profilePicture: v.optional(UrlSchema),
});

/**
 * Schema for privacy settings
 */
export const PrivacySettingsSchema = v.object({
  profileVisibility: v.picklist(
    ['everyone', 'followers', 'private'],
    'Invalid profile visibility'
  ),
  activityVisibility: v.picklist(
    ['everyone', 'followers', 'private'],
    'Invalid activity visibility'
  ),
  projectVisibility: v.picklist(
    ['everyone', 'followers', 'private'],
    'Invalid project visibility'
  ),
  showEmail: v.optional(v.boolean()),
  showLocation: v.optional(v.boolean()),
  allowFollowRequests: v.optional(v.boolean()),
  showOnLeaderboards: v.optional(v.boolean()),
});

/**
 * Schema for updating privacy settings (all fields optional)
 */
export const UpdatePrivacySettingsSchema = v.object({
  profileVisibility: v.optional(
    v.picklist(['everyone', 'followers', 'private'])
  ),
  activityVisibility: v.optional(
    v.picklist(['everyone', 'followers', 'private'])
  ),
  projectVisibility: v.optional(
    v.picklist(['everyone', 'followers', 'private'])
  ),
  showEmail: v.optional(v.boolean()),
  showLocation: v.optional(v.boolean()),
  allowFollowRequests: v.optional(v.boolean()),
  showOnLeaderboards: v.optional(v.boolean()),
});

/**
 * Schema for password reset request
 */
export const PasswordResetRequestSchema = v.object({
  email: EmailSchema,
});

/**
 * Schema for password reset
 */
export const PasswordResetSchema = v.object({
  token: v.pipe(
    v.string(ERROR_MESSAGES.required),
    v.nonEmpty(ERROR_MESSAGES.required)
  ),
  password: v.pipe(
    v.string(ERROR_MESSAGES.required),
    v.minLength(8, ERROR_MESSAGES.tooShort(8)),
    v.maxLength(100, ERROR_MESSAGES.tooLong(100))
  ),
  confirmPassword: v.pipe(
    v.string(ERROR_MESSAGES.required),
    v.nonEmpty(ERROR_MESSAGES.required)
  ),
});

/**
 * Schema for password change
 */
export const PasswordChangeSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(
      v.string(ERROR_MESSAGES.required),
      v.nonEmpty(ERROR_MESSAGES.required)
    ),
    newPassword: v.pipe(
      v.string(ERROR_MESSAGES.required),
      v.minLength(8, ERROR_MESSAGES.tooShort(8)),
      v.maxLength(100, ERROR_MESSAGES.tooLong(100))
    ),
    confirmPassword: v.pipe(
      v.string(ERROR_MESSAGES.required),
      v.nonEmpty(ERROR_MESSAGES.required)
    ),
  }),
  v.forward(
    v.partialCheck(
      [['newPassword'], ['confirmPassword']],
      input => input.newPassword === input.confirmPassword,
      'Passwords do not match'
    ),
    ['confirmPassword']
  )
);

/**
 * Schema for email verification
 */
export const EmailVerificationSchema = v.object({
  code: v.pipe(
    v.string(ERROR_MESSAGES.required),
    v.nonEmpty(ERROR_MESSAGES.required),
    v.regex(/^\d{6}$/, 'Verification code must be 6 digits')
  ),
});

/**
 * Schema for username availability check
 */
export const UsernameCheckSchema = v.object({
  username: UsernameSchema,
});

// Type exports
export type SignupInput = v.InferInput<typeof SignupSchema>;
export type SignupData = v.InferOutput<typeof SignupSchema>;

export type LoginInput = v.InferInput<typeof LoginSchema>;
export type LoginData = v.InferOutput<typeof LoginSchema>;

export type UpdateProfileInput = v.InferInput<typeof UpdateProfileSchema>;
export type UpdateProfileData = v.InferOutput<typeof UpdateProfileSchema>;

export type PrivacySettingsInput = v.InferInput<typeof PrivacySettingsSchema>;
export type PrivacySettings = v.InferOutput<typeof PrivacySettingsSchema>;

export type UpdatePrivacySettingsInput = v.InferInput<
  typeof UpdatePrivacySettingsSchema
>;
export type UpdatePrivacySettingsData = v.InferOutput<
  typeof UpdatePrivacySettingsSchema
>;

export type PasswordResetRequestInput = v.InferInput<
  typeof PasswordResetRequestSchema
>;
export type PasswordResetRequestData = v.InferOutput<
  typeof PasswordResetRequestSchema
>;

export type PasswordResetInput = v.InferInput<typeof PasswordResetSchema>;
export type PasswordResetData = v.InferOutput<typeof PasswordResetSchema>;

export type PasswordChangeInput = v.InferInput<typeof PasswordChangeSchema>;
export type PasswordChangeData = v.InferOutput<typeof PasswordChangeSchema>;

export type EmailVerificationInput = v.InferInput<
  typeof EmailVerificationSchema
>;
export type EmailVerificationData = v.InferOutput<
  typeof EmailVerificationSchema
>;
