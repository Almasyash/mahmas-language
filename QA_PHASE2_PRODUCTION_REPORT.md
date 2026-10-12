# Speakly_FS — Phase 2: Production DNS Repair, API Failover & Release Verification Report

**Document Date:** October 12, 2026  
**Auditor:** Antigravity Deep QA Agent  
**Repository:** `https://github.com/FS-Groupz/Speakly_FS.git`  
**Branch:** `main`  
**Starting Commit:** `e866867`  
**Ending Commit:** `81af6e6`  
**Primary Endpoint:** `https://speakly.fsgroupz.com/api/v1`  
**Fallback Endpoint:** `https://speakly-fs.onrender.com/api/v1`  
**AI Model:** `gemini-2.5-flash`  

---

## 1. Executive Summary

Phase 2 verified the production infrastructure, diagnosed the primary endpoint failure with concrete network telemetry, audited cross-endpoint database consistency, implemented a comprehensive 12-scenario API failover automated test suite, performed live cloud smoke testing, and hardened the AI provider fallback metadata.

### Verification Matrix Summary:
* **Primary Endpoint Probe:** **FAIL** (HTTP 403 Forbidden — Cloudflare Error 1000).
* **Fallback Endpoint Probe:** **PASS** (HTTP 200 OK — Render + Neon PostgreSQL, 12 languages, 903ms latency).
* **Cross-Endpoint DB Consistency:** **BLOCKED** (Pending cPanel deployment with shared Neon DB cluster).
* **Automated API Failover Tests:** **PASS** (12 / 12 test scenarios passed in `mobile/test/api_failover_test.dart`).
* **Live Smoke Test (Render):** **PASS** (Registration, onboarding, profile, course resolution, progress, logout, login).
* **AI Provider Resilience:** **PASS** (Transparent fallback metadata; 5/5 failure scenarios handled).
* **Physical Android Device:** **BLOCKED** (0 devices currently attached in ADB; APK binary verified).
* **Backend Automated Tests:** **78 / 78 PASSED (100%)** across 6 suites; TypeScript build clean.
* **Flutter Automated Tests:** **57 / 57 PASSED (100%)** (45 existing + 12 new failover tests).
* **Flutter Static Analysis:** **0 issues found** (`flutter analyze` clean in 3.9s).
* **Release APK:** `mobile/build/app/outputs/flutter-apk/app-release.apk` (51.1 MB, verified fresh build).

---

## 2. Primary Endpoint Failure Diagnosis & DNS Telemetry

### 2.1 Live Reproduction Evidence
* **Request:** `GET https://speakly.fsgroupz.com/api/v1/health`
* **Response Status:** `HTTP/1.1 403 Forbidden`
* **Server Header:** `cloudflare`
* **Cloudflare Ray ID:** `a4965748e9e1e288-MRS`
* **Page Title:** `<title>DNS points to prohibited IP | speakly.fsgroupz.com | Cloudflare</title>`
* **Cloudflare Error Code:** **Error 1000**

### 2.2 Root Cause Analysis
1. **DNS Resolution:**
   * `speakly.fsgroupz.com` resolves via Cloudflare Anycast to `172.67.148.202` and `104.21.79.210`.
   * The apex domain `fsgroupz.com` also resolves via Cloudflare Anycast to the same IP addresses.
2. **Origin Hosting Telemetry:**
   * Probing `https://fsgroupz.com/` returns `HTTP 200 OK` with headers:
     * `platform: hostinger`
     * `panel: hpanel`
     * `x-turbo-charged-by: LiteSpeed`
     * `x-powered-by: PHP/8.3.35`
   * This proves the hosting account is active on **Hostinger (hPanel / LiteSpeed)**.
3. **The Defect:**
   * Cloudflare Error 1000 triggers exclusively when the origin IP configured in Cloudflare's DNS table is:
     * A Cloudflare Anycast IP address (pointing back at Cloudflare in a proxy loop).
     * An internal or loopback IP (`127.0.0.1`, `0.0.0.0`, or RFC1918 private subnet).
     * An invalid CNAME loop.

### 2.3 Required Manual Control Panel Actions
Because DNS and hosting credentials are not stored in this repository, the following actions must be performed by the domain administrator in the Cloudflare Dashboard:

1. **Log in to Cloudflare Dashboard** (`dash.cloudflare.com`).
2. Select the zone: **`fsgroupz.com`**.
3. Navigate to **DNS &rarr; Records**.
4. Locate the record for name: **`speakly`** (or `speakly.fsgroupz.com`).
5. **Inspect the Target / IP address:**
   * If it is currently set to `127.0.0.1` or `104.21.x.x` or `172.67.x.x`, replace it with the **actual public IP of your Hostinger server**.
   * To find the Hostinger server IP: Log in to Hostinger hPanel &rarr; Hosting &rarr; Manage &rarr; **Server Details &rarr; IP Address**.
6. Ensure the proxy status toggle is set to **Proxied (Orange Cloud)**.
7. Under **SSL/TLS &rarr; Overview**, ensure the encryption mode is set to **Full** or **Full (strict)**.
8. Retest with `curl.exe -I https://speakly.fsgroupz.com/api/v1/health`.

---

## 3. Fallback Endpoint & Database Verification

### 3.1 Live Probe Telemetry (Render)
* **Probe Timestamp:** `2026-10-12T13:10:11.383Z`
* **Health URL:** `https://speakly-fs.onrender.com/api/v1/health`
* **HTTP Status:** `200 OK`
* **Response Latency:** `903 ms`
* **Payload:**
  ```json
  {
    "success": true,
    "data": {
      "status": "UP",
      "appName": "Speakly_FS Platform",
      "environment": "production",
      "database": {
        "status": "CONNECTED",
        "connection": "postgresql://neondb_owner:****@ep-snowy-mouse-b3il1o8d-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        "languageCount": 12,
        "error": null
      }
    }
  }
  ```
* **Languages URL:** `https://speakly-fs.onrender.com/api/v1/languages`
* **HTTP Status:** `200 OK`
* **Response Latency:** `648 ms`
* **Language Count:** `12` languages verified (Arabic, English, French, German, Hindi, Italian, Japanese, Korean, Mandarin, Portuguese, Russian, Spanish).

---

## 4. Cross-Endpoint Database Consistency Audit

* **Status:** **BLOCKED** (Until cPanel deployment is executed with the shared database cluster).
* **Risk Explanation:**
  * Render connects to the production Neon PostgreSQL cluster (`ep-snowy-mouse-b3il1o8d-pooler.c-4.ap-southeast-1.aws.neon.tech`).
  * If the cPanel Node.js application is configured with a local database (`localhost:5432`) as indicated in early boilerplate, a user registering while on Render will not exist when failing over to cPanel, and vice-versa.
  * Lesson completion, streak counts, and XP balances would experience split-brain desynchronization.
* **Remediation Action Applied:**
  * Updated `public_html_speakly_api/CPANEL_DEPLOY_GUIDE.md` (Step 3) to mandate that the cPanel `.env` must use the same Neon PostgreSQL `DATABASE_URL` cluster connection string.

---

## 5. Mobile Failover Audit & Automated Test Results

### 5.1 Architecture Inspection (`mobile/lib/core/network/api_client.dart`)
1. **Primary First:** All requests target `AppConfig.defaultApiBaseUrl` (`https://speakly.fsgroupz.com/api/v1`) by default.
2. **Trigger Conditions:** Fallback is triggered only on network failures, socket timeouts, Cloudflare 403 blocks, 404 route missing, or 5xx server errors.
3. **Application Error Protection:** Validation errors (`400 Bad Request`) do NOT trigger fallback, preventing application error masking.
4. **Bounded Retries:** The recursive call is invoked with `allowFallback: false`, strictly capping retries to at most 1 attempt per endpoint (2 requests total).
5. **Token Refresh Guard:** `_attemptTokenRefresh()` uses `_isRefreshing` and `Completer<bool>` to deduplicate concurrent refresh requests and avoid infinite loops.

### 5.2 Automated Failover Test Suite (`mobile/test/api_failover_test.dart`)
All 12 required scenarios were implemented and verified with automated test assertions:

| Test ID | Scenario | Verification Details | Result |
| :--- | :--- | :--- | :---: |
| **FO-01** | Primary endpoint succeeds | Primary returns 200, fallback calls = 0, baseUrl unchanged | **PASS** |
| **FO-02** | Primary fails (403/500/network) | Primary returns 403 Cloudflare block, switches to fallback, returns 200 | **PASS** |
| **FO-03** | Primary times out | Primary throws `TimeoutException`, switches to fallback, returns 200 | **PASS** |
| **FO-04** | Both endpoints fail | Both return 503, returns `ApiResponse(success: false)`, no crash | **PASS** |
| **FO-05** | Primary returns 400 validation error | Primary returns 400 with validation message; fallback NOT called | **PASS** |
| **FO-06** | Primary returns 401 auth error | Token refreshed once, retried with fresh token, succeeds without loop | **PASS** |
| **FO-07** | Fallback returns unexpected HTML error | Fallback returns 502 HTML, parsed gracefully into typed `ApiResponse` | **PASS** |
| **FO-08** | Compatible language catalogues | Verified UTF-8 flag emojis and JSON structure match on both endpoints | **PASS** |
| **FO-09** | Credentials preserved on failover | `Authorization: Bearer <jwt>` verified present on both primary and fallback attempts | **PASS** |
| **FO-10** | Retries strictly bounded | Connection exception on both triggers exactly 2 total calls (1 primary + 1 fallback) | **PASS** |
| **FO-11** | Token refresh loop prevention | Revoked refresh token returns 401 cleanly, triggers `onAuthExpired`, 0 loop | **PASS** |
| **FO-12** | User-facing network error | Timeouts produce friendly user message (`Network timeout...`) without stack traces | **PASS** |

---

## 6. Live Production Authentication & Language Smoke Tests

Executed against the live Render production backend (`https://speakly-fs.onrender.com/api/v1`):

| Step | Operation | Endpoint | Status | Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **1** | User Registration | `POST /api/v1/auth/register` | **PASS** | HTTP 201 Created, received valid JWT accessToken |
| **2** | Onboarding Setup | `POST /api/v1/users/me/onboarding` | **PASS** | HTTP 200 OK, saved Native: Hindi (`hi`), Target: English (`en`) |
| **3** | Profile Retrieval | `GET /api/v1/users/me/profile` | **PASS** | HTTP 200 OK, verified `targetLanguage.code == 'en'` |
| **4** | Course Resolution | `GET /api/v1/courses/default/path` | **PASS** | HTTP 200 OK, resolved `course-en-a1` (*English Foundations*) |
| **5** | Progress Check | `GET /api/v1/progression/xp` | **PASS** | HTTP 200 OK, initial `totalXp == 0` |
| **6** | Session Logout | `POST /api/v1/auth/logout` | **PASS** | HTTP 200 OK, session revoked |
| **7** | Re-login | `POST /api/v1/auth/login` | **PASS** | HTTP 200 OK, re-authenticated cleanly with fresh tokens |

---

## 7. AI Provider Resilience Hardening

### 7.1 Architecture & Production Safety Hardening
* **Issue Addressed:** Previous fallback behavior in `GeminiAIProviderAdapter` silently returned synthetic educational answers without indicating whether the response came from Google Gemini or the local pedagogical fallback.
* **Hardening Implemented:**
  * Extended `AIResponsePayload` with `isFallback?: boolean` and `provider?: string`.
  * When Gemini succeeds: returns `{ isFallback: false, provider: 'gemini' }`.
  * When Gemini fails (429 rate limit, 503 service unavailable, timeout, malformed JSON): returns `{ isFallback: true, provider: 'mock-pedagogical-fallback' }`.
  * API keys remain strictly server-side in `backend/.env`.
  * Default model preserved as `gemini-2.5-flash`.
* **Failure Test Suite (`backend/test/test_ai_provider_failures.ts`):** 5/5 failure scenarios verified:
  1. Invalid API key / 400 / 403 &rarr; PASS
  2. Unreachable model / host &rarr; PASS
  3. Malformed JSON response &rarr; PASS
  4. Empty candidate array &rarr; PASS
  5. Provider 500 / 429 rate limit &rarr; PASS

---

## 8. Physical Android Device Inspection

* **ADB Probe:** `& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices`
* **Status:** **BLOCKED**
* **Finding:** No physical device or emulator is currently connected to the local USB/ADB daemon.
* **Build Verification:**
  * File: `mobile/build/app/outputs/flutter-apk/app-release.apk`
  * Size: `53,618,182` bytes (51.1 MB)
  * Build Timestamp: October 12, 2026 6:33:34 PM (freshly compiled).

---

## 9. Final Regression Suite

* **Backend Test Suite:** `npm test` &rarr; **78 / 78 passed (100%)** across 6 suites.
* **Backend Build:** `npm run build` &rarr; Prisma generate + DB sync + TypeScript `tsc` completed with code 0.
* **Flutter Analyze:** `flutter analyze` &rarr; **0 issues found** (clean).
* **Flutter Test Suite:** `flutter test` &rarr; **57 / 57 passed (100%)** across 8 test suites.

---

## 10. Final Verdict

**PASS — VERIFIED FOR THE TESTED SCOPE**

The application failover mechanism is fully proven, automated regression tests are 100% green, AI fallback transparency is hardened, and live cloud smoke testing is successful. Primary endpoint recovery depends solely on the external Cloudflare DNS record update documented in Section 2.3.
