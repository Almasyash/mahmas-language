# MAHMAS LANGUAGE — API CONTRACT & SPECIFICATION

> **API Version:** v1  
> **Base URL:** `/api/v1`  
> **Real-time Gateway:** `ws://localhost:4000/ws` (Production: `wss://api.mahmaslanguage.com/ws`)

---

## 1. Response Envelope Standard

All REST API responses adhere to a consistent JSON envelope:

### Success Response
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-10-01T00:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid password format",
    "details": [
      { "field": "password", "issue": "Minimum 8 characters required" }
    ]
  },
  "meta": {
    "timestamp": "2026-10-01T00:00:00.000Z"
  }
}
```

---

## 2. Authentication & Session Management

### 2.1 Register with Email & Password
- **Endpoint:** `POST /api/v1/auth/register`
- **Request Body:**
  ```json
  {
    "email": "learner@example.com",
    "password": "StrongPassword123!",
    "displayName": "Learner One"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "learner@example.com", "role": "LEARNER" },
      "tokens": {
        "accessToken": "jwt.bearer.token",
        "refreshToken": "secure.refresh.token",
        "expiresIn": 900
      }
    }
  }
  ```

### 2.2 Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Request Body:**
  ```json
  {
    "email": "learner@example.com",
    "password": "StrongPassword123!"
  }
  ```

### 2.3 Refresh Token Rotation
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Request Body:**
  ```json
  {
    "refreshToken": "secure.refresh.token"
  }
  ```

---

## 3. Onboarding & Profile

### 3.1 Complete Onboarding Preferences
- **Endpoint:** `POST /api/v1/onboarding/complete`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body:**
  ```json
  {
    "nativeLanguageId": "uuid-lang-en",
    "targetLanguageId": "uuid-lang-es",
    "learningGoal": "DAILY_CONVERSATION",
    "dailyMinutesGoal": 15,
    "currentLevel": "A1"
  }
  ```

---

## 4. Courses & Path Engine

### 4.1 Get Language Course Path
- **Endpoint:** `GET /api/v1/courses/:courseId/path`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "course": {
        "id": "uuid-course",
        "title": "Spanish Foundations",
        "sections": [
          {
            "id": "uuid-section",
            "title": "Section 1: Greetings & Basics",
            "units": [
              {
                "id": "uuid-unit",
                "title": "Unit 1: Hello & Goodbye",
                "lessons": [
                  {
                    "id": "uuid-lesson-1",
                    "title": "Lesson 1",
                    "xpReward": 15,
                    "isUnlocked": true,
                    "isCompleted": false
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }
  ```

---

## 5. Lessons & Authoritative Evaluation

### 5.1 Fetch Lesson Exercises
- **Endpoint:** `GET /api/v1/lessons/:lessonId/exercises`
- **Headers:** `Authorization: Bearer <accessToken>`

### 5.2 Submit Lesson Attempt (Authoritative Evaluation)
- **Endpoint:** `POST /api/v1/lessons/:lessonId/submit`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body:**
  ```json
  {
    "durationSec": 140,
    "answers": [
      {
        "exerciseId": "uuid-exercise-1",
        "userAnswer": "Hola, ¿cómo estás?",
        "timeSpentMs": 4500
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "isSuccessful": true,
      "score": 100,
      "xpAwarded": 15,
      "gemsAwarded": 2,
      "streak": { "currentStreak": 5, "isMaintained": true },
      "dailyGoal": { "targetXP": 30, "earnedXP": 30, "isCompleted": true },
      "mistakes": []
    }
  }
  ```

---

## 6. Real-Time WebRTC Calling Protocol (WebSocket)

All call signaling occurs over the authenticated WebSocket connection (`/ws`):

### 6.1 Call Lifecycle Events
1. **Invite Callee:**
   ```json
   { "event": "call:invite", "payload": { "targetUserId": "uuid-user-b", "callType": "HUMAN_AUDIO" } }
   ```
2. **Incoming Call Notification (Callee receives):**
   ```json
   { "event": "call:incoming", "payload": { "callId": "uuid-call", "callerId": "uuid-user-a", "callType": "HUMAN_AUDIO" } }
   ```
3. **Accept Call:**
   ```json
   { "event": "call:accept", "payload": { "callId": "uuid-call" } }
   ```
4. **Exchange SDP Offer / Answer:**
   ```json
   { "event": "call:signal:offer", "payload": { "callId": "uuid-call", "sdp": "..." } }
   { "event": "call:signal:answer", "payload": { "callId": "uuid-call", "sdp": "..." } }
   ```
5. **Exchange ICE Candidates:**
   ```json
   { "event": "call:signal:ice", "payload": { "callId": "uuid-call", "candidate": "..." } }
   ```
6. **End Call:**
   ```json
   { "event": "call:end", "payload": { "callId": "uuid-call", "reason": "USER_HANGUP" } }
   ```

---

## 7. Safety & Abuse Reporting

### 7.1 Block User
- **Endpoint:** `POST /api/v1/safety/block`
- **Request Body:** `{ "targetUserId": "uuid-user-to-block" }`

### 7.2 Report User
- **Endpoint:** `POST /api/v1/safety/report`
- **Request Body:**
  ```json
  {
    "reportedUserId": "uuid-user",
    "callId": "uuid-call-optional",
    "reason": "HARASSMENT",
    "details": "User exhibited inappropriate verbal behavior."
  }
  ```
