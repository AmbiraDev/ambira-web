# Coding Guidelines

All of our style conventions will be enforced via typescript-eslint and Prettier. We will customize our ESLint config file to fit all of our guidelines.

## Typescript - Google TypeScript Style Guide

We chose Google’s TypeScript Style Guide because its emphasis on explicit types, naming consistency, and strict null handling ensures Ambira’s data models and async logic remain reliable across the app. We’ll enforce these standards through TypeScript’s strict compiler options and the @typescript-eslint/recommended ESLint configuration integrated into our CI pipeline.

## TSX - Airbnb React Style Guideline

The Airbnb React/JSX Style Guide provides consistent, readable component structure and hooks usage that keeps Ambira’s mobile UI predictable and performant. We’ll enforce it using ESLint with the Airbnb and React Hooks plugins, alongside Prettier formatting and pre-commit lint checks.

## Firestore Query - Google Firestore Query Best Practices

We follow Google’s Firestore Query Best Practices to ensure Ambira’s data fetching remains secure, index-friendly, and scalable, particularly for feeds and user privacy controls. These practices will be enforced by isolating all queries in a typed service layer, linting async usage with ESLint, and validating query behavior with Firestore Emulator tests in CI.
