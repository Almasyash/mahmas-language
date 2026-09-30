# MAHMAS LANGUAGE — DATABASE SPECIFICATION & SCHEMA ARCHITECTURE

> **Target Database:** PostgreSQL 15+  
> **ORM Layer:** Prisma ORM  
> **Schema File:** `backend/prisma/schema.prisma`

---

## 1. Design Principles

1. **Relational Data Integrity:** Foreign keys enforce cascading deletes where sub-entities depend strictly on parents (e.g. `Course` -> `CourseSection` -> `CourseUnit` -> `Lesson` -> `Exercise`).
2. **Authoritative Financial & Currency Modeling:**
   - Real money transactions (`Payment.amount`) use `Decimal(10, 2)` to eliminate floating-point inaccuracies.
   - Virtual currency (`Gems`, `Coins`, `Hearts`) is strictly tracked with dedicated balance records and atomic ledger transactions (`XPTransaction`).
3. **UTC Timestamps:** All dates and times are stored in UTC (`DateTime @default(now())`).
4. **Soft Deletions & Auditing:** Critical accounts use `deletedAt` for compliance with data retention policies while maintaining audit history.
5. **No Blind Client Input:** Streaks, daily goals, XP, and lesson completions are recorded only after backend verification of exercise payloads.

---

## 2. Core Entities Catalog (39 Models)

### 2.1 Identity & Authentication
- `User`: Primary security principal (email, phone, bcrypt password hash, roles, status).
- `Profile`: User settings, learning goal, native language, target language, CEFR level, hearts balance.
- `DeviceSession`: Refresh token rotation store, device metadata, IP address, expiration.

### 2.2 Pedagogical Curriculum Hierarchy
- `Language`: Supported catalog of languages with ISO codes and native names.
- `LanguageLevel`: CEFR levels (A1, A2, B1, B2, C1, C2) tied to language curricula.
- `Course`: Published course paths for specific language and level pairs.
- `CourseSection`: Thematic grouping of units (e.g., "Foundations", "Travel Essentials").
- `CourseUnit`: Granular units containing structured lessons and guidebook notes.
- `Lesson`: Sequence of learning exercises with associated XP and gem rewards.
- `Exercise`: Multi-type exercise definitions (translation, word arrangement, speaking, listening, etc.).
- `ExerciseOption`: Selectable or matching tokens for exercises.

### 2.3 Vocabulary & Mastery
- `VocabularyWord`: Dictionary entry with phonetics, translation, part of speech, audio, and CEFR level.
- `UserVocabulary`: Spaced Repetition System (SRS) tracker containing strength level (1-5), repetitions, and `nextReviewAt`.

### 2.4 Progress & Learning Analytics
- `UserProgress`: Course-level milestone tracker (current section, unit, lesson, completion state).
- `LessonAttempt`: Record of user lesson runs (score percentage, duration, completion status).
- `Mistake`: Specific exercise failure logged during lesson or practice for targeted review.
- `SpeakingAttempt`: Audio recording link, STT transcribed text, and aggregate pronunciation accuracy.
- `PronunciationScore`: Phoneme-level scoring breakdown (accuracy, fluency, completeness).

### 2.5 Gamification & Engagement
- `DailyGoal`: Daily XP target and progress per user per calendar day.
- `Streak`: Current consecutive active days, longest streak, and streak freeze inventory.
- `XPTransaction`: Append-only ledger of XP grants tied to lesson or practice events.
- `VirtualCurrency`: Balance of gems, coins, and hearts.
- `Quest`: Time-bounded daily and weekly missions.
- `Achievement`: Milestone badges with multi-tier unlock thresholds.
- `Leaderboard`: Weekly competitive league tables (Bronze up to Diamond) indexed on `[tier, weeklyXP DESC]`.

### 2.6 Social, Community & Messaging
- `Friend`: Bi-directional friendship status.
- `Follow`: Social following relationship.
- `Notification`: Push and in-app alerts (streak reminders, friend requests, match alerts).

### 2.7 AI Tutor System
- `AICharacter`: Configurable tutor personas with distinct system prompts, CEFR levels, and TTS voice parameters.
- `AIConversation`: Active dialogue sessions between learners and AI characters.
- `AIMessage`: Turn-by-turn dialogue history with pedagogical corrections.
- `AIConversationMemory`: Long-term episodic memory keys (user hobbies, preferences, goals) injected into future prompts.

### 2.8 Real-Time Calling & Language Exchange
- `HumanCall`: Call session record with status lifecycle (`INITIATED`, `RINGING`, `CONNECTED`, `COMPLETED`, `MISSED`, etc.).
- `CallParticipant`: Caller and callee participation timestamps.
- `CallReport`: Abuse report filed during or after a call.
- `LanguageExchangePreference`: Discovery profile (complementary language pair, CEFR level, topic interests, availability).

### 2.9 Safety, Moderation & Subscriptions
- `Block`: Unidirectional user blocking preventing calls, discovery, and messaging.
- `Report`: Moderation ticket queue with triage status (`PENDING`, `UNDER_REVIEW`, `ACTION_TAKEN`, `DISMISSED`).
- `Subscription`: User tier entitlements (`FREE`, `PLUS`, `PRO`).
- `Payment`: Financial ledger for in-app purchases and subscriptions with provider transaction IDs.

---

## 3. Indexing Strategy

- **Lookup Indexes:** `User(email)`, `Language(code)`, `LanguageLevel(languageId, level)`.
- **Relational Foreign Keys:** Indexed on all high-cardinality parent relationships (`CourseSection(courseId)`, `CourseUnit(sectionId)`, `Lesson(unitId)`, `Exercise(lessonId)`).
- **Time-Series / Filtering Queries:**
  - `UserVocabulary(userId, nextReviewAt)` for instant SRS flashcard generation.
  - `Leaderboard(tier, weeklyXP DESC)` for rapid weekly rankings calculation.
  - `XPTransaction(userId, createdAt)` for profile analytics charts.
  - `Report(reportedUserId, status)` for administrative moderation dashboards.
