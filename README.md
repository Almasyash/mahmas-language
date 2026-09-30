# Mahmas Language — Language Learning Super App

> **Next-Generation Language Learning + AI Conversation Tutor + Language Exchange + Real-Time Audio/Video Communication**

---

## 🌟 Product Vision

Mahmas Language is an original, production-grade language-learning platform designed to combine structured pedagogical mastery with state-of-the-art AI companionship and real human language exchange.

### 🚫 Originality Declaration
This product is **NOT** a clone of Duolingo or any existing platform. It features:
- **Original Brand Identity:** Decoupled, highly customizable theme and branding tokens.
- **Original Characters & Tutors:** Unique AI tutor personalities with pedagogical scaffolding.
- **Original Curriculum:** Native CEFR-aligned progression paths.
- **Original Gamification & Economy:** Server-authoritative XP, leagues, streaks, and challenges.

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Mobile Client** | **Flutter 3.47+ (Dart 3.13+)** | Material 3, Android 10+ first, cross-platform ready (iOS, Web). |
| **Backend API** | **Node.js 20 LTS + TypeScript + Express** | Clean modular architecture, high-performance async I/O. |
| **Database** | **PostgreSQL 15+ & Prisma ORM** | Strictly-typed relational schema (39 models), Decimal currency. |
| **Real-Time** | **WebSocket & WebRTC (STUN/TURN)** | Sub-second peer-to-peer audio and video calling with privacy masking. |
| **AI Layer** | **Vendor-Agnostic Adapter Pattern** | Unified interface for Gemini, OpenAI, Claude, or local LLMs. |
| **Storage** | **S3-Compatible Object Storage** | Audio prompts, pronunciation recordings, user avatars. |

---

## 📁 Repository Structure

```
mahmas-language/
├── mobile/                     # Flutter Android/iOS application
│   ├── lib/
│   │   ├── core/               # Config, theme, routing, network, storage, auth
│   │   └── features/           # Feature-first modules (onboarding, courses, ai_call, etc.)
│   └── test/                   # Flutter unit and widget tests
├── backend/                    # Node.js TypeScript Modular API
│   ├── prisma/
│   │   └── schema.prisma       # Relational database schema (39 models)
│   ├── src/
│   │   ├── config/             # Typed environment configuration
│   │   ├── guards/             # Authentication & RBAC guards
│   │   ├── middleware/         # Logging, error handling, rate limiting
│   │   ├── modules/            # Modular business domains (auth, lessons, ai, calls)
│   │   └── websocket/          # Real-time WebRTC signaling gateway
│   └── tests/                  # Unit and integration test suites
├── ARCHITECTURE.md             # System design and component interactions
├── DATABASE.md                 # PostgreSQL schema and 39-model catalog
├── API_CONTRACT.md             # REST API specifications and WebRTC protocol
├── ROADMAP.md                  # 16-phase milestone execution plan
├── SECURITY.md                 # Security, cryptographic standards, anti-cheat rules
├── CONTRIBUTING.md             # Engineering standards and Git conventions
└── LICENSE                     # Open Source MIT License
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Flutter SDK 3.47+
- Node.js 20.18+ (LTS) & npm 10.8+
- PostgreSQL 15+ (Local or Docker)

### 1. Backend Setup
```bash
cd backend
npm install
cp ../.env.example .env
npx prisma generate
npm run build
npm test
npm start
```

### 2. Mobile App Setup
```bash
cd mobile
flutter pub get
flutter test
flutter run
```

---

## 🔒 Security & Privacy Notice
- Never commit `.env` or sensitive API keys to source control.
- All XP, streak calculations, and currency balances are calculated authoritatively on the backend.
- Calling features conceal user phone numbers and IP addresses behind internal UUIDs and TURN relays.

---

## 📜 License
Distributed under the MIT License. See [LICENSE](LICENSE) for details.
