## Description

<!-- Provide a clear and concise description of what this PR does -->

### What changed?

<!-- Describe the changes made in this PR -->

### Why was this change made?

<!-- Explain the motivation or problem this PR addresses -->

## Type of Change

<!-- Mark the relevant option(s) with an 'x' -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes, code improvements)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Test coverage improvement
- [ ] Dependency update
- [ ] Configuration change

## Related Issues

<!-- Link to related issues using keywords like "Fixes", "Closes", "Resolves" -->

Fixes #
Relates to #

## Screenshots / Recordings

<!-- If this PR includes UI changes, please provide screenshots or recordings -->

### Before

<!-- Screenshot or description of the UI before changes -->

### After

<!-- Screenshot or description of the UI after changes -->

## Testing

### How has this been tested?

<!-- Describe the tests you ran to verify your changes -->

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

### Test configuration

<!-- Provide details about your test configuration -->

- **Browser(s)**:
- **Device(s)**:
- **OS**:

### Test coverage

<!-- Include test coverage metrics if applicable -->

```bash
# Run these commands to verify
npm test
npm run test:coverage
npm run test:e2e
```

## Checklist

<!-- Mark completed items with an 'x' -->

### Code Quality

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have removed any console.log statements and debug code
- [ ] My changes generate no new warnings or errors
- [ ] I have run `npm run lint` and fixed any issues
- [ ] I have run `npm run type-check` and fixed any TypeScript errors
- [ ] I have run `npm run format` to ensure consistent code style

### Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] New and existing integration tests pass locally with my changes
- [ ] E2E tests pass locally with my changes
- [ ] Test coverage meets or exceeds the current threshold (11%)

### Documentation

- [ ] I have updated the documentation (README.md, CLAUDE.md, architecture docs)
- [ ] I have updated the relevant JSDoc comments
- [ ] I have added/updated examples if introducing new patterns
- [ ] I have updated `.env.example` if adding new environment variables

### Firebase

- [ ] I have updated Firestore security rules if modifying data access patterns
- [ ] I have deployed Firestore rules using `npx firebase-tools deploy --only firestore:rules`
- [ ] I have created/documented any required Firestore indexes
- [ ] I have verified that Firestore operations handle errors properly

### Accessibility & Design

- [ ] My changes follow the design principles in `/context/design-principles.md`
- [ ] My changes follow the brand style guide in `/context/style-guide.md`
- [ ] I have tested keyboard navigation
- [ ] I have verified color contrast meets WCAG AA standards
- [ ] I have tested on mobile devices (or using responsive design tools)
- [ ] I have verified screen reader compatibility (if applicable)

### Build & Deployment

- [ ] `npm run build` completes successfully
- [ ] No new build warnings are introduced
- [ ] I have considered the impact on bundle size
- [ ] I have tested the production build locally with `npm run start`

## Breaking Changes

<!-- If this PR includes breaking changes, describe them here and provide migration steps -->

**Does this PR introduce breaking changes?**

- [ ] Yes
- [ ] No

### Migration Guide

<!-- If yes, provide detailed migration instructions for users/developers -->

## Additional Notes

<!-- Add any additional notes, context, or information that reviewers should know -->

## Reviewer Guidance

<!-- Help reviewers understand what to focus on -->

### Areas to focus on

<!-- Highlight specific areas where you'd like extra attention -->

### Known limitations

<!-- List any known limitations or trade-offs in this implementation -->

### Follow-up work

<!-- List any follow-up work that should be done in future PRs -->

---

**Deployment checklist** (for maintainers):

- [ ] PR has been reviewed and approved
- [ ] All CI checks are passing
- [ ] Documentation is updated
- [ ] Firebase rules are deployed (if applicable)
- [ ] Breaking changes are documented in release notes (if applicable)
