# MAHMAS LANGUAGE — SECURITY POLICY & SPECIFICATION

> **Strict Rule:** Zero secrets, zero trust client authority, strict privacy isolation.

---

## 1. Secrets Management & Environment Isolation

1. **No Hard-Coded Secrets:**
   - Neither the Flutter client nor the backend source files may contain API keys, database credentials, or JWT signing keys.
   - All environment variables are loaded exclusively from `.env` (development) or cloud secret stores (production).
2. **Git Commit Shield:**
   - `.gitignore` rigorously ignores `.env`, keystores, private keys, certificates, and local credentials.
   - Pre-commit scanning is enforced to verify no token or private key patterns enter Git history.

---

## 2. Authentication & Session Security

1. **Password Hashing:**
   - Passwords must be hashed using `bcrypt` with a minimum cost factor of 12.
   - Passwords must never be logged, cached, or returned in API responses.
2. **JWT & Refresh Token Rotation:**
   - Access tokens are short-lived (15 minutes).
   - Refresh tokens are long-lived (7 days), stored securely in `DeviceSession` database table, and rotated upon every refresh request.
   - Reuse detection: If a revoked or previously used refresh token is presented, all sessions for that user are immediately invalidated.
3. **Mobile Storage Security:**
   - Sensitive tokens on Android are stored in `EncryptedSharedPreferences` / Android Keystore.
   - On iOS, tokens are stored in the Keychain.

---

## 3. Authoritative Server-Side Gamification (Anti-Cheat)

1. **Zero Client Trust:**
   - The Flutter client is treated as an untrusted rendering layer.
   - Clients never send XP, gems, hearts, or completed status flags directly to the backend.
2. **Answer Verification:**
   - Clients submit the raw answer chosen or written.
   - The backend exercise evaluator computes correctness, updates streaks, grants XP, and generates virtual currency transactions inside atomic database transactions.

---

## 4. Real-Time Communication & Privacy Preservation

1. **Complete Anonymity in Calling:**
   - Users are addressed solely by internal UUIDs.
   - Personal phone numbers, real emails, or physical locations are never exposed in WebRTC signaling or user profiles.
2. **TURN Authentication:**
   - TURN credentials are generated ephemerally with time-bounded tokens for active calls.
3. **Safety & Moderation Enforcement:**
   - When User A blocks User B, the backend instantly rejects all connection attempts, signaling messages, and discovery requests between them.

---

## 5. Role-Based Access Control (RBAC)

The system enforces strict RBAC across all administrative and content endpoints:
- `SUPER_ADMIN`: Full system configuration, database administration, payment management.
- `ADMIN`: User management, course approvals, moderation escalations.
- `CONTENT_MANAGER`: Language curricula, courses, units, lessons, and exercises management.
- `MODERATOR`: Report queue triage, user blocks, safety flags.
- `SUPPORT`: User account troubleshooting (read-only sensitive data access).
- `LEARNER`: Standard end-user permissions.
