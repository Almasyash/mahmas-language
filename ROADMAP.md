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
| **Phase 7** | **AI Video Calling** | Animated avatar synchronization, facial expression state machine, live captions, conversational difficulty adaptation. | **COMPLETED** |
| **Phase 8** | **Language Exchange** | Mutual interest & complementary language matching, tandem partner discovery. | *Next* |
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

## Phase 7 Accomplishments (Delivered)
1. **AI Video Calling Backend Architecture & Avatar Pipeline:**
   - Full server lifecycle endpoints: `/api/v1/ai/video-calls/initiate`, `/video-calls/:id/turn`, `/video-calls/:id/end`, and `/video-calls/:id`.
   - Procedural facial emotion state machine (`happy`, `encouraging`, `thoughtful`, `celebrating`, `neutral`) and dynamic lip-sync mouth phoneme viseme generation (`aa`, `ee`, `oo`, `ch`, `ff`, `rest`).
   - Contextual visual aid cues & scenario props generator (`getSceneVisualAid`) providing Café menus, metro transit maps, airport boarding passes, and dynamic grammatical help flashcards with interactive target vocabulary.
   - Authoritative gamified progression rewards (+7 XP/turn, +35 XP and +5 Gems completion, daily goal activity time increment, streak updates, `FIRST_AI_VIDEO_CALL` achievement unlock, and `quest-ai-video` progress).
   - 9 new backend integration tests passing (78/78 total across all 6 test suites).

2. **AI Video Calling Mobile Client (Flutter):**
   - Full-screen immersion screen (`AIVideoCallScreen`) with ambient radial scene backdrop, active call timer, scenario header, and HD 60FPS stream indicator.
   - Procedural 2D animated avatar canvas (`AIVideoAvatarWidget`) with idle breathing, eye-blinking loop, eyebrow tilts, blush, mouth viseme animations, and emotion pills.
   - Draggable floating user camera Picture-in-Picture (PiP) card with front/back camera flip, pause/resume video toggle, and mic mute status.
   - Dual closed captions overlay with target Spanish text, last spoken utterance transcription, phonetic pronunciation tip pill, and toggleable English hints (`EN HINT` / `ES ONLY`).
   - Contextual visual aid card overlay (e.g. Café Menú Madrid) with tap-to-speak interactive target vocabulary tags.
   - Control island: Mic mute/unmute, Camera on/off, Ask hint/prop toggle, Push-to-Talk utterance button, Flip camera, and End Call.
   - Post-call debrief dialog (`AIVideoCallDebriefDialog`) with tri-meter visual gauges (Pronunciation Accuracy, Fluency, Visual Focus), acoustic metrics, XP/gem rewards, and achievement unlocks.
   - Route registration (`/ai-video-call`) and one-tap video calling triggers in `AITutorSelectionScreen` and `AIChatScreen`.
   - 10 new widget/unit tests passing; `flutter analyze` reports 0 issues; all 45/45 mobile client tests passing!

---

## Phase 8 Detailed Deliverables (Immediate Next Milestone)
1. **Language Exchange Matching & Tandem Discovery Engine:**
   - Native language vs. target language bidirectional matching algorithm.
   - Exchange partner profile directory with proficiency badges, interests, and availability status.
   - Tandem partner invitations, request acceptance/rejection, and mutual language agreement.
2. **Text & Voice Exchange Messaging:**
   - Real-time exchange messaging with in-chat message translation, inline corrections, and voice audio notes.
   - Built-in pedagogical correction tools (inline typo, grammar, and natural phrasing suggestions).
3. **Exchange Gamification:**
   - Tandem study streaks, mutual practice XP, community helpfulness karma points, and language exchange quests.
