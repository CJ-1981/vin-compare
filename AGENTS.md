# Repository Guidelines

## Project Structure & Module Organization

`index.html` is the standalone browser application, containing its UI, styles, and application logic. `src/` contains ES modules for VIN comparison (`engine.js`), persistence (`storage.js`), and exports (`export.js`). The Node test suite lives in `tests/`. Screenshots are in `docs/assets/`; design notes and plans are in `docs/superpowers/`. The GitHub Pages workflow is in `.github/workflows/deploy-pages.yml`.

## Build, Test, and Development Commands

- Open `index.html` directly in a browser to run the app locally; no build step or server is required.
- Run `npm test` to execute all `tests/*.test.js` files with Node's built-in test runner. CI uses Node.js 20.
- Run `node --test tests/engine.test.js` to focus on one test file.

The Pages workflow runs tests before deploying the repository on pushes to `main`. SheetJS is loaded from a CDN for spreadsheet support; check the fallback behavior when working offline.

## Coding Style & Naming Conventions

Follow the existing JavaScript and HTML style: two-space indentation, semicolons, descriptive camelCase functions and variables, and ES module exports in `src/`. Match nearby code when editing. Keep comparison, storage, and export behavior consistent with the standalone app in `index.html`. No formatter or linter is configured in `package.json`.

## Testing Guidelines

Use `node:test` and `node:assert/strict`. Name test files `*.test.js` and describe observable behavior in each test. Add or update tests for changed comparison, persistence, export, and app behavior, including relevant edge cases. Run `npm test` before submitting changes; no coverage threshold is configured. Manually check browser interactions for UI changes.

## Commit & Pull Request Guidelines

Recent commits use short, imperative subjects with prefixes such as `feat:`, `fix:`, `docs:`, `chore:`, and `ci:`. Follow that pattern, for example `fix: preserve filters when swapping lists`. In pull requests, describe the change and its purpose, link any relevant issue, and report the tests performed. Include screenshots for visible UI changes.

## Data & Configuration

Workspaces may contain vehicle identifiers and notes. Use synthetic VINs in tests and screenshots, and avoid committing personal or sensitive workspace exports.
