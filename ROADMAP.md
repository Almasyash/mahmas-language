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
| **Phase 5** | **AI Conversational Tutor** | Persona configuration, context memory, pedagogical feedback without interruptions. | *Next* |
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

## Phase 5 Detailed Deliverables (Immediate Next Milestone)
1. **AI Tutor Backend Architecture:**
   - Persona definitions (Prof. Mateo, Sofia, etc.) with tone, strictness, topic affinity
   - Multi-turn conversation sessions with persistent memory
   - Non-intrusive pedagogical correction engine (inline suggestions, grammar debriefing)
   - Integration with vendor-agnostic AI provider (Gemini / OpenAI / Anthropic / Mock)
2. **AI Tutor Mobile Experience (Flutter):**
   - AI Tutor selection and persona preview screen
   - Dynamic chat interface with pedagogical aids (tap-to-translate, pronunciation listen, grammar hint cards)
   - Conversation debrief modal with XP reward and mistake sync to practice queue

