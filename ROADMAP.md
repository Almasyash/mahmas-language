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
| **Phase 6** | **AI Voice Calling** | Real-time audio streaming, speech-to-text (STT), low-latency LLM generation, neural text-to-speech (TTS), call debriefing. | **COMPLETED** |
| **Phase 7** | **AI Video Calling** | Animated avatar synchronization, facial expression state machine, live captions, conversational difficulty adaptation. | *Next* |
| **Phase 8** | **Language Exchange** | Mutual interest & complementary language matching, tandem partner discovery. | *Planned* |
| **Phase 9** | **Real Human Audio Calling** | WebRTC signaling, STUN/TURN traversal, in-call controls, user anonymity. | *Planned* |
| **Phase 10** | **Real Human Video Calling** | WebRTC video pipeline, camera switching, connection reconnection state machines. | *Planned* |
| **Phase 11** | **Social & Leaderboards** | Weekly tiered leagues (Bronze to Diamond), quests, friend challenges, activity feeds. | *Planned* |
| **Phase 12** | **Subscriptions & Shop** | Tiered entitlement access (Free, Plus, Pro), virtual item store, streak freeze purchases. | *Planned* |
| **Phase 13** | **Admin Dashboard** | Role-based moderation console, curriculum builder, analytics, user audit logs. | *Planned* |
| **Phase 14** | **Security Hardening** | Penetration testing, rate limiting auditing, cryptographic token validation, input sanitization. | *Planned* |
| **Phase 15** | **Production Release** | Play Store release pipeline, multi-region database replication, CDN asset caching. | *Planned* |

---

## Phase 6 Accomplishments (Delivered)
1. **AI Voice Calling Backend Architecture:**
   - Authoritative voice call lifecycle endpoints: `/api/v1/ai/calls/initiate`, `/calls/:id/turn`, `/calls/:id/end`, and `/calls/:id`.
   - Speech synthesis adapter (`generateSpeech`) returning compliant 16kHz PCM WAV base64 audio and MIME descriptors.
   - Acoustic and phonetic pronunciation evaluator (`evaluateSpeech`) providing granular phoneme-level scoring (e.g. Spanish alveolar trills /r/, pure vowels /a/, /e/, /o/, syntax cadence).
   - Server-authoritative progression engine: +5 XP per turn, +25 XP and +3 Gems per call completion, daily goal speaking minutes tracking, streak maintenance, and `FIRST_AI_VOICE_CALL` achievement unlock.
   - 9 new backend integration tests passing (69/69 total across 5 test suites).

2. **AI Voice Calling Mobile Experience (Flutter):**
   - Full-screen immersive call interface (`AIVoiceCallScreen`) with live call timer, character persona avatar, and dark glassmorphic styling.
   - Dynamic animated audio waveform orb (`_WaveformOrbPainter`) with multi-layer pulsating ambient waves reflecting listening, thinking, and speaking states.
   - Real-time phonetic feedback pill displaying live accuracy score and corrective pronunciation hints (e.g., alveolar trill guidance).
   - Full call control island: Mute/Unmute microphone, Speak utterance, Test "rr" phonetic trigger, and End call.
   - Gamified post-call debrief dialog (`AIVoiceCallDebriefDialog`) featuring circular progress meters for Pronunciation and Fluency, acoustic metrics (words per minute, speaking pace), XP/gem rewards, and achievement banner.
   - Seamless routing via `/ai-voice-call` and instant direct call triggers from `AITutorSelectionScreen` and `AIChatScreen`.
   - 6 new widget/unit tests passing; 0 issues on `flutter analyze`; all 35/35 mobile client tests passing.

---

## Phase 7 Detailed Deliverables (Immediate Next Milestone)
1. **AI Video Calling Backend Architecture & Avatar Pipeline:**
   - Video session signaling & lifecycle endpoints (`/api/v1/ai/video-calls/initiate`, `/turn`, `/end`, `/state`).
   - Avatar animation state machine engine supporting contextual facial emotion states:
     - `idle` / `neutral`: Gentle eye-blink and breathing loop.
     - `listening`: Engaged forward lean, nod, and active eye contact.
     - `thinking`: Thoughtful upward eye shift or subtle head tilt.
     - `speaking`: Lip-sync mouth phoneme shapes (visemes: A/I/U/E/O, consonants) matched to audio cadence.
     - `celebrating` / `encouraging`: Warm smile, enthusiastic nod upon high pronunciation scores.
   - Dynamic conversational difficulty scaffolding:
     - Automatic vocabulary simplification if user hesitation or low fluency is detected.
     - Visual aid card projection (e.g. flashcard prompt or picture prompt in video stream) when user asks for help.
   - Authoritative video call progression rewards (+35 XP, +5 Gems, `FIRST_AI_VIDEO_CALL` achievement, streak and speaking time).

2. **AI Video Calling Mobile Experience (Flutter):**
   - Immersive video call screen (`AIVideoCallScreen`) with split-view / picture-in-picture (PiP):
     - Large main viewport rendering the animated character avatar with smooth visual transitions between emotion & viseme states.
     - Floating user camera preview with flip camera, pause video, and mute toggles.
   - Live closed captions overlay with dual-language toggle (Spanish target subtitles + English assistive hints).
   - Interactive in-video visual aids overlay displaying situational context (e.g. café menu card when roleplaying ordering coffee).
   - Video call debrief dialog with visual performance breakdown, facial expression reaction replay, and rewards.

