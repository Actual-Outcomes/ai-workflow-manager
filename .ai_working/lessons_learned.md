# Lessons Learned — 2025-11-13

- Standardize references to the temporary workspace as `.ai_working/` across new rules; audit legacy documents for lingering `.ai-working/` mentions before next session.
- Codifying Dynamoose integration patterns early prevents table-creation regressions and should be checked whenever touching persistence layers.
- Running Prettier manually before staging avoids Husky rejections and keeps commit loops fast.

# Lessons Learned — 2025-11-15

- **Native module rebuild pattern**: `better-sqlite3` (and likely other native modules) must be rebuilt when switching between Node.js (for Vitest) and Electron runtimes due to ABI incompatibility. The Electron runtime uses NODE_MODULE_VERSION 119, while Node.js uses 127. Always rebuild before running tests or dev:
  - Tests: `npm rebuild better-sqlite3 --build-from-source`
  - Electron dev: `npm rebuild better-sqlite3 --runtime=electron --target=$(npx -q electron --version)`
- **Automated rebuild scripts added (2025-01-27)**: Added `rebuild:sqlite:test` and `rebuild:sqlite:electron` scripts, and integrated automatic rebuilds into `dev:electron` and `test` scripts. Manual rebuilds are no longer needed for normal development workflow. Documentation updated in README.md and QUICKSTART.md.
- **Always verify SDK capabilities before assuming limitations (2025-01-27)**: When asked if the Claude SDK covers the models endpoint, I initially assumed it didn't based on an incorrect comment in existing code (`// Anthropic API doesn't have a direct models endpoint`). I should have immediately verified the SDK's capabilities. The SDK actually provides `client.models.list()` and `client.models.retrieve()` methods. **Lesson**: Always verify SDK/API capabilities directly from documentation or type definitions rather than trusting existing code comments or assumptions. When a user questions whether something is supported, that's a signal to verify immediately.
