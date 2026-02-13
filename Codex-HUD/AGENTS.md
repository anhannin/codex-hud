# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a clean baseline with no application code yet. Keep the root focused on configuration and documentation, and add runtime code under clear top-level folders as the project grows.

Recommended layout:
- `src/` for application or library code
- `tests/` for automated tests mirroring `src/` paths
- `assets/` for static resources (images, fixtures, sample data)
- `docs/` for design notes and architecture decisions

Example: `src/api/client.ts` should pair with `tests/api/client.test.ts`.

## Build, Test, and Development Commands
No build system is configured yet. When tooling is added, expose repeatable commands through a single entrypoint (`Makefile` or package scripts).

Suggested baseline commands:
- `make setup` to install dependencies and local tooling
- `make test` to run the full test suite
- `make lint` to run static checks/format validation
- `make dev` to start a local development environment

If using Node.js, mirror these as `npm run <script>`.

## Coding Style & Naming Conventions
Use consistent formatting and enforce it with tooling as soon as language choices are finalized.

General conventions:
- Indentation: 2 spaces for YAML/JSON/Markdown, 4 spaces for Python
- Filenames: `kebab-case` for docs/assets, language-idiomatic naming for code
- Modules: small, single-purpose files grouped by feature
- Prefer descriptive names: `user_profile_service` over `utils2`

Add a formatter/linter early (for example, Prettier + ESLint or Black + Ruff).

## Testing Guidelines
Create tests alongside new features; avoid large untested merges. Use deterministic unit tests first, then integration tests for cross-module behavior.

Conventions:
- Test files should mirror source paths
- Name tests by behavior (example: `creates session token for valid credentials`)
- Run tests locally before opening a PR

## Commit & Pull Request Guidelines
This repository has no commit history yet, so adopt Conventional Commits from the start.

Examples:
- `feat: add initial API client`
- `fix: handle missing config file`
- `docs: add architecture notes`

PR requirements:
- Clear summary of what changed and why
- Linked issue (if applicable)
- Test evidence (command output or checklist)
- Screenshots for UI-visible changes

# Project Rules

- After any file modification, run git commit.
- After commit, immediately run git push.
- Do not leave uncommitted changes.
- Write commit messages with:
  - What changed
  - Why it changed
  - Performance impact (if any)
