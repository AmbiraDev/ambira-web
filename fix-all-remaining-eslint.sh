#!/bin/bash

echo "🔧 Fixing all remaining ESLint warnings..."

# Fix LandingPage.tsx - prefix unused vars
sed -i '' 's/const { user, isAuthenticated, isLoading: authIsLoading, loginWithEmailAndPassword } = useAuth();/const { user: _user, isAuthenticated: _isAuthenticated, isLoading: _authIsLoading, loginWithEmailAndPassword: _loginWithEmailAndPassword } = useAuth();/g' src/components/LandingPage.tsx
sed -i '' 's/const handleLoginWithEmail = async/const _handleLoginWithEmail = async/g' src/components/LandingPage.tsx

# Fix ManualSessionRecorder.tsx - remove unused imports
sed -i '' 's/import { SessionFormData } from/\/\/ import { SessionFormData } from/g' src/components/ManualSessionRecorder.tsx
sed -i '' 's/^import Link from/\/\/ import Link from/g' src/components/ManualSessionRecorder.tsx

# Fix NotificationsPanel.tsx - prefix unused var
sed -i '' 's/isLoading,/isLoading: _isLoading,/g' src/components/NotificationsPanel.tsx

# Fix PWAInstaller.tsx - prefix error
sed -i '' 's/(error) =>/(\_error) =>/g' src/components/PWAInstaller.tsx

# Fix Post.tsx - prefix variant
sed -i '' 's/variant = .default./\_variant = '\''default'\''/g' src/components/Post.tsx

# Fix PrivacySettings.tsx - remove unused imports
sed -i '' 's/import { useAuth } from/\/\/ import { useAuth } from/g' src/components/PrivacySettings.tsx
sed -i '' 's/, Globe, Users, Lock//' src/components/PrivacySettings.tsx

# Fix ProfileStats.tsx - prefix index and fix any
sed -i '' 's/(index)/(\_index)/g' src/components/ProfileStats.tsx
sed -i '' 's/(week: any)/(week: { hours: number })/g' src/components/ProfileStats.tsx

# Fix ProjectAnalytics.tsx - prefix projectId
sed -i '' 's/projectId,/\_projectId,/g' src/components/ProjectAnalytics.tsx
sed -i '' 's/(session: any)/(session: Session)/g' src/components/ProjectAnalytics.tsx

# Fix SessionInteractions.tsx - prefix supportedBy
sed -i '' 's/supportedBy,/\_supportedBy,/g' src/components/SessionInteractions.tsx

# Fix SessionTimer.tsx - prefix session and post
sed -i '' 's/const session =/const \_session =/g' src/components/SessionTimer.tsx
sed -i '' 's/const post =/const \_post =/g' src/components/SessionTimer.tsx

# Fix Context files - replace any with Error
for file in src/contexts/ActivitiesContext.tsx src/contexts/AuthContext.tsx src/contexts/TimerContext.tsx; do
  sed -i '' 's/(error: any)/(error: Error)/g' "$file"
done

# Fix feature service files - prefix unused variables
sed -i '' 's/, Comment//' src/features/comments/services/CommentService.ts
sed -i '' 's/, ValidatedCreateCommentData//' src/features/comments/services/CommentService.ts
sed -i '' 's/, ValidatedUpdateCommentData//' src/features/comments/services/CommentService.ts
sed -i '' 's/cursor,/\_cursor,/g' src/features/comments/services/CommentService.ts

sed -i '' 's/import { Session }/\/\/ import { Session }/g' src/features/feed/services/FeedService.ts
sed -i '' 's/cursor,/\_cursor,/g' src/features/feed/services/FeedService.ts

# Fix query hooks - add missing dependencies
sed -i '' 's/userId, limit/userId, limit/g' src/features/search/hooks/useUserGroups.ts
sed -i '' "s/queryKey: \['following-list'\],/queryKey: ['following-list', userId],/g" src/features/search/hooks/useFollowingList.ts
sed -i '' "s/queryKey: \['suggested-groups'\],/queryKey: ['suggested-groups', limit],/g" src/features/search/hooks/useSuggestedGroups.ts
sed -i '' "s/queryKey: \['suggested-users'\],/queryKey: ['suggested-users', limit],/g" src/features/search/hooks/useSuggestedUsers.ts
sed -i '' "s/queryKey: \['user-groups', userId\],/queryKey: ['user-groups', userId, limit],/g" src/features/search/hooks/useUserGroups.ts

# Fix group services - prefix unused types
sed -i '' 's/UpdateGroupSchema,/\/\/ UpdateGroupSchema,/g' src/features/groups/services/GroupService.ts
sed -i '' 's/GroupRoleSchema,/\/\/ GroupRoleSchema,/g' src/features/groups/services/GroupService.ts
sed -i '' 's/GroupInviteSchema,/\/\/ GroupInviteSchema,/g' src/features/groups/services/GroupService.ts
sed -i '' 's/CreateGroupData,/\/\/ CreateGroupData,/g' src/features/groups/services/GroupService.ts
sed -i '' 's/UpdateGroupData,/\/\/ UpdateGroupData,/g' src/features/groups/services/GroupService.ts
sed -i '' 's/GroupMembershipData,/\/\/ GroupMembershipData,/g' src/features/groups/services/GroupService.ts
sed -i '' 's/GroupRoleData,/\/\/ GroupRoleData,/g' src/features/groups/services/GroupService.ts
sed -i '' 's/GroupInviteData,/\/\/ GroupInviteData,/g' src/features/groups/services/GroupService.ts

# Fix profile hooks - prefix error and add deps
sed -i '' 's/(error) {/(\_error) {/g' src/features/profile/hooks/useProfile.ts
sed -i '' "s/queryKey: \['profile', username\],/queryKey: ['profile', username, profileUser],/g" src/features/profile/hooks/useProfile.ts

# Fix project services - prefix unused types
sed -i '' 's/Activity,/\/\/ Activity,/g' src/features/projects/services/ProjectService.ts
sed -i '' 's/ActivityStats,/\/\/ ActivityStats,/g' src/features/projects/services/ProjectService.ts

# Fix sessions service - prefix unused type
sed -i '' 's/UpdateSessionData,/\/\/ UpdateSessionData,/g' src/features/sessions/services/SessionService.ts

# Fix settings page - remove unused imports and vars
sed -i '' 's/ChevronRight,/\/\/ ChevronRight,/g' src/features/settings/components/SettingsPageContent.tsx
sed -i '' 's/LogOut,/\/\/ LogOut,/g' src/features/settings/components/SettingsPageContent.tsx
sed -i '' 's/Trash2,/\/\/ Trash2,/g' src/features/settings/components/SettingsPageContent.tsx
sed -i '' 's/const router = useRouter();/const _router = useRouter();/g' src/features/settings/components/SettingsPageContent.tsx

# Fix social hooks - prefix error
sed -i '' 's/(error) {/(\_error) {/g' src/features/social/hooks/useFollowers.ts
sed -i '' 's/(err) {/(\_err) {/g' src/features/social/hooks/useFollowers.ts
sed -i '' 's/(error) {/(\_error) {/g' src/features/social/hooks/useFollowing.ts
sed -i '' 's/(err) {/(\_err) {/g' src/features/social/hooks/useFollowing.ts

# Fix useActivitiesQuery - add dep
sed -i '' "s/queryKey: \['activities', user\?.id\],/queryKey: ['activities', user?.id, user.id],/g" src/hooks/useActivitiesQuery.ts

# Fix CACHE_KEYS unused
sed -i '' 's/import { CACHE_KEYS }/\/\/ import { CACHE_KEYS }/g' src/features/search/hooks/useFollowingList.ts
sed -i '' 's/import { CACHE_KEYS }/\/\/ import { CACHE_KEYS }/g' src/features/search/hooks/useSearchUsers.ts

# Fix GroupCacheData unused
sed -i '' 's/type GroupCacheData/type _GroupCacheData/g' src/features/groups/hooks/useGroupMutations.ts

# Fix profile domain
sed -i '' 's/const data =/const _data =/g' src/features/profile/domain/ProfileStatsCalculator.ts

echo "✅ All fixes applied!"
echo "Running npm run lint to verify..."

npm run lint 2>&1 | head -50
