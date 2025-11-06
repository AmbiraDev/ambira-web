# Ambira Documentation

Welcome to the Ambira documentation hub. This guide will help you navigate all project documentation.

## Quick Start

- **New to the project?** Start with [README.md](../README.md)
- **Development guidelines?** See [CLAUDE.md](../CLAUDE.md)
- **Setting up your environment?** Check [Testing Quickstart](./testing/QUICKSTART.md)

## Documentation Status

- **[Documentation Status Report](./DOCUMENTATION_STATUS.md)** - Executive summary for stakeholders (maturity 7/10)
- **[Documentation Gap Analysis](./DOCUMENTATION_GAP_ANALYSIS.md)** - Comprehensive review of missing and outdated documentation (100+ pages)
- **[Documentation Gaps Summary](./DOCUMENTATION_GAPS_SUMMARY.md)** - Quick reference for critical gaps and action plan

## Core Documentation

### Architecture

Comprehensive architectural documentation and design patterns.

- **[Architecture Overview](./architecture/README.md)** - System architecture and design principles
- **[Caching Strategy](./architecture/CACHING_STRATEGY.md)** - React Query implementation patterns
- **[Examples](./architecture/EXAMPLES.md)** - Complete feature implementations
- **[Migration Guide](./architecture/MIGRATION_GUIDE.md)** - Guide for migrating to new patterns
- **[Migration Status](./architecture/MIGRATION_STATUS.md)** - Current migration progress
- **[Context Elimination Strategy](./architecture/CONTEXT_ELIMINATION_STRATEGY.md)** - Moving from Context to React Query
- **[Tooling](./architecture/TOOLING.md)** - Development tools and utilities
- **[Diagrams](./architecture/diagrams/)** - System and container diagrams

### Testing

Testing documentation and guides.

- **[Testing Overview](./testing/README.md)** - Complete testing guide
- **[Playwright CI Setup](./testing/playwright-ci-setup.md)** - CI/CD integration
- **[Playwright Setup Summary](./testing/PLAYWRIGHT_SETUP_SUMMARY.md)** - E2E test setup

### Performance

Performance optimization and monitoring.

- **[Performance Documentation](./performance/)** - Performance guidelines and optimization

## Archive

Historical documentation and completed migrations.

### Migrations

Completed migration reports and summaries.

- [Context to React Query Migration](./archive/migrations/CONTEXT_TO_REACT_QUERY_MIGRATION.md)
- [Context to React Query Complete](./archive/migrations/CONTEXT_TO_REACT_QUERY_COMPLETE.md)
- [Firebase API Migration Complete](./archive/migrations/FIREBASE_API_MIGRATION_COMPLETE.md)
- [Firebase API Migration Success](./archive/migrations/FIREBASE_API_MIGRATION_SUCCESS.md)
- [Migration Complete](./archive/migrations/MIGRATION_COMPLETE.md)
- [Migration Complete Summary](./archive/migrations/MIGRATION_COMPLETE_SUMMARY.md)
- [Migration Success](./archive/migrations/MIGRATION_SUCCESS.md)
- [Migration Summary](./archive/migrations/MIGRATION_SUMMARY.md)
- [Sentry Migration Summary](./archive/migrations/SENTRY_MIGRATION_SUMMARY.md)
- [Sentry Setup](./archive/migrations/SENTRY_SETUP.md)

### Phase Reports

Historical phase implementation reports.

- [Phase 2 Component Migration](./archive/phases/PHASE_2_COMPONENT_MIGRATION.md)
- [Phase 2 Continuation Session](./archive/phases/PHASE_2_CONTINUATION_SESSION.md)
- [Phase 2 Final Cleanup Session](./archive/phases/PHASE_2_FINAL_CLEANUP_SESSION.md)
- [Phase 2 Profile Session](./archive/phases/PHASE_2_PROFILE_SESSION.md)
- [Phase 2 Progress](./archive/phases/PHASE_2_PROGRESS.md)
- [Phase 2 Session Summary](./archive/phases/PHASE_2_SESSION_SUMMARY.md)
- [Phase 2 Status](./archive/phases/PHASE_2_STATUS.md)
- [Phase 2 Timer Migration Complete](./archive/phases/PHASE_2_TIMER_MIGRATION_COMPLETE.md)

### Refactoring

Historical refactoring documentation.

- [Codebase Structure Analysis](./archive/refactoring/CODEBASE_STRUCTURE_ANALYSIS.md)
- [Fix Types](./archive/refactoring/fix-types.md)
- [Mock Refactoring Report](./archive/refactoring/MOCK_REFACTORING_REPORT.md)
- [Refactor](./archive/refactoring/REFACTOR.md)
- [Refactoring Complete](./archive/refactoring/REFACTORING_COMPLETE.md)
- [Refactoring Summary](./archive/refactoring/REFACTORING_SUMMARY.md)
- [Scripts Organization Summary](./archive/refactoring/SCRIPTS_ORGANIZATION_SUMMARY.md)

### Discussions

Team discussions and strategy documents.

- [First 100 Users](./archive/discussions/TEAM_DISCUSSION_FIRST_100_USERS.md)
- [PMF Strategy](./archive/discussions/TEAM_DISCUSSION_PMF_STRATEGY.md)
- [Marketing Strategy](./archive/discussions/TEAM_DISCUSSION_MARKETING_STRATEGY.md)

### Other

- [Critical Questions Checklist](./archive/CRITICAL_QUESTIONS_CHECKLIST.md)
- [Product Status and Roadmap](./archive/PRODUCT_STATUS_AND_ROADMAP.md)
- [Security Improvements](./archive/SECURITY_IMPROVEMENTS.md)

## Contributing

When adding new documentation:

1. **Architecture docs** → `docs/architecture/`
2. **Testing docs** → `docs/testing/`
3. **Performance docs** → `docs/performance/`
4. **Historical/completed work** → `docs/archive/`
5. **Migration reports** → `docs/archive/migrations/`
6. **Phase reports** → `docs/archive/phases/`
7. **Refactoring reports** → `docs/archive/refactoring/`
8. **Team discussions** → `docs/archive/discussions/`

Keep the root directory clean - only `README.md` and `CLAUDE.md` should live there.

## Documentation Structure

```
ambira-web/
├── README.md                 # Project overview and quick start
├── CLAUDE.md                 # AI assistant guidelines
│
└── docs/
    ├── index.md              # This file - central navigation
    │
    ├── architecture/         # System architecture
    │   ├── README.md
    │   ├── CACHING_STRATEGY.md
    │   ├── EXAMPLES.md
    │   └── diagrams/
    │
    ├── testing/              # Testing documentation
    │   ├── README.md
    │   ├── playwright-ci-setup.md
    │   └── PLAYWRIGHT_SETUP_SUMMARY.md
    │
    ├── performance/          # Performance optimization
    │
    └── archive/              # Historical documentation
        ├── migrations/       # Completed migrations
        ├── phases/           # Phase reports
        ├── refactoring/      # Refactoring history
        └── discussions/      # Team discussions
```
