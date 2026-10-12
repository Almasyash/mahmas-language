# Speakly_FS — Phase 1: Baseline Architecture & Feature Audit

**Document Date:** October 12, 2026  
**Auditor:** Antigravity Deep QA Agent  
**Repository:** `https://github.com/FS-Groupz/Speakly_FS.git`  
**Branch:** `main` (commit `a4e2d43`)  
**Canonical App Name:** Speakly_FS  

---

## 1. Environment & Toolchain Baseline

| Component | Verified Version | Path / Environment | Status |
| :--- | :--- | :--- | :--- |
| **Flutter SDK** | `Flutter 3.47.5 • channel stable` | `C:\flutter\bin\flutter.bat` | VERIFIED |
| **Dart SDK** | `Dart 3.13.4 (DevTools 2.60.0)` | Embedded in Flutter SDK | VERIFIED |
| **Node.js** | `v24.19.0` | `C:\Program Files\nodejs\node.exe` | VERIFIED |
| **npm** | `11.17.0` | `C:\Program Files\nodejs\npm.cmd` | VERIFIED |
| **Database Server** | PostgreSQL 16.4 (local embedded daemon) + Neon Cloud DB | `127.0.0.1:5432` / Neon AWS ap-southeast-1 | VERIFIED |
| **Target OS / Platform** | Android 8.0+ (API 26+) to Android 14+ (API 34) | Tested on ARM64 APK / JVM / Flutter | VERIFIED |

---

## 2. Feature Implementation Status Matrix

Every feature listed below was inspected directly in the actual source code, Prisma schema, API route handlers, and Flutter UI layers.

| Feature Area | Sub-Feature | Verified Implementation Files | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | Registration (Email/Password) | `backend/src/modules/auth/auth.service.ts` | **IMPLEMENTED** | Password hashing (bcrypt 12 rounds), JWT access + refresh tokens. |
| | Login & Validation | `backend/src/modules/auth/auth.controller.ts` | **IMPLEMENTED** | Input validation via Zod schemas, timing-safe error responses. |
| | Refresh Token Rotation | `backend/src/modules/auth/auth.service.ts` | **IMPLEMENTED** | Refresh token hash stored in DB, rotated on every refresh. Revocation on logout. |
| | Logout & Session Revocation | `backend/src/modules/auth/auth.controller.ts` | **IMPLEMENTED** | Database token invalidated, client storage cleared. |
| **Onboarding & Profile** | Language Selection | `backend/src/modules/users/users.service.ts` | **IMPLEMENTED** | Native & target language selection saved to `Profile` table. |
| | Learning Goals & Daily Minutes | `backend/src/modules/users/users.controller.ts` | **IMPLEMENTED** | Goals (`SPEAKING`, `TRAVEL`, `FLUENCY`, etc.) and minutes (`5`, `10`, `15`, `20`) stored. |
| | Timezone & Heart System | `backend/src/modules/users/users.service.ts` | **IMPLEMENTED** | Timezone stored for daily streaks, 5 max hearts with automatic refill logic. |
| **Language & Catalog** | Supported Languages (12) | `backend/src/database/seed.ts` | **IMPLEMENTED** | `en`, `es`, `fr`, `de`, `hi`, `ar`, `ja`, `ko`, `zh`, `ru`, `pt`, `it`. |
| | Public Languages API | `backend/src/modules/languages/languages.controller.ts` | **IMPLEMENTED** | `GET /api/v1/languages` returns all 12 languages with emojis and metadata. |
| **Course Engine** | Course Path Resolution | `backend/src/modules/courses/courses.service.ts` | **IMPLEMENTED** | Queries based on user's `nativeLanguageId` and `targetLanguageId`. Invariant enforced. |
| | Course Hierarchy | `backend/src/database/prisma` (Prisma Models) | **IMPLEMENTED** | `Course` &rarr; `CourseSection` &rarr; `CourseUnit` &rarr; `Lesson` &rarr; `Exercise`. |
| | Seeded Courses (5) | `backend/src/database/seed.ts` | **IMPLEMENTED** | English (`course-en-a1`), Spanish (`course-es-a1`), French (`course-fr-a1`), German (`course-de-a1`), Japanese (`course-ja-a1`). |
| **Lesson & Exercises** | Lesson Unlocking Logic | `backend/src/modules/lessons/lessons.service.ts` | **IMPLEMENTED** | Linear unlock: Lesson $N$ requires Lesson $N-1$ completed, or first lesson unlocked by default. |
| | Exercise Types Supported | `backend/src/modules/lessons/lessons.service.ts` | **IMPLEMENTED** | `MULTIPLE_CHOICE`, `TRANSLATION`, `FILL_IN_BLANK`, `WORD_ORDER`, `LISTENING`, `SPEAKING`. |
| | Answer Evaluation | `backend/src/modules/lessons/lessons.service.ts` | **IMPLEMENTED** | Server-authoritative check against `expectedAnswer` and `acceptableAlternatives`. |
| | Answer-Key Leak Protection | `backend/src/modules/lessons/lessons.service.ts` | **IMPLEMENTED** | `expectedAnswer` and `acceptableAlternatives` stripped from exercise payloads sent to client. |
| **Progression & Gamification** | XP Transactions | `backend/src/modules/progression/xp.service.ts` | **IMPLEMENTED** | Atomic XP transactions logged in `XPTransaction` table. Server-side level curve. |
| | Daily Learning Streaks | `backend/src/modules/progression/streak.service.ts` | **IMPLEMENTED** | Timezone-aware streak updates with streak freeze protection support. |
| | Gem Currency System | `backend/src/modules/progression/currency.service.ts` | **IMPLEMENTED** | Gems awarded for lesson completion, voice/video calls, and daily quests. |
| | Daily Quests & Claims | `backend/src/modules/progression/quests.service.ts` | **IMPLEMENTED** | 8 quest types tracked dynamically; idempotent reward claim validation. |
| | Achievements (11) | `backend/src/modules/progression/achievements.service.ts` | **IMPLEMENTED** | Multi-tier unlocks (`FIRST_LESSON`, `FIRST_AI_CONVERSATION`, `FIRST_AI_VOICE_CALL`, etc.). |
| **Practice & SRS** | Practice Session Runner | `backend/src/modules/practice/practice.service.ts` | **IMPLEMENTED** | Dynamic 5-exercise practice sets pulled from previously completed lessons. |
| | Mistake Review | `backend/src/modules/practice/mistakes.service.ts` | **IMPLEMENTED** | Incorrect answers logged to `MistakeReview` table; resolved on correct drill. |
| | Spaced Repetition (SRS) | `backend/src/modules/practice/vocabulary.service.ts` | **PARTIAL** | Vocabulary items tracked with mastery score, ease factor, and review interval. Basic SRS algorithm implemented. Full SuperMemo-2 interval scheduling pending. |
| **AI Conversational Tutor** | Persona Discovery & Filter | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | 10 AI characters configured across languages with CEFR difficulty levels. |
| | Episodic Memory Extraction | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | Extracts user preferences (likes, identity, location) into persistent `AIMemory` records. |
| | Pedagogical Feedback | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | Inline non-intrusive grammatical/phonetic correction notes. |
| | Debriefing Dialogue | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | Post-session debrief with accuracy, corrections count, XP and gem rewards. |
| **AI Voice Calling** | Real-time Voice Call Session | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | `/api/v1/ai/calls/initiate`, `/turn`, `/end`. Live timer, audio waveform orb in Flutter. |
| | Pronunciation Evaluator | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | Phonetic scoring (Spanish alveolar trill /rr/, cadence, pronunciation accuracy). |
| **AI Video Calling** | Animated Avatar Visemes | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | Procedural 2D avatar canvas in Flutter with 6 mouth visemes, blinking, eyebrow tilt, emotion pills. |
| | Visual Aid Cues | `backend/src/modules/ai/ai.service.ts` | **IMPLEMENTED** | Dynamic café menus, transit maps, flight passes with tap-to-speak vocabulary tags. |
| **Networking & Failover** | Dual Endpoint Switching | `mobile/lib/core/network/api_client.dart` | **IMPLEMENTED** | Primary `speakly.fsgroupz.com` with automated fallback to `speakly-fs.onrender.com`. |
| | HTTPS Certificate Security | `mobile/lib/core/network/api_client.dart` | **IMPLEMENTED** | Standard HTTPS certificate verification preserved without insecure trust overrides. |
| **Deployment Scripts** | cPanel API Deployment | `public_html_speakly_api/` | **IMPLEMENTED** | `app.js`, `.htaccess` reverse proxy configured for cPanel Node.js passenger. |
| | Render Cloud Service | `backend/` | **IMPLEMENTED** | Node 20 / TypeScript production build with automatic Prisma DB push and seed. |

---

## 3. Critical Architecture & Operational Findings

### Finding 1: Dual-Endpoint Database Invariance
* **Current Primary Endpoint:** `https://speakly.fsgroupz.com/api/v1` (currently returning Cloudflare Error 1000 due to DNS/proxy routing to prohibited/origin IP).
* **Current Fallback Endpoint:** `https://speakly-fs.onrender.com/api/v1` (verified live, healthy, connected to Neon PostgreSQL).
* **Risk:** If the cPanel backend on `speakly.fsgroupz.com` is booted with a local database instead of the shared Neon PostgreSQL cluster, users switching between endpoints would experience data inconsistency (lost progress, missing accounts).
* **Remediation Invariant:** Both primary and fallback environments MUST share the same authoritative `DATABASE_URL` (Neon PostgreSQL cluster).

### Finding 2: AI Provider Model Configuration
* `backend/.env` is configured with `AI_PROVIDER=gemini` and `AI_CHAT_MODEL=gemini-2.5-flash`.
* The adapter gracefully falls back to `MockAIProviderAdapter` when Gemini rate limits (429) or transient 503 errors occur, ensuring zero client crash or blocking failure.
