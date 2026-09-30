# MAHMAS LANGUAGE — PRODUCT ROADMAP & EXECUTION PHASES

This roadmap details the progressive delivery plan for the Mahmas Language Super App.

---

## Phase Overview

| Phase | Milestone | Focus Areas | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Architecture & Foundation** | Repo setup, Flutter shell, modular backend shell, Prisma schema (39 models), security rules, documentation. | **COMPLETED** |
| **Phase 1** | **Auth, Onboarding & Profile** | Email/Google auth, refresh rotation, onboarding questionnaire, profile customization. | *Next* |
| **Phase 2** | **Language & Course Engine** | Course catalog, sections, units, interactive path visualizer, unlock logic. | *Planned* |
| **Phase 3** | **Exercises & Gamification** | 13 exercise types, authoritative backend scoring, streaks, XP transactions, hearts system. | *Planned* |
| **Phase 4** | **Practice & Skills Drill** | Spaced Repetition (SRS) flashcards, pronunciation accuracy scoring, mistakes review. | *Planned* |
| **Phase 5** | **AI Conversational Tutor** | Persona configuration, context memory, pedagogical feedback without interruptions. | *Planned* |
| **Phase 6** | **AI Voice Calling** | Real-time audio streaming, speech-to-text, LLM response, text-to-speech, call debriefing. | *Planned* |
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

## Phase 1 Detailed Deliverables (Immediate Next Phase)
1. **Authentication API:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`.
2. **Onboarding Flow (Flutter):**
   - Welcome Screen
   - Native Language Selection
   - Target Language Selection
   - Learning Goal Selection (Speaking, Travel, School, Work, Interview, Daily Conversation, Fluency, Vocabulary)
   - Daily Commitment Target (5, 10, 15, 20 mins)
   - Proficiency Level Selection (A1 to C2)
   - Profile Initialization
3. **Flutter State Management & Secure Token Storage:** Implementation of auth repository with secure encrypted storage.
