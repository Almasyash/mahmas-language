# Contributing to Mahmas Language Platform

Thank you for your interest in contributing to the Mahmas Language Super App!

## Originality and Intellectual Property Guidelines

**Strict Rule:** This project is an original language-learning platform.
- Do NOT copy Duolingo branding, logos, mascots (Duo, Lily, etc.), proprietary lesson copy, illustrations, animations, or source code.
- All characters, narratives, pedagogy, course structures, and UI themes must be 100% original.

## Development Workflow

1. **Phased Development:**
   Follow the structured roadmap outlined in `ROADMAP.md`. Do not build speculative features ahead of phased architecture.
2. **Branching Model:**
   - `main`: Production-ready, stable code.
   - `develop`: Ongoing integration.
   - Feature branches: `feat/<phase-number>-<feature-name>` (e.g. `feat/p1-onboarding`).
   - Fix branches: `fix/<issue-name>`.
3. **Commit Standards:**
   Follow conventional commits:
   - `feat: ...`
   - `fix: ...`
   - `docs: ...`
   - `refactor: ...`
   - `test: ...`
   - `chore: ...`
4. **Testing & Verification:**
   - Flutter: `flutter test` and `flutter analyze` must pass with zero errors.
   - Backend: `npm test` and `npm run build` must compile cleanly.
   - Database: Any schema changes must be accompanied by documented Prisma migrations in `DATABASE.md`.
5. **Security & Secrets:**
   - Never commit `.env` files, API keys, private tokens, or real user identifiers.
   - Validate all reward, XP, and virtual currency transactions on the backend.
