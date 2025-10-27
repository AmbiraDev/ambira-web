#!/bin/bash

# Fix unused variables by prefixing with underscore

# src/components/LandingPage.tsx
perl -i -pe 's/const \{ user, isAuthenticated, authLoading: authIsLoading \}/const { user: _user, isAuthenticated: _isAuthenticated, authLoading: authIsLoading }/' src/components/LandingPage.tsx
perl -i -pe 's/const handleLoginWithEmail/const _handleLoginWithEmail/' src/components/LandingPage.tsx

# src/components/ManualSessionRecorder.tsx
perl -i -pe 's/import \{[^}]*SessionFormData[^}]*\} from/import {/' src/components/ManualSessionRecorder.tsx | perl -i -pe 's/, ,/,/g; s/\{ ,/{ /g; s/, \}/}/g'

# src/components/NotificationsPanel.tsx
perl -i -pe 's/notifications, isLoading \}/notifications, isLoading: _isLoading }/' src/components/NotificationsPanel.tsx

# src/components/PersonalAnalyticsDashboard.tsx
perl -i -pe 's/import \{[^}]*StreakDisplay[^}]*\} from/import {/' src/components/PersonalAnalyticsDashboard.tsx

# src/components/Post.tsx
perl -i -pe 's/variant\b/_variant/g if /^  \w+:/' src/components/Post.tsx

# src/components/PrivacySettings.tsx
perl -i -pe 's/^import \{([^}]*)(Globe|Users|Lock)([^}]*)\} from/import {$1$3} from/; s/, ,/,/g; s/\{ ,/{ /g; s/, \}/}/g' src/components/PrivacySettings.tsx

# src/components/ProfileStats.tsx
perl -i -pe 's/\(day, index\)/(day, _index)/' src/components/ProfileStats.tsx

# src/components/RightSidebar.tsx
perl -i -pe 's/\(user, index\)/(user, _index)/' src/components/RightSidebar.tsx

# src/components/SessionInteractions.tsx
perl -i -pe 's/supportedBy\b/_supportedBy/g if /^  \w+:/' src/components/SessionInteractions.tsx

# src/components/SessionTimer.tsx
perl -i -pe 's/const \{ session, post \}/const { session: _session, post: _post }/' src/components/SessionTimer.tsx

# src/components/timer/FinishSessionModal.tsx
perl -i -pe 's/onCancel\b/_onCancel/g if /^  \w+:/' src/components/timer/FinishSessionModal.tsx

# src/features files
perl -i -pe 's/cursor\b/_cursor/g if /^\s{2,4}\w+:/' src/features/comments/services/CommentService.ts
perl -i -pe 's/cursor\b/_cursor/g if /^\s{2,4}\w+:/' src/features/feed/hooks/useFeed.ts
perl -i -pe 's/cursor\b/_cursor/g if /^\s{2,4}\w+:/' src/features/feed/services/FeedService.ts
perl -i -pe 's/cursor\b/_cursor/g if /^\s{2,4}\w+:/' src/features/profile/hooks/useProfile.ts

# src/features/groups
perl -i -pe 's/\} catch \(error\)/} catch (_error)/' src/features/groups/hooks/useGroupLeaderboard.ts
perl -i -pe 's/\} catch \(error\)/} catch (_error)/' src/features/groups/hooks/useGroupMembers.ts
perl -i -pe 's/isLoading\b/_isLoading/g if /^  \w+:/' src/features/profile/hooks/useProfile.ts

# src/lib/api files
perl -i -pe 's/\(query\)/(_query)/' src/lib/api/groups/index.ts
perl -i -pe 's/groupId, timeRange/groupId: _groupId, timeRange: _timeRange/' src/lib/api/groups/index.ts
perl -i -pe 's/challengeType\b/_challengeType/g if /^\s{2,4}\w+:/' src/lib/api/notifications/index.ts
perl -i -pe 's/const auth =/const _auth =/' src/lib/api/notifications/index.ts
perl -i -pe 's/const auth =/const _auth =/' src/lib/api/social/helpers.ts
perl -i -pe 's/\} catch \(socialGraphError\)/} catch (_socialGraphError)/' src/lib/api/users/getFollowingIds.ts

# src/lib/validation/examples
perl -i -pe 's/const validatedData/const _validatedData/' src/lib/validation/examples/ApiRouteExample.ts
perl -i -pe 's/type ApiResponse/type _ApiResponse/' src/lib/validation/examples/ApiRouteExample.ts
perl -i -pe 's/\} catch \(err\)/} catch (_err)/' src/lib/validation/examples/CommentFormExample.tsx
perl -i -pe 's/SessionFormInput/SessionFormInput as _SessionFormInput/' src/lib/validation/examples/SessionFormExample.tsx

echo "Done fixing unused variables!"
