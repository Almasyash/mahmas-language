# MAHMAS LANGUAGE — SYSTEM ARCHITECTURE SPECIFICATION

> **Confidential & Proprietary Architecture Documentation**  
> **Target Platform:** Mobile (Flutter Android 10+ / iOS / Web) & Cloud Backend (Node.js TypeScript, PostgreSQL, Prisma, WebRTC)

---

## 1. High-Level Architecture Overview

Mahmas Language is architected as an integrated language-learning super-ecosystem combining:
1. Structured, path-based pedagogical curriculum
2. Authoritative gamified learning engine
3. Vendor-agnostic AI conversation tutor (Voice, Text, Video representation)
4. Peer-to-peer real-time human communication (Audio, Video, Language Exchange)
5. Safety, moderation, and granular role-based administrative control

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Flutter Client (Mobile / Web)                   │
│  - Configurable Branding Engine (Theme / Typography / Assets)          │
│  - Feature Modules (Lessons, Practice, AI Call, Human Call, Exchange)  │
│  - Core Services (Network, Auth, Storage, WebRTC, Audio Engine)        │
└───────────────────▲──────────────────────────────▲─────────────────────┘
                    │ HTTPS / REST                 │ WebSocket (WSS)
                    │ (JWT Auth)                   │ (Signaling & Events)
┌───────────────────▼──────────────────────────────▼─────────────────────┐
│                 Node.js / TypeScript Application Gateway                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Security Guards: JWT, Refresh Rotation, RBAC, Rate Limiting      │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Modular Domains: Auth, Courses, Lessons, Gamification, Social    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Real-Time Subsystems: WebRTC Signaling Engine, Presence Hub      │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ AI Provider Adapter Layer (Gemini / Anthropic / OpenAI / Mock)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────┬──────────────────────┬───────────────┘
               │                  │                      │
┌──────────────▼──────┐  ┌────────▼──────────┐  ┌────────▼──────────────┐
│ PostgreSQL + Prisma │  │ S3-Compatible Blob│  │ STUN / TURN Relay     │
│ - Relational Data   │  │ - Lesson Audio    │  │ - P2P WebRTC Fallback │
│ - Strict Schema     │  │ - User Media      │  │ - Media Traversal     │
│ - Decimal Currency  │  │ - Pronunciation   │  │                       │
└─────────────────────┘  └───────────────────┘  └───────────────────────┘
```

---

## 2. Mobile Client Architecture (Flutter)

The mobile application follows Clean Modular Architecture with strict separation of concerns and configurable branding.

### 2.1 Directory Structure
```
mobile/lib/
├── core/
│   ├── config/          # Dynamic Brand Config, Environment, API Endpoints
│   ├── theme/           # Material 3 Light/Dark Themes, ColorTokens, Typography
│   ├── routing/         # Declarative Routing, Navigation Guards, Deep Links
│   ├── network/         # Http Client, Interceptors, Retry Policies, Error Mapping
│   ├── storage/         # Secure Key-Value Storage (Tokens, Cache)
│   ├── auth/            # Auth Controller, Session State, User Context
│   ├── models/          # Shared Domain DTOs and Primitives
│   ├── services/        # Service Locator, Device Sensors, Audio Player/Recorder
│   └── repositories/    # Base Repository Interfaces & Network Caches
└── features/
    ├── onboarding/      # Flow: Goals, Placement, Native/Target Language
    ├── home/            # Dashboard, Daily Loop, Quick Actions
    ├── courses/         # Tree/Path Course Navigation, Section & Unit Views
    ├── lessons/         # Interactive Lesson Player, Multi-Exercise Engine
    ├── speaking/        # Audio Capture, Speech Recognition Interface
    ├── listening/       # Dictation & Audio Comprehension Tasks
    ├── reading/         # Reading Passages & Comprehension Checks
    ├── writing/         # Freeform Writing & Grammar Review
    ├── vocabulary/      # Spaced Repetition (SRS) Flashcards & Word Bank
    ├── practice/        # Weak Skills, Mistakes Review, Speed Drills
    ├── ai_tutor/        # Conversational Chatbot with Pedagogical Scaffolding
    ├── ai_call/         # Real-time Voice Call with AI Tutor
    ├── ai_video_call/   # Avatar-based AI Video Interaction
    ├── human_audio_call/# WebRTC Audio Calling between Learners
    ├── human_video_call/# WebRTC Video Calling with Camera Controls
    ├── language_exchange/# Matching, Discovery, Language Swap Preferences
    ├── profile/         # User Stats, Badges, Level, Activity Heatmap
    ├── leaderboard/     # Tiered Leagues, Weekly XP Rankings
    ├── quests/          # Daily Quests & Weekly Challenges
    ├── achievements/    # Milestones & Unlockables
    ├── shop/            # Virtual Currency, Heart Refills, Streak Freezes
    ├── subscriptions/   # Tier Upgrades (Free, Plus, Pro)
    ├── notifications/   # Push and In-App Notifications
    ├── settings/        # Preferences, Language Switcher, Audio Settings
    └── safety/          # User Reporting, Blocking, Privacy Settings
```

### 2.2 Configurable Branding Engine
Branding is decoupled from application logic:
- `AppBrandConfig`: Holds brand name, logos, illustrations, default typography, and theme accents.
- Themes can be replaced via configuration files without altering widgets or business logic.

---

## 3. Backend Architecture (Node.js & TypeScript)

A modular, testable backend architecture built with TypeScript and Express/NestJS conventions:
```
backend/
├── prisma/
│   └── schema.prisma       # Comprehensive PostgreSQL Database Model
└── src/
    ├── common/             # Result types, custom errors, pagination, utilities
    ├── config/             # Typed environment parsing & validation
    ├── database/           # Prisma client singleton & connection pooling
    ├── guards/             # AuthGuard, RolesGuard, RateLimitGuard
    ├── middleware/         # Logging, CORS, Error handling, Request validation
    ├── websocket/          # WebSocket Gateway & WebRTC Signaling Hub
    └── modules/
        ├── auth/           # Login, Register, Google OAuth, Refresh Rotation
        ├── users/          # User Profiles, Settings, Preferences
        ├── languages/      # Supported Languages & CEFR Levels (A1-C2)
        ├── courses/        # Course Catalog & Section Hierarchy
        ├── units/          # Unit Organization & Prerequisites
        ├── lessons/        # Lesson Orchestration & Verification
        ├── exercises/      # Exercise Evaluator (Multi-choice, Arrange, Fill, etc.)
        ├── progress/       # User Progress Tracking & Course State
        ├── vocabulary/     # Word Bank, SRS scheduling, Mastery level
        ├── pronunciation/  # Phoneme & Pronunciation scoring
        ├── ai/             # Vendor-Agnostic AI Tutor Engine & Memory
        ├── calls/          # Call Session Management & History
        ├── language-exchange/ # Matching Algorithm & Preference Broker
        ├── social/         # Friends, Follows, Activity Feeds
        ├── notifications/  # Notification Dispatcher & Queue
        ├── subscriptions/  # Entitlements & Subscription Tiers
        ├── achievements/   # Achievement Evaluation Engine
        ├── leaderboard/    # League Computation & XP aggregation
        ├── shop/           # Virtual Store, Currency Transactions
        ├── moderation/     # Abuse Reporting, Block Engine, Content Filter
        └── admin/          # RBAC Dashboard API
```

---

## 4. Real-Time Communication Architecture (WebRTC)

### 4.1 Signaling Flow
1. **Initiation**: User A initiates a call via WebSocket message `call:invite` with target User B ID.
2. **Presence & State Check**: Backend verifies User B is online, not busy, and neither user has blocked the other.
3. **Offer / Answer Exchange**:
   - User A sends SDP Offer over WebSocket.
   - User B accepts and returns SDP Answer.
4. **ICE Candidate Exchange**: ICE candidates relayed through backend WebSocket signaling gateway.
5. **STUN/TURN Fallback**: If symmetric NAT or strict firewall prevents direct P2P, traffic relays through TURN servers.
6. **Anonymity Guarantee**: IP addresses are never mapped to phone numbers or real-world identities. All identities use internal UUIDs.

---

## 5. AI Tutor & Provider Abstraction Layer

The system decouples business logic from external AI vendors:
```
                    ┌─────────────────────────┐
                    │    AITutorService       │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     IAIProviderAdapter   │
                    └────────────┬────────────┘
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐    ┌─────────▼────────┐    ┌─────────▼────────┐
│ GeminiAdapter   │    │  OpenAIAdapter   │    │   MockAdapter    │
│ (Text, STT, TTS)│    │  (GPT-4o, TTS)   │    │   (Offline/Test) │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

- **Pedagogical Scaffolding**: Prompts inject user CEFR level, target language, native language, recent mistakes, and current lesson vocabulary.
- **Adaptive Feedback**: Corrections are stored as structured mistakes and delivered post-utterance to maintain speaking flow.

---

## 6. Authoritative Server-Side Gamification Economy

To prevent fraud and preserve fair competition:
- **Zero Client Trust**: Clients submit exercise interaction answers, never raw XP or currency increments.
- **Answer Verification**: The backend evaluates answers, calculates combo multipliers, updates streaks, and commits XP transactions atomically inside database transactions.
- **Heart / Energy Refill**: Refill timers are calculated strictly from server timestamps (`lastHeartRefillAt`).
