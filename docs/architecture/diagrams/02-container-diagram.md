# Container Diagram (C4 Level 2)

This diagram shows the high-level technology containers that make up the Ambira application.

```mermaid
graph TB
    %% Users
    User([User<br/>Web Browser])

    %% Frontend Container
    subgraph Vercel["Vercel Edge Network"]
        NextJS[Next.js Application<br/>Next.js 15 App Router<br/>React 19, TypeScript<br/>Tailwind CSS v4]

        subgraph Frontend["Frontend Layer"]
            Pages[Pages/Routes<br/>App Router Pages]
            Components[UI Components<br/>shadcn/ui, Radix UI]
        end

        subgraph State["State Management"]
            ReactQuery[React Query Cache<br/>TanStack Query<br/>Feature Boundary Caching]
            Contexts[Legacy Contexts<br/>Auth, Timer, Projects]
        end

        subgraph Features["Feature Modules"]
            Feed[Feed Feature<br/>Hooks, Services]
            Timer[Timer Feature<br/>Hooks, Services]
            Groups[Groups Feature<br/>Hooks, Services]
            Challenges[Challenges Feature<br/>Hooks, Services]
            Projects[Projects Feature<br/>Hooks, Services]
            Comments[Comments Feature<br/>Hooks, Services]
            Search[Search Feature<br/>Hooks, Services]
        end
    end

    %% Backend Services
    subgraph Firebase["Firebase Backend"]
        Auth[Firebase Authentication<br/>Email/Password, Social Login]
        Firestore[(Firestore Database<br/>Collections:<br/>users, sessions, groups,<br/>challenges, follows, etc.)]
        Storage[Cloud Storage<br/>Profile Pictures, Media]
        Rules[Security Rules<br/>Row-level Security]
    end

    %% External Services
    Sentry[Sentry<br/>Error Tracking]

    %% Relationships
    User -->|HTTPS| NextJS
    NextJS --> Pages
    Pages --> Components
    Components --> ReactQuery
    Components --> Contexts
    ReactQuery --> Features
    Contexts --> Features
    Features --> Auth
    Features --> Firestore
    Features --> Storage
    Firestore --> Rules
    NextJS -->|Error Reports| Sentry

    %% Styling
    classDef frontend fill:#007AFF,stroke:#005BBB,stroke-width:2px,color:#fff
    classDef state fill:#5856D6,stroke:#3634A3,stroke-width:2px,color:#fff
    classDef feature fill:#30B0C7,stroke:#2590A8,stroke-width:2px,color:#fff
    classDef backend fill:#34C759,stroke:#248A3D,stroke-width:2px,color:#fff
    classDef external fill:#FF9500,stroke:#C77400,stroke-width:2px,color:#fff
    classDef user fill:#FC4C02,stroke:#C83C01,stroke-width:2px,color:#fff

    class NextJS,Pages,Components frontend
    class ReactQuery,Contexts state
    class Feed,Timer,Groups,Challenges,Projects,Comments,Search feature
    class Auth,Firestore,Storage,Rules backend
    class Sentry external
    class User user
```

## Container Descriptions

### Next.js Application (Frontend)

**Technology**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
**Responsibilities**:

- Server-side rendering and static generation
- App Router-based routing
- Client-side interactivity
- State management coordination

**Key Sub-containers**:

#### Pages/Routes

- App Router pages (`src/app/**`)
- Server and client components
- Route handlers for API endpoints
- Layout and template definitions

#### UI Components

- Presentation components (`src/components/`)
- shadcn/ui component library
- Radix UI primitives
- Reusable UI patterns

### State Management Layer

#### React Query Cache

**Technology**: TanStack Query (React Query)
**Responsibilities**:

- Feature boundary caching pattern
- Declarative data fetching
- Optimistic updates
- Cache invalidation
- Background refetching

**Located in**: `src/features/*/hooks/`

#### Legacy Contexts

**Technology**: React Context API
**Status**: Being migrated to React Query
**Current Contexts**:

- `AuthContext` - User authentication state
- `TimerContext` - Active timer state
- `ProjectsContext` - Project management
- ~~`ActivitiesContext`~~ - Deprecated
- ~~`NotificationsContext`~~ - Deprecated

### Feature Modules

Clean architecture pattern with:

- **Hooks**: React Query boundaries (`use*.ts`)
- **Services**: Business logic (`*Service.ts`)
- **Components**: Feature-specific UI
- **Types**: Feature-specific TypeScript types

**Active Features**:

- Feed (sessions feed with social engagement)
- Timer (session tracking and persistence)
- Groups (social groups and membership)
- Challenges (competitions and leaderboards)
- Projects/Activities (work categorization)
- Comments (social interactions)
- Search (users and content discovery)

### Firebase Backend

#### Firebase Authentication

- Email/password authentication
- Social login providers (Google, GitHub, etc.)
- Session management
- User token handling

#### Firestore Database

**Collections**:

- `users` - User profiles and settings
- `sessions` - Work sessions (primary content type)
- `projects/{userId}/userProjects` - User's projects
- `groups` - Social groups
- `challenges` - Competitions
- `challengeParticipants` - Challenge participation
- `follows` - Social graph (follower/following)
- `comments` - Session comments
- `supports` - Session likes/supports
- `streaks` - Streak tracking
- `achievements` - User achievements

#### Cloud Storage

- Profile pictures
- Future: Session media attachments

#### Security Rules

- Row-level security for all collections
- Visibility-based access control
- User-scoped permissions
- Increment-only operations for counts

### External Services

#### Sentry

- Real-time error tracking
- Performance monitoring
- Source map upload for debugging
- Optional (can be disabled)

## Data Flow

1. **User Request** → Vercel Edge Network
2. **SSR/SSG** → Next.js renders initial page
3. **Client Hydration** → React takes over
4. **Data Fetching** → React Query hooks in features
5. **Business Logic** → Feature services
6. **Data Access** → Firestore repositories
7. **Real-time Updates** → Firestore listeners (timer, notifications)

## Caching Strategy

### React Query at Feature Boundaries

- Queries and mutations only in `src/features/*/hooks/`
- Hierarchical cache keys per feature
- Optimistic updates for instant feedback
- Automatic background refetching
- See [CACHING_STRATEGY.md](../CACHING_STRATEGY.md) for details

### Cache Time Patterns

- **Real-time**: 30s (active timer, live notifications)
- **Short**: 1m (feed, search results)
- **Medium**: 5m (session details, comments)
- **Long**: 15m (user profiles, groups)
- **Very Long**: 1h (stats, analytics)

## Deployment

- **Platform**: Vercel
- **Build**: Automatic on Git push
- **Edge Network**: Global CDN
- **Serverless Functions**: API routes and server components
- **Environment**: Production, Preview, Development
