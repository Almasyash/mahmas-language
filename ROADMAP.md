# MAHMAS LANGUAGE — PRODUCT ROADMAP & EXECUTION PHASES

This roadmap details the progressive delivery plan for the Mahmas Language Super App.

---

## Phase Overview

| Phase | Milestone | Focus Areas | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Architecture & Foundation** | Repo setup, Flutter shell, modular backend shell, Prisma schema (39 models), security rules, documentation. | **COMPLETED** |
| **Phase 1** | **Auth, Onboarding & Profile** | Email/Google auth, refresh rotation, onboarding questionnaire, profile customization. | **COMPLETED** |
| **Phase 2** | **Language & Course Engine** | Course catalog, sections, units, interactive path visualizer, unlock logic. | **COMPLETED** |
| **Phase 3** | **Exercises & Gamification** | Server-authoritative scoring, streaks (timezone-aware), XP transactions, gems, quests, achievements. | **COMPLETED** |
| **Phase 4** | **Practice & Skills Drill** | Spaced Repetition (SRS) flashcards & vocabulary, mistakes review, practice runner session. | **COMPLETED** |
| **Phase 5** | **AI Conversational Tutor** | Persona configuration, episodic context memory, non-intrusive pedagogical feedback, session debrief. | **COMPLETED** |
| **Phase 6** | **AI Voice Calling** | Real-time audio streaming, speech-to-text (STT), low-latency LLM generation, neural text-to-speech (TTS), call debriefing. | *Next* |
| **Phase 7** | **AI Video Calling** | Animated avatar synchronization, live captions, conversational difficulty adaptation. | *Planned* |
| **Phase 8** | **Language Exchange** | Mutual interest & complementary language matching, tandem partner discovery. | *Planned* |
| **Phase 9** | **Real Human Audio Calling** | WebRTC signaling, STUN/TURN traversal, in-call controls, user anonymity. | *Planned* |
| **Phase 10** | **Real Human Video Calling** | WebRTC video pipeline, camera switching, connection reconnection state machines. | *Planned* |
| **Phase 11** | **Social & Leaderboards** | Weekly tiered leagues (Bronze to Diamond), quests, friend challenges, activity feeds. | *Planned* |
| **Phase 12** | **Subscriptions & Shop** | Tiered entitlement access (Free, Plus, Pro), virtual item store, streak freeze purchases. | *Planned* |
| **Phase 13** | **Admin Dashboard** | Role-based moderation console, curriculum builder, analytics, user audit logs. | *Planned* |
| **Phase 14** | **Security Hardening** | Penetration testing, rate limiting auditing, cryptographic token validation, input sanitization. | *Planned* |
| **Phase 15** | **Production Release** | Play Store release pipeline, multi-region database replication, CDN asset caching. | *Planned* |

---

## Phase 5 Accomplishments (Delivered)
1. **AI Tutor Backend Architecture:**
   - Multi-character persona definitions (Mateo, Sofia, Prof. Elena, Alex) with CEFR difficulty levels, tone, and scenario titles.
   - Resilient vendor-agnostic AI provider layer with `MockAIProviderAdapter` (pedagogical heuristics & memory extraction) and `GeminiAIProviderAdapter` with automatic fallback.
   - Non-intrusive pedagogical feedback engine delivering inline correction notes and suggestions without dialogue interruptions.
   - Episodic memory persistence (`AIConversationMemory`) storing user preferences, goals, and facts across dialogue sessions.
   - Authoritative rewards engine awarding micro-XP (+3 XP per message) and session completion rewards (+15 XP, +2 Gems, `FIRST_AI_CONVERSATION` achievement check, `AI_CHAT` quest progress).
   - 13 backend integration tests passing (60/60 total across 4 suites).

2. **AI Tutor Mobile Experience (Flutter):**
   - Interactive character selection screen with CEFR filter chips, rich persona cards, and scenario descriptions.
   - Multi-turn chat interface with chat bubbles, quick prompt suggestion chips, tap-to-translate action, and inline pedagogical feedback cards.
   - Gamified session debrief dialog displaying XP/gem gains, unlocked achievements, vocabulary practiced, and pedagogical review notes.
   - Seamless integration into `HomeScreen` dashboard with online tutor status indicator and instant jump into AI conversations.
   - 6 new widget & unit tests passing with zero static analysis warnings (`flutter analyze` 100% clean, 29/29 tests pass).

---

## Phase 6 Detailed Deliverables (Immediate Next Milestone)
1. **AI Voice Calling Architecture & Backend:**
   - Real-time bidirectional audio signaling and session management via WebSockets / WebRTC.
   - Speech-to-Text (STT) pipeline with multilingual acoustic models (Whisper / Gemini Live API / Google Cloud STT).
   - Low-latency conversational LLM stream orchestration with pause/interruption detection (Voice Activity Detection - VAD).
   - Text-to-Speech (TTS) engine with natural neural voice synthesis matching character persona timbre and pitch.
   - In-call audio session recording and post-call pedagogical pronunciation audit.

2. **AI Voice Calling Mobile Experience (Flutter):**
   - Full-screen calling UI with persona avatar, live audio waveform visualizer, call timer, and mute/speaker controls.
   - Live real-time subtitle stream with toggleable target-language captions and instant phonetic hints.
   - Post-call voice review modal displaying pronunciation accuracy score, speaking pace (words/min), and fluency metrics.

