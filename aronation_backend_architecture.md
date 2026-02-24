# 🧠 Aronation Notes — Backend Architecture
> **Stack:** Node.js · Express.js · MongoDB · Redis · LangChain · Socket.io  
> **Version:** 1.0.0 | **Status:** 🟡 In Development | **Classification:** 🔒 Confidential

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [API Endpoints](#3-api-endpoints)
4. [Database Schema](#4-database-schema)
5. [Middleware & Auth](#5-middleware--auth)
6. [AI Services](#6-ai-services)
7. [Environment Variables](#7-environment-variables)
8. [Security Architecture](#8-security-architecture)

---

## 1. Project Overview

| Property | Value |
|---|---|
| **Project Name** | Aronation Notes |
| **Backend Runtime** | Node.js 20 LTS |
| **Framework** | Express.js 4.x |
| **Primary Database** | MongoDB 7.x (Mongoose ODM) |
| **Cache / Queue** | Redis 7.x + Bull 4.x |
| **AI Orchestration** | LangChain.js + OpenAI GPT-4o |
| **Real-time** | Socket.io 4.x |
| **Search** | Elasticsearch 8.x |
| **Architecture** | Layered Monolith → Microservice-ready |
| **API Style** | REST + SSE (AI streaming) + WebSocket |

### Core Responsibilities

- Serve authenticated REST APIs to the React frontend
- Orchestrate AI features via LangChain pipelines (tutor, adaptive engine, question gen)
- Persist and query all learning data (attempts, skill profiles, progress)
- Emit real-time analytics updates via Socket.io
- Process async jobs via Bull queues (reports, adaptive scoring, media)
- Manage offline sync delta reconciliation

---

## 2. Folder Structure

```
server/
├── src/
│   │
│   ├── config/                         # App & service configuration
│   │   ├── database.js                 # MongoDB connection (Mongoose)
│   │   ├── redis.js                    # Redis client initialization
│   │   ├── elasticsearch.js            # Elasticsearch client setup
│   │   ├── openai.js                   # OpenAI + LangChain client factory
│   │   ├── bull.js                     # Bull queue factory & registration
│   │   └── app.js                      # Express app factory (middleware mount)
│   │
│   ├── controllers/                    # Route handlers — thin layer only
│   │   ├── auth.controller.js          # Register, login, refresh, logout
│   │   ├── content.controller.js       # Textbook CRUD, media fetch
│   │   ├── tutor.controller.js         # AI chat, explanation, replay
│   │   ├── exercise.controller.js      # Question gen, submit answer, hint
│   │   ├── adaptive.controller.js      # Get/update difficulty state
│   │   ├── analytics.controller.js     # Progress save, dashboard data
│   │   ├── teacher.controller.js       # Class management, AI overrides
│   │   ├── notes.controller.js         # Smart notes & AI summaries
│   │   ├── gamification.controller.js  # Badges, XP, streaks
│   │   └── sync.controller.js          # Offline delta push/pull
│   │
│   ├── middleware/                     # Express middleware chain
│   │   ├── auth.middleware.js          # JWT access token verification
│   │   ├── refresh.middleware.js       # Refresh token rotation handler
│   │   ├── roleGuard.middleware.js     # RBAC: student | teacher | admin
│   │   ├── rateLimiter.middleware.js   # Per-route rate limiting (express-rate-limit)
│   │   ├── validate.middleware.js      # Joi schema validation factory
│   │   ├── errorHandler.middleware.js  # Global error formatter + Sentry
│   │   ├── requestLogger.middleware.js # Morgan HTTP logger → Winston
│   │   ├── cacheControl.middleware.js  # Redis cache-aside pattern helper
│   │   └── sanitize.middleware.js      # xss-clean + mongo-sanitize
│   │
│   ├── models/                         # Mongoose ODM schemas
│   │   ├── User.model.js               # Accounts, roles, preferences, region
│   │   ├── Course.model.js             # Top-level curriculum container
│   │   ├── Chapter.model.js            # Chapter content, media refs, concepts[]
│   │   ├── Concept.model.js            # Atomic learning node with skillTags
│   │   ├── Exercise.model.js           # Questions, steps, hints, solution
│   │   ├── AttemptLog.model.js         # Immutable append-only response log
│   │   ├── SkillProfile.model.js       # Per-student skill mastery snapshot
│   │   ├── Note.model.js               # AI-generated notes & flashcards
│   │   ├── Badge.model.js              # Gamification badge definitions
│   │   ├── ClassRoom.model.js          # Teacher class with enrolled students
│   │   ├── TeacherOverride.model.js    # AI behavior rules set by teacher
│   │   ├── SyncQueue.model.js          # Offline delta records for sync
│   │   └── Report.model.js             # Monthly AI-generated learning reports
│   │
│   ├── routes/                         # Express router definitions
│   │   ├── index.js                    # Mount all routers → /api/v1/*
│   │   ├── auth.routes.js              # /api/v1/auth/*
│   │   ├── content.routes.js           # /api/v1/content/*
│   │   ├── tutor.routes.js             # /api/v1/tutor/*
│   │   ├── exercise.routes.js          # /api/v1/exercises/*
│   │   ├── adaptive.routes.js          # /api/v1/adaptive/*
│   │   ├── analytics.routes.js         # /api/v1/analytics/*
│   │   ├── teacher.routes.js           # /api/v1/teacher/*
│   │   ├── notes.routes.js             # /api/v1/notes/*
│   │   ├── gamification.routes.js      # /api/v1/gamification/*
│   │   └── sync.routes.js              # /api/v1/sync/*
│   │
│   ├── services/                       # Business logic — all heavy lifting here
│   │   ├── aiTutor.service.js          # LangChain Q&A chain, streaming
│   │   ├── adaptive.service.js         # IRT model, difficulty delta calculation
│   │   ├── questionGen.service.js      # AI question generation pipeline
│   │   ├── analytics.service.js        # Skill trend computation & aggregation
│   │   ├── report.service.js           # Monthly AI report generation
│   │   ├── notes.service.js            # Highlight → AI summary → flashcards
│   │   ├── media.service.js            # S3 upload, CloudFront URL signing
│   │   ├── notification.service.js     # Email / push notification dispatch
│   │   ├── sync.service.js             # Offline delta reconciliation logic
│   │   ├── gamification.service.js     # XP calc, badge award, streak tracking
│   │   ├── search.service.js           # Elasticsearch full-text content search
│   │   └── cache.service.js            # Redis get/set/invalidate helpers
│   │
│   ├── sockets/                        # Socket.io namespaces & event handlers
│   │   ├── index.js                    # Socket server init, auth middleware
│   │   ├── tutor.socket.js             # /tutor — live AI response streaming
│   │   └── analytics.socket.js         # /analytics — real-time progress push
│   │
│   ├── jobs/                           # Bull queue job processors
│   │   ├── index.js                    # Register all queues
│   │   ├── reportGeneration.job.js     # Monthly report cron (1st of month)
│   │   ├── adaptiveScoring.job.js      # Async IRT score update after attempt
│   │   ├── mediaProcessing.job.js      # Video/audio transcoding queue
│   │   └── emailNotification.job.js    # Transactional email dispatch queue
│   │
│   ├── validators/                     # Joi schema definitions per domain
│   │   ├── auth.validator.js           # Register, login payload schemas
│   │   ├── exercise.validator.js       # Submit answer, hint request schemas
│   │   ├── teacher.validator.js        # Override, assign schemas
│   │   └── content.validator.js        # Course, chapter, concept schemas
│   │
│   ├── utils/                          # Shared pure utility functions
│   │   ├── jwt.util.js                 # Token sign/verify/decode helpers
│   │   ├── logger.util.js              # Winston logger (JSON, Sentry transport)
│   │   ├── apiResponse.util.js         # Standardised { success, data, message }
│   │   ├── asyncHandler.util.js        # try/catch wrapper for async routes
│   │   ├── paginate.util.js            # Cursor-based pagination helper
│   │   └── constants.util.js           # Enums: roles, difficulty, event names
│   │
│   └── server.js                       # Entry point — HTTP server, Socket.io bind
│
├── tests/
│   ├── unit/                           # Pure unit tests (Jest)
│   │   ├── services/
│   │   └── utils/
│   ├── integration/                    # API integration tests (Supertest)
│   │   └── routes/
│   └── fixtures/                       # Test data seeds
│
├── scripts/
│   ├── seed.js                         # Database seeder for dev/staging
│   └── migrate.js                      # Schema migration runner
│
├── .env                                # Environment variables (never commit)
├── .env.example                        # Template with all required keys
├── .eslintrc.js                        # ESLint configuration
├── .prettierrc                         # Prettier formatting rules
├── jest.config.js                      # Jest test runner config
├── nodemon.json                        # Dev server watch config
├── Dockerfile                          # Production Docker image
└── package.json                        # Dependencies & npm scripts
```

---

## 3. API Endpoints

> **Base URL:** `/api/v1`  
> **Response Format:** `{ success: boolean, data: any, message: string, error?: object }`  
> **Pagination:** Cursor-based `?cursor=<lastId>&limit=20`

---

### 🔐 Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register student or teacher. Returns JWT + refresh token |
| `POST` | `/login` | Public | Login with email + password |
| `POST` | `/refresh` | Public | Rotate refresh token, return new access token |
| `POST` | `/logout` | Student / Teacher | Blacklist refresh token in Redis |
| `GET` | `/me` | Student / Teacher | Get current user profile |
| `PATCH` | `/me` | Student / Teacher | Update language, region, preferences |
| `POST` | `/forgot-password` | Public | Send password reset email |
| `POST` | `/reset-password` | Public | Verify OTP and set new password |

---

### 📚 Content — `/api/v1/content`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/courses` | Student | List all courses available to student |
| `GET` | `/courses/:id` | Student | Get course with chapters list |
| `GET` | `/chapters/:id` | Student | Get chapter with concept refs and media |
| `GET` | `/concepts/:id` | Student | Get single atomic concept node |
| `POST` | `/highlight` | Student | Save text highlight for AI summary |
| `GET` | `/search?q=` | Student | Full-text search across all content |
| `POST` | `/courses` | Admin | Create new course |
| `PUT` | `/courses/:id` | Admin | Update course metadata |
| `POST` | `/chapters` | Admin | Create chapter under course |
| `PUT` | `/concepts/:id` | Admin | Update concept content |

---

### 🤖 AI Tutor — `/api/v1/tutor`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/ask` | Student | Ask question — streams response via SSE |
| `POST` | `/explain` | Student | Re-explain concept in selected mode (diagram / story / steps) |
| `POST` | `/simplify` | Student | Simplify explanation for struggling student |
| `POST` | `/translate` | Student | Translate explanation to preferred language |
| `POST` | `/relevance` | Student | "Why am I learning this?" — real-world use cases |
| `POST` | `/advocate` | Student | Devil's Advocate mode — challenge textbook thesis |
| `POST` | `/bridge` | Student | Interdisciplinary Bridge — link to another subject |
| `GET` | `/history/:conceptId` | Student | Get past tutor conversations for concept |

---

### 📝 Exercises — `/api/v1/exercises`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/generate` | Student | AI-generate question for concept `?conceptId=&difficulty=` |
| `GET` | `/:id` | Student | Get existing exercise by ID |
| `POST` | `/submit` | Student | Submit answer, receive step-by-step feedback |
| `POST` | `/hint` | Student | Request contextual hint for current step |
| `GET` | `/history` | Student | Get all attempts for a concept |
| `POST` | `/batch-generate` | Teacher | Generate question bank for concept |

---

### 🎯 Adaptive Engine — `/api/v1/adaptive`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/state` | Student | Get current difficulty profile for student |
| `GET` | `/next-concept` | Student | AI-recommended next concept based on skill gaps |
| `POST` | `/update` | System | Trigger IRT score recalculation (called by job) |
| `GET` | `/difficulty-history` | Student | View difficulty trend over time |

---

### 📊 Analytics — `/api/v1/analytics`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/progress` | Student | Full learning progress dashboard data |
| `GET` | `/skills` | Student | Skill mastery breakdown by tag |
| `GET` | `/heatmap` | Student | Daily activity heatmap (365 days) |
| `GET` | `/weak-areas` | Student | AI-identified weak concept areas |
| `GET` | `/report/:month` | Student | Monthly AI-generated learning report |
| `GET` | `/class` | Teacher | Class-level aggregated analytics |
| `GET` | `/class/trends` | Teacher | Weekly/monthly skill trend for class |
| `POST` | `/log` | Student | Log custom study event |

---

### 👩‍🏫 Teacher — `/api/v1/teacher`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/class` | Teacher | View class roster and student stats |
| `POST` | `/class` | Teacher | Create classroom |
| `POST` | `/class/:id/enroll` | Teacher | Enroll students by email list |
| `POST` | `/override` | Teacher | Set AI behavior rules for class |
| `GET` | `/override` | Teacher | Get current AI overrides |
| `DELETE` | `/override/:id` | Teacher | Remove specific AI override |
| `POST` | `/assign` | Teacher | Assign content/exercises to class |
| `GET` | `/student/:id` | Teacher | View individual student profile |

---

### 📓 Notes — `/api/v1/notes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/summarize` | Student | Generate AI summary from highlights |
| `POST` | `/flashcards` | Student | Generate flashcards from chapter |
| `GET` | `/` | Student | Get all saved notes with filters |
| `DELETE` | `/:id` | Student | Delete note |

---

### 🏆 Gamification — `/api/v1/gamification`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/profile` | Student | Get XP, level, badges, streak |
| `GET` | `/badges` | Student | List all earned and locked badges |
| `GET` | `/streak` | Student | Current and longest streak data |

---

### 🔄 Sync — `/api/v1/sync`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/push` | Student | Push offline changes to server |
| `GET` | `/pull` | Student | Pull pending server changes for device |
| `GET` | `/status` | Student | Check sync queue status |

---

## 4. Database Schema

### 👤 `users`

```js
{
  _id: ObjectId,
  name: String,                        // Full name
  email: { type: String, unique: true },
  passwordHash: String,                // bcrypt hashed
  role: { type: String, enum: ['student','teacher','admin'] },
  languagePref: { type: String, default: 'en' },
  region: String,                      // e.g. 'IN', 'US'
  enrolledCourses: [ObjectId],         // ref: courses
  classRoom: ObjectId,                 // ref: classrooms (students)
  isVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: email (unique), role, region
```

---

### 📘 `courses`

```js
{
  _id: ObjectId,
  title: String,
  subject: String,                     // 'Mathematics', 'Science'
  grade: Number,                       // 6–12
  board: String,                       // 'CBSE', 'ICSE', 'STATE'
  chapters: [ObjectId],                // ref: chapters
  language: String,
  isPublished: Boolean,
  createdBy: ObjectId,                 // ref: users (admin)
  createdAt: Date
}
// Indexes: subject, grade, board
```

---

### 📖 `chapters`

```js
{
  _id: ObjectId,
  courseId: ObjectId,                  // ref: courses
  title: String,
  orderIndex: Number,
  concepts: [ObjectId],                // ref: concepts
  mediaRefs: [{
    type: { type: String, enum: ['video','audio','animation','image'] },
    url: String,
    conceptId: ObjectId
  }],
  isOfflineAvailable: Boolean,
  createdAt: Date
}
// Indexes: courseId, orderIndex
```

---

### 🔬 `concepts`

```js
{
  _id: ObjectId,
  chapterId: ObjectId,                 // ref: chapters
  title: String,
  content: String,                     // Rich text / Markdown
  difficulty: { type: Number, min: 1, max: 5, default: 3 },
  skillTags: [String],                 // e.g. ['fractions','algebra']
  prerequisites: [ObjectId],           // ref: concepts
  mediaRef: String,                    // Primary media URL
  explanationModes: [{
    mode: { type: String, enum: ['visual','story','steps','analogy'] },
    content: String
  }],
  orderIndex: Number,
  createdAt: Date
}
// Indexes: chapterId, skillTags, difficulty
```

---

### 🧩 `exercises`

```js
{
  _id: ObjectId,
  conceptId: ObjectId,                 // ref: concepts
  type: { type: String, enum: ['mcq','step-based','fill-blank','open'] },
  question: String,
  options: [String],                   // MCQ only
  steps: [{
    stepNumber: Number,
    instruction: String,
    expectedAnswer: String,
    hint: String
  }],
  solution: String,
  difficulty: { type: Number, min: 1, max: 5 },
  isAiGenerated: Boolean,
  generationSeed: String,              // For reproducible AI variants
  createdAt: Date
}
// Indexes: conceptId, difficulty, type
```

---

### 📋 `attemptlogs`

```js
{
  _id: ObjectId,
  userId: ObjectId,                    // ref: users
  exerciseId: ObjectId,                // ref: exercises
  conceptId: ObjectId,                 // ref: concepts (denormalised)
  answer: Mixed,                       // String or step array
  isCorrect: Boolean,
  score: Number,                       // 0–100
  timeTaken: Number,                   // seconds
  hintsUsed: Number,
  retriesCount: Number,
  mode: { type: String, enum: ['learning','exam'] },
  createdAt: Date                      // Immutable — never updated
}
// Indexes: userId+conceptId (compound), createdAt, userId+isCorrect
// Note: Append-only. No updates allowed. TTL index optional for archiving.
```

---

### 🎯 `skillprofiles`

```js
{
  _id: ObjectId,
  userId: { type: ObjectId, unique: true }, // ref: users
  skills: {
    type: Map,
    of: {
      masteryScore: { type: Number, min: 0, max: 1 }, // IRT theta
      attempts: Number,
      lastPracticed: Date,
      trend: { type: String, enum: ['improving','stable','declining'] }
    }
  },
  overallMastery: Number,              // Weighted average
  updatedAt: Date
}
// Indexes: userId (unique)
// Updated async via Bull job after each attempt
```

---

### 🏅 `badges`

```js
{
  _id: ObjectId,
  userId: ObjectId,                    // ref: users
  badgeType: String,                   // 'skill-master','streak-7','first-login'
  badgeName: String,
  description: String,
  iconUrl: String,
  relatedSkill: String,
  earnedAt: Date
}
// Indexes: userId, badgeType, earnedAt
```

---

### 🏫 `classrooms`

```js
{
  _id: ObjectId,
  name: String,
  teacherId: ObjectId,                 // ref: users
  students: [ObjectId],                // ref: users
  courseId: ObjectId,                  // ref: courses
  aiOverrides: [{
    rule: String,                      // 'hints_disabled','exam_mode_forced'
    value: Mixed,
    appliedAt: Date
  }],
  createdAt: Date
}
// Indexes: teacherId, courseId
```

---

### 📄 `reports`

```js
{
  _id: ObjectId,
  userId: ObjectId,                    // ref: users
  month: String,                       // '2026-01'
  insights: [String],                  // AI-generated natural language bullets
  weakSkills: [String],
  strongSkills: [String],
  totalAttempts: Number,
  avgAccuracy: Number,
  totalTimeSpent: Number,              // minutes
  generatedAt: Date
}
// Indexes: userId+month (unique compound)
```

---

## 5. Middleware & Auth

### Middleware Chain Order

```
Request
  │
  ├── 1. requestLogger      → Log method, path, IP, timestamp
  ├── 2. helmet             → Set all security headers
  ├── 3. cors               → Allow whitelisted origins only
  ├── 4. sanitize           → Strip XSS payloads + MongoDB operator injection
  ├── 5. rateLimiter        → Block excessive requests per IP
  ├── 6. express.json()     → Parse JSON body (limit: 10kb)
  │
  ├── [Route-level]
  ├── 7. auth.middleware     → Verify JWT access token
  ├── 8. roleGuard           → Check role permission for route
  ├── 9. validate            → Joi schema body validation
  ├── 10. cacheControl       → Redis cache check (GET routes only)
  │
  ├── Controller logic
  │
  └── 11. errorHandler      → Format all errors, report to Sentry
```

---

### JWT Auth Flow

```
POST /auth/login
  → Verify credentials
  → Sign accessToken  (JWT, 15m, JWT_SECRET)
  → Sign refreshToken (JWT, 7d, JWT_REFRESH_SECRET)
  → Store refreshToken in Redis: key = "refresh:{userId}", TTL = 7d
  → Return accessToken in body, refreshToken in httpOnly cookie

Every Protected Request
  → auth.middleware reads Authorization: Bearer <token>
  → Verifies signature with JWT_SECRET
  → Attaches req.user = { id, role, email }
  → If expired → 401 → client calls POST /auth/refresh

POST /auth/refresh
  → Read refreshToken from httpOnly cookie
  → Verify against Redis stored value
  → Issue new accessToken + rotate refreshToken
  → Update Redis key with new refresh token

POST /auth/logout
  → Delete Redis key for refresh token
  → Clear httpOnly cookie
```

---

### `auth.middleware.js`

```js
// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.util.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new ApiError(401, 'Not authenticated');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
  next();
});
```

---

### `roleGuard.middleware.js`

```js
// src/middleware/roleGuard.middleware.js
export const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'Forbidden: insufficient permissions');
  }
  next();
};

// Usage in routes:
// router.get('/class', protect, allow('teacher','admin'), teacherController.getClass);
```

---

### `validate.middleware.js`

```js
// src/middleware/validate.middleware.js
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message);
    throw new ApiError(400, 'Validation failed', messages);
  }
  next();
};
```

---

### `errorHandler.middleware.js`

```js
// src/middleware/errorHandler.middleware.js
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  // Strip stack traces in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
```

---

### Rate Limiting Config

| Route Group | Window | Max Requests |
|---|---|---|
| `/auth/login` | 15 min | 10 |
| `/auth/register` | 60 min | 5 |
| `/tutor/ask` | 1 min | 20 |
| `/exercises/generate` | 1 min | 15 |
| Global all routes | 15 min | 200 |

---

## 6. AI Services

### Architecture Overview

```
Request → Controller → Service → LangChain Chain → OpenAI GPT-4o
                                       │
                              Context Injection Layer
                              (retrieves relevant content
                               from Elasticsearch RAG)
                                       │
                              Teacher Override Filter
                              (checks TeacherOverride collection)
                                       │
                              Streaming Response via SSE / Socket.io
```

---

### Chain 1 — `aiTutor.service.js` (Contextual Q&A)

```js
// src/services/aiTutor.service.js
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

const TUTOR_SYSTEM = `You are an AI tutor for "{subject}" textbook.
Answer ONLY from the provided context below. If unsure, say "I need more context."
Language: {language}. Student grade: {grade}.

Context:
{context}`;

export async function askTutor({ question, conceptId, userId, res }) {
  const context   = await searchService.getRelevantContext(question, conceptId);
  const overrides = await TeacherOverride.findActiveForUser(userId);

  if (overrides.aiDisabled) {
    return res.json({ message: 'AI tutor is disabled by your teacher.' });
  }

  const chain = new LLMChain({
    llm: new ChatOpenAI({ model: 'gpt-4o', streaming: true }),
    prompt: PromptTemplate.fromTemplate(TUTOR_SYSTEM)
  });

  // Stream tokens back to client via SSE
  await chain.stream({ question, context, ...userProfile }, {
    callbacks: [new StreamingCallbackHandler(res)]
  });
}
```

---

### Chain 2 — `adaptive.service.js` (IRT Difficulty Engine)

```js
// src/services/adaptive.service.js
// Item Response Theory (IRT) 3-Parameter Model

export function calculateTheta(attempts) {
  // attempts: array of { isCorrect, difficulty, timeTaken }
  const recentAttempts = attempts.slice(-10);
  const accuracy = recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length;
  const avgTime   = recentAttempts.reduce((s, a) => s + a.timeTaken, 0) / recentAttempts.length;

  // Theta = estimated student ability level (–3 to +3)
  let theta = 0;
  theta += (accuracy - 0.5) * 2;    // Accuracy contribution
  theta -= (avgTime > 60 ? 0.5 : 0); // Slow response penalty
  return Math.max(-3, Math.min(3, theta));
}

export function getDifficultyDelta(theta, currentDifficulty) {
  if (theta > 1.0  && currentDifficulty < 5) return +1;  // Increase
  if (theta < -1.0 && currentDifficulty > 1) return -1;  // Decrease
  return 0;                                               // Maintain
}
```

---

### Chain 3 — `questionGen.service.js` (Infinite Practice)

```js
// src/services/questionGen.service.js

const QUESTION_GEN_PROMPT = `Generate a {difficulty_label} {type} question for:
Concept: {concept_title}
Content: {concept_content}
Seed: {seed}

Return ONLY valid JSON:
{{
  "question": "...",
  "type": "{type}",
  "options": ["..."],        // MCQ only
  "steps": [{{ "stepNumber": 1, "instruction": "...", "expectedAnswer": "...", "hint": "..." }}],
  "solution": "...",
  "difficulty": {difficulty}
}}`;

export async function generateQuestion({ conceptId, difficulty, type, userId }) {
  const concept = await Concept.findById(conceptId);
  const seed    = `${userId}-${conceptId}-${Date.now()}`;

  const llm      = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.7 });
  const response = await llm.invoke(
    PromptTemplate.fromTemplate(QUESTION_GEN_PROMPT).format({
      ...concept.toObject(),
      difficulty_label: difficultyLabel(difficulty),
      type, seed, difficulty
    })
  );

  return JSON.parse(response.content);
}
```

---

### Chain 4 — `report.service.js` (Monthly Reports)

```js
// src/services/report.service.js

export async function generateMonthlyReport(userId, month) {
  const attempts   = await AttemptLog.find({ userId, createdAt: { $gte: startOf(month) } });
  const skillData  = await SkillProfile.findOne({ userId });
  const rawMetrics = computeMetrics(attempts, skillData);

  const prompt = `Student Learning Report — ${month}
Metrics: ${JSON.stringify(rawMetrics)}
Generate 5 insight bullets. Identify top 3 weak skills. Identify top 3 strong skills.
Return JSON: { insights: [], weakSkills: [], strongSkills: [] }`;

  const llm      = new ChatOpenAI({ model: 'gpt-4o', temperature: 0.3 });
  const response = await llm.invoke(prompt);
  const parsed   = JSON.parse(response.content);

  await Report.findOneAndUpdate(
    { userId, month },
    { ...parsed, ...rawMetrics, generatedAt: new Date() },
    { upsert: true }
  );
}
```

---

### Socket.io AI Streaming

```js
// src/sockets/tutor.socket.js

io.of('/tutor').use(socketAuthMiddleware).on('connection', (socket) => {
  socket.on('ask', async ({ question, conceptId }) => {
    const stream = await aiTutorService.streamAsk({ question, conceptId, userId: socket.user.id });

    for await (const chunk of stream) {
      socket.emit('token', { text: chunk.content });
    }
    socket.emit('done');
  });
});
```

---

## 7. Environment Variables

### `server/.env`

```bash
# ─── Application ───────────────────────────────────────────────────────────
NODE_ENV=production                    # development | production | test
PORT=5000                              # Express server port
CLIENT_URL=https://app.aronation.com  # Allowed CORS origin

# ─── Database ──────────────────────────────────────────────────────────────
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/aronation
MONGO_MAX_POOL_SIZE=10                 # Mongoose connection pool

# ─── Redis ─────────────────────────────────────────────────────────────────
REDIS_URL=redis://default:pass@redis-host:6379
REDIS_CACHE_TTL=60                     # Default cache TTL in seconds

# ─── JWT ───────────────────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_min_64_chars_here
JWT_REFRESH_SECRET=your_refresh_secret_min_64_chars_here
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ─── OpenAI ────────────────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0.7

# ─── AWS ───────────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=aronation-media-prod
AWS_CLOUDFRONT_URL=https://cdn.aronation.com

# ─── Elasticsearch ─────────────────────────────────────────────────────────
ELASTICSEARCH_URL=https://es-host:9200
ELASTICSEARCH_API_KEY=your_api_key

# ─── Email (SMTP) ──────────────────────────────────────────────────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
EMAIL_FROM=noreply@aronation.com

# ─── Monitoring ────────────────────────────────────────────────────────────
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info                         # error | warn | info | debug

# ─── Rate Limiting ─────────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000            # 15 minutes in milliseconds
RATE_LIMIT_MAX=200                     # Max requests per window

# ─── Security ──────────────────────────────────────────────────────────────
BCRYPT_SALT_ROUNDS=12
COOKIE_SECRET=your_cookie_signing_secret
```

### Variable Summary Table

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | Runtime environment mode |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `REDIS_URL` | ✅ | Redis connection URL |
| `JWT_SECRET` | ✅ | Access token signing key (min 64 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing key |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for all AI features |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS credentials for S3/CloudFront |
| `AWS_S3_BUCKET` | ✅ | Media storage bucket name |
| `SENTRY_DSN` | ⚠️ | Error tracking (prod only) |
| `ELASTICSEARCH_URL` | ⚠️ | Full-text search (Phase 2+) |
| `SMTP_HOST` | ⚠️ | Email dispatch (Phase 2+) |
| `BCRYPT_SALT_ROUNDS` | ✅ | Password hashing strength (12 recommended) |

---

## 8. Security Architecture

### Security Layers

| Layer | Mechanism | Implementation |
|---|---|---|
| **Transport** | HTTPS + HSTS | Nginx TLS termination, HSTS header |
| **Authentication** | JWT + Refresh Rotation | 15m access token, 7d refresh in httpOnly cookie |
| **Authorization** | RBAC | roleGuard middleware per route |
| **Password** | bcrypt | Salt rounds = 12 |
| **Input Validation** | Joi + sanitize | All bodies validated + XSS/NoSQL stripped |
| **Rate Limiting** | express-rate-limit | Per-route thresholds, Redis-backed |
| **Headers** | Helmet.js | CSP, X-Frame, X-XSS, HSTS, nosniff |
| **AI Scope Lock** | System prompt context | AI can only answer from provided content |
| **AI Override** | Teacher rules in DB | TeacherOverride collection checked per request |
| **Secrets** | Environment variables | Never in codebase. `.env` in `.gitignore` |
| **Logging** | Winston + Sentry | PII stripped from logs. Errors auto-reported |
| **Privacy** | No camera/biometrics | Emotion engine uses only timing & click data |
| **Privacy** | No peer comparison | Analytics are per-user only, never cross-exposed |

### OWASP Top 10 Mitigation

| OWASP Risk | Mitigation in Aronation Notes |
|---|---|
| A01 Broken Access Control | RBAC on every route, no direct object refs without ownership check |
| A02 Cryptographic Failures | bcrypt passwords, JWT HS256, HTTPS everywhere |
| A03 Injection | mongo-sanitize strips `$` operators, Joi validates all inputs |
| A05 Security Misconfiguration | Helmet sets all headers; unused HTTP methods blocked |
| A07 Auth Failures | Refresh token rotation, Redis blacklist on logout |
| A09 Logging Failures | Winston structured logs + Sentry for all 5xx errors |

---

*Last updated: January 2026 | Aronation Notes Backend Architecture v1.0*
