# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 2.0.0 (2026-11-18)


### Breaking

- Volto 19 support. The add-on was migrated to the Volto 19 add-on structure and is now developed and tested against `@plone/volto` 19 (React 18). The repository is a pnpm monorepo and the add-on moved to `packages/volto-sentry`; the Yarn and npm lock files were replaced by pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, `packageManager: pnpm@10.20.0`), so the development workflow is now `pnpm install`, `pnpm start`, `pnpm test`, and `pnpm build`. 


### Internal

- Replaced the Jest configuration with a Vitest setup (`vitest.config.mjs`), moved the Cypress tests from `cypress/integration` to `cypress/tests` following the Volto 19 add-on layout, added a Storybook configuration, and added GitHub Actions workflows for CI and the towncrier changelog check. Reformatted the sources with the new Prettier and ESLint configuration, removed the unused `CaptureConsole` import from the Sentry integration setup, and added the missing trailing newlines. 


### Documentation

- Added the Sphinx documentation scaffold using Plone Sphinx Theme with a Read the Docs configuration, and backfilled the release notes of the 0.2.0 to 1.0.1 releases from the Git history. 

## 1.0.1 (2026-06-04)

### Bugfix

- Fixed the `Cannot read properties of undefined (reading 'getState')` crash.

## 1.0.0 (2026-05-28)

### Bugfix

- Uploaded the source maps to Sentry from the release script.

## 0.4.0 (2025-10-01)

### Bugfix

- Made the add-on capture React SSR errors, with the `withSentrySSRErrorHandling`, `sentrySSRErrorMiddleware`, and `captureSSRError` helpers.

## 0.3.1 (2023-10-16)

### Bugfix

- Removed the faulty `Sentry.js` module that broke the add-on on case-insensitive file systems such as macOS and Windows (#6).

### Internal

- Added the English locale.

## 0.3.0 (2022-11-23)

### Bugfix

- Removed the faulty `Sentry.js` module that broke the add-on on case-insensitive file systems.

## 0.2.1 (2022-11-23)

### Bugfix

- Fixed the add-on usage inside Storybook (#4).

### Documentation

- Fixed the add-on documentation.

### Internal

- Published the package to npm.

## 0.2.0 (2022-11-16)

### Feature

- First working version of the add-on, ported from Volto core (#1).
