# System Context Diagram (C4 Level 1)

This diagram shows the highest level view of the Ambira system and how it interacts with users and external systems.

```mermaid
graph TB
    %% Users
    User([User<br/>Tracks productivity sessions,<br/>follows friends,<br/>joins groups])

    %% Main System
    Ambira[Ambira System<br/>Social Productivity Tracking Platform<br/>Next.js 15 + TypeScript + Firebase]

    %% External Systems
    Firebase[(Firebase<br/>Authentication, Firestore,<br/>Cloud Storage)]
    Vercel[Vercel<br/>Hosting & Edge Network]
    Sentry[Sentry<br/>Error Tracking & Monitoring]
    Email[Email Service<br/>Notifications & Auth]

    %% Relationships
    User -->|Tracks sessions,<br/>views feed,<br/>engages socially| Ambira
    Ambira -->|Authenticates,<br/>stores data,<br/>uploads media| Firebase
    Ambira -->|Deployed on| Vercel
    Ambira -->|Reports errors| Sentry
    Ambira -->|Sends notifications| Email

    %% Styling
    classDef system fill:#007AFF,stroke:#005BBB,stroke-width:3px,color:#fff
    classDef external fill:#34C759,stroke:#248A3D,stroke-width:2px,color:#fff
    classDef user fill:#FC4C02,stroke:#C83C01,stroke-width:2px,color:#fff

    class Ambira system
    class Firebase,Vercel,Sentry,Email external
    class User user
```

## Key Elements

### Users

- End users who track their productivity sessions
- Follow friends and view their activity
- Join groups and participate in challenges
- Engage with social features (supports, comments)

### Ambira System

The central application providing:

- Session tracking and timer functionality
- Social feed and following system
- Groups and challenges
- Analytics and insights
- Project/activity management

### External Systems

**Firebase**

- Authentication (email/password, social login)
- Firestore database for all application data
- Cloud Storage for profile pictures and media

**Vercel**

- Edge network deployment
- Serverless function hosting
- CDN for static assets
- Automatic deployments from Git

**Sentry**

- Real-time error tracking
- Performance monitoring
- Release tracking
- User feedback integration

**Email Service**

- Authentication emails (password reset, verification)
- Notification emails (optional future feature)
