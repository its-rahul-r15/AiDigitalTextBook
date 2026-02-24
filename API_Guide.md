# 📖 Aronation Notes — API Testing Guide

> **Base URL:** `http://localhost:8000/api/v1`
> **Auth:** Sab protected routes mein ye header bhejo → `Authorization: Bearer <accessToken>`

---

## ⚡ Quick Start (Pehle ye 3 kaam karo)

```
1. npm run dev       ← server start karo
2. Register karo     ← neeche dekho
3. Login karo        ← accessToken milega → woh baaki sab mein use karo
```

---

## 🔐 Auth Routes

### 1. Register — `POST /auth/register`

**Bhejo:**
```json
{
  "fullName": "Rahul Sharma",
  "email": "rahul@test.com",
  "password": "Test@1234",
  "role": "student"
}
```
> `role` can be: `student` | `teacher` | `admin`

**Milega (success):**
```json
{
  "statusCode": 201,
  "data": {
    "user": { "_id": "abc123", "fullName": "Rahul Sharma", "email": "rahul@test.com", "role": "student" },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "message": "User registered successfully"
}
```

---

### 2. Login — `POST /auth/login`

**Bhejo:**
```json
{
  "email": "rahul@test.com",
  "password": "Test@1234"
}
```

**Milega:**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": { "_id": "abc123", "fullName": "Rahul Sharma", "role": "student" }
  },
  "message": "Login successful"
}
```
> ⚠️ `accessToken` copy karo — baaki sab routes mein `Authorization: Bearer <token>` lagega

---

### 3. Get Profile — `GET /auth/me`

**Header:** `Authorization: Bearer <token>`
**Body:** kuch nahi

**Milega:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "abc123", "fullName": "Rahul Sharma",
    "email": "rahul@test.com", "role": "student",
    "xp": 0, "currentStreak": 0
  }
}
```

---

### 4. Update Profile — `PATCH /auth/me`

**Bhejo:**
```json
{
  "fullName": "Rahul Kumar",
  "languagePreference": "hi"
}
```

---

### 5. Logout — `POST /auth/logout`
Header lagao, body kuch nahi.

---

## 📚 Content Routes

> **Note:** Pehle Admin se Course → Chapter → Concept banao, phir Student routes test karo.

### 1. Create Course (Admin) — `POST /content/courses`

**Bhejo:**
```json
{
  "title": "Class 10 Mathematics",
  "subject": "Mathematics",
  "grade": 10,
  "board": "CBSE",
  "language": "en",
  "isPublished": true
}
```

**Milega:**
```json
{
  "statusCode": 201,
  "data": { "_id": "course123", "title": "Class 10 Mathematics", "grade": 10, "board": "CBSE" },
  "message": "Course created successfully"
}
```
> 💾 `data._id` save karo — ye `courseId` hai, Chapter banane mein lagega

---

### 2. Create Chapter (Admin) — `POST /content/chapters`

**Bhejo:**
```json
{
  "courseId": "course123",
  "title": "Real Numbers",
  "orderIndex": 1,
  "isOfflineAvailable": true
}
```

**Milega:**
```json
{
  "statusCode": 201,
  "data": { "_id": "chapter123", "title": "Real Numbers", "courseId": "course123" }
}
```

---

### 3. List Courses (Student) — `GET /content/courses`

**Milega:**
```json
{
  "statusCode": 200,
  "data": [
    { "_id": "course123", "title": "Class 10 Mathematics", "grade": 10, "board": "CBSE" }
  ]
}
```

---

### 4. Search Content — `GET /content/search?q=fractions`

**Milega:**
```json
{
  "statusCode": 200,
  "data": {
    "results": [
      { "_id": "concept456", "title": "Fractions & Decimals", "difficulty": 2 }
    ],
    "total": 1
  }
}
```

---

### 5. Save Highlight (AI Dummy) — `POST /content/highlight`

**Bhejo:**
```json
{
  "conceptId": "concept456",
  "chapterId": "chapter123",
  "highlightedText": "Every composite number can be expressed as a product of primes."
}
```

**Milega (AI dummy response):**
```json
{
  "statusCode": 201,
  "data": {
    "_id": "note789",
    "highlightedText": "Every composite number...",
    "summary": "[AI NOTES — DUMMY] Summary of your highlight: ...\n• Point 1: Key idea\n• Point 2: Supporting detail",
    "flashcards": []
  },
  "message": "Highlight saved and summary generated"
}
```
> 🤖 Real AI connect hone ke baad asli summary aayegi

---

## 🤖 AI Tutor Routes (Sab DUMMY mode mein hain)

### 1. Ask Tutor — `POST /tutor/ask`

**Bhejo:**
```json
{
  "question": "Why is square root of 2 irrational?",
  "conceptId": "concept456"
}
```

**Milega:**
```json
{
  "statusCode": 200,
  "data": {
    "answer": "[AI TUTOR — DUMMY] Your question: \"Why is square root of 2 irrational?\"\nThis is a placeholder response for concept: \"Real Numbers\".\nTo enable real AI answers, follow steps in aiTutor.service.js."
  }
}
```

---

### 2. Explain Concept — `POST /tutor/explain`

**Bhejo:**
```json
{
  "conceptId": "concept456",
  "mode": "analogy"
}
```
> `mode` options: `visual` | `story` | `steps` | `analogy`

---

### 3. Translate — `POST /tutor/translate`

**Bhejo:**
```json
{
  "conceptId": "concept456",
  "targetLanguage": "hi"
}
```

---

## ✏️ Exercise Routes

### 1. Generate Question (AI Dummy) — `GET /exercises/generate`

```
GET /exercises/generate?conceptId=concept456&difficulty=3&type=mcq
```
> `type` options: `mcq` | `fill-blank` | `step-based` | `open`
> `difficulty`: 1 (easy) → 5 (very hard)

**Milega:**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "ex001",
    "type": "mcq",
    "difficulty": 3,
    "question": "[DUMMY] What is the main idea of \"Real Numbers\"?",
    "options": ["Option A (correct)", "Option B", "Option C", "Option D"],
    "solution": "This is the dummy solution. AI will generate a real one.",
    "isAiGenerated": true
  }
}
```
> 💾 `data._id` ko `exerciseId` ke roop mein save karo

---

### 2. Submit Answer — `POST /exercises/submit`

**Bhejo:**
```json
{
  "exerciseId": "ex001",
  "answer": "Option A (correct)",
  "timeTaken": 45,
  "hintsUsed": 0,
  "retriesCount": 0,
  "mode": "learning"
}
```
> `timeTaken` seconds mein

**Milega (correct answer):**
```json
{
  "statusCode": 200,
  "data": {
    "isCorrect": true,
    "score": 100,
    "attempt": { "_id": "log001", "isCorrect": true, "timeTaken": 45 }
  },
  "message": "Correct! Well done!"
}
```

**Milega (wrong answer):**
```json
{
  "statusCode": 200,
  "data": { "isCorrect": false, "score": 0 },
  "message": "Not quite right. Try again!"
}
```

---

### 3. Get Hint — `POST /exercises/hint`

**Bhejo:**
```json
{
  "exerciseId": "ex001",
  "stepNumber": 0
}
```

**Milega:**
```json
{
  "statusCode": 200,
  "data": { "hint": "[DUMMY HINT] Think about the core concept." }
}
```

---

### 4. Attempt History — `GET /exercises/history`

```
GET /exercises/history?conceptId=concept456&limit=20
```

**Milega:**
```json
{
  "data": {
    "attempts": [
      { "_id": "log001", "isCorrect": true, "score": 100, "timeTaken": 45, "createdAt": "2026-02-22T..." }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

### 5. Batch Generate (Teacher) — `POST /exercises/batch-generate`

**Bhejo:**
```json
{
  "conceptId": "concept456",
  "count": 5,
  "difficulty": 3,
  "type": "mcq"
}
```

**Milega:** array of 5 generated exercises

---

## 🧠 Adaptive Engine Routes

### 1. Get Adaptive State — `GET /adaptive/state`

**Milega:**
```json
{
  "data": {
    "currentDifficulty": 3,
    "overallMastery": 0,
    "skills": {}
  }
}
```
> Exercises submit karte jao → mastery badhti jaayegi

---

### 2. Next Concept Recommendation — `GET /adaptive/next-concept`

**Milega:**
```json
{
  "data": {
    "recommendedSkill": "algebra",
    "message": "Focus on \"algebra\" — you have the most room to grow here."
  }
}
```

---

## 📊 Analytics Routes

### 1. Progress Summary — `GET /analytics/progress`

**Milega:**
```json
{
  "data": {
    "totalAttempts": 10,
    "correctAttempts": 7,
    "accuracy": 70,
    "totalTimeSpent": 120
  }
}
```

---

### 2. Weak Areas — `GET /analytics/weak-areas`

**Milega:**
```json
{
  "data": [
    {
      "skill": "fractions",
      "masteryScore": 25,
      "trend": "declining",
      "tip": "[DUMMY TIP] Practice more problems on \"fractions\"."
    }
  ]
}
```

---

### 3. Monthly Report — `GET /analytics/report/2026-02`

**Milega (agar report exist kare):**
```json
{
  "data": {
    "month": "2026-02",
    "totalAttempts": 42,
    "avgAccuracy": 68,
    "weakSkills": ["fractions", "algebra"],
    "strongSkills": ["geometry"],
    "insights": ["[DUMMY] You completed 42 exercises this month.", "..."]
  }
}
```

---

## 🏫 Teacher Routes

### 1. Create Classroom — `POST /teacher/class`

**Bhejo:**
```json
{
  "name": "10-A Science",
  "courseId": "course123"
}
```

---

### 2. Enroll Students — `POST /teacher/class/:classId/enroll`

**Bhejo:**
```json
{
  "emails": ["student1@test.com", "student2@test.com"]
}
```

**Milega:**
```json
{
  "data": { "enrolled": 2, "notFound": 0 }
}
```

---

### 3. Set AI Override — `POST /teacher/override`

**Bhejo:**
```json
{
  "rule": "max_difficulty",
  "value": 3
}
```
> Override examples: `max_difficulty`, `disable_ai_hints`, `force_language`

---

## 📝 Notes Routes

### 1. Summarize — `POST /notes/summarize`

**Bhejo:**
```json
{
  "conceptId": "concept456",
  "chapterId": "chapter123",
  "highlightedText": "HCF × LCM = Product of two numbers"
}
```

---

### 2. Flashcards — `POST /notes/flashcards`

**Bhejo:**
```json
{
  "conceptId": "concept456",
  "highlightedText": "HCF × LCM = Product of two numbers"
}
```

**Milega:**
```json
{
  "data": {
    "flashcards": [
      { "front": "[DUMMY] Key term from concept", "back": "[DUMMY] Definition / explanation" }
    ]
  }
}
```

---

### 3. All Notes — `GET /notes?limit=20`

---

### 4. Delete Note — `DELETE /notes/:noteId`

---

## 🏆 Gamification Routes

### 1. Profile — `GET /gamification/profile`

**Milega:**
```json
{
  "data": {
    "xp": 150,
    "level": 2,
    "xpProgress": 50,
    "xpForNextLevel": 200,
    "currentStreak": 3,
    "longestStreak": 7,
    "totalBadges": 2,
    "recentBadges": [{ "badgeType": "first_login", "badgeName": "First Step" }]
  }
}
```

---

### 2. All Badges — `GET /gamification/badges`

**Milega:**
```json
{
  "data": [
    { "badgeType": "first_login", "badgeName": "First Step", "isEarned": true, "earnedAt": "2026-02-22T..." },
    { "badgeType": "streak_7", "badgeName": "Week Warrior", "isEarned": false, "earnedAt": null }
  ]
}
```

---

## 🔄 Sync Routes

### 1. Push Offline Attempts — `POST /sync/push`

**Bhejo:**
```json
{
  "attempts": [
    {
      "exerciseId": "ex001",
      "conceptId": "concept456",
      "answer": "Option A (correct)",
      "isCorrect": true,
      "score": 100,
      "timeTaken": 38,
      "hintsUsed": 0,
      "mode": "offline"
    }
  ]
}
```

**Milega:**
```json
{
  "data": { "saved": 1 },
  "message": "1 attempts synced successfully"
}
```

---

### 2. Pull Server Changes — `GET /sync/pull?lastSyncedAt=2026-02-01T00:00:00.000Z`

---

## ❌ Common Errors

| Status | Matlab | Fix |
|--------|--------|-----|
| `401 Unauthorized` | Token nahi bheja ya expire ho gaya | Fresh login karo, nayi token lo |
| `403 Forbidden` | Role allowed nahi (e.g. student ne admin route hit kiya) | Admin/Teacher account se try karo |
| `400 Bad Request` | Required field missing hai | Request body check karo |
| `404 Not Found` | ID galat hai | MongoDB se sahi ID copy karo |
| `409 Conflict` | Already exist karta hai (e.g. duplicate class) | Different data se try karo |

---

## 🤖 AI Routes ka Status

| Route | Abhi | Real AI ke liye |
|-------|------|-----------------|
| `POST /tutor/ask` | Dummy text | `aiTutor.service.js` mein GPT-4o connect karo |
| `POST /tutor/explain` | Dummy text | Same file |
| `GET /exercises/generate` | Dummy question | `questionGen.service.js` mein GPT-4o |
| `POST /exercises/hint` | Dummy hint | `exercise.controller.js` → `getHint()` |
| `POST /notes/summarize` | Dummy summary | `notes.service.js` → `generateSummary()` |
| `POST /notes/flashcards` | Dummy cards | `notes.service.js` → `generateFlashcards()` |
| `GET /analytics/weak-areas` | Dummy tips | `analytics.controller.js` → `getWeakAreas()` |
| `GET /analytics/report/:month` | Dummy insights | `report.service.js` → `generateMonthlyReport()` |
