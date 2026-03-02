// ─── constants.util.js ───────────────────────────────────────────────────────
// Central place for all enums used across the app.
// Import from here instead of hard-coding strings anywhere.

export const ROLES = {
    STUDENT: "student",
    TEACHER: "teacher",
    ADMIN: "admin",
};

export const DIFFICULTY = {
    VERY_EASY: 1,
    EASY: 2,
    MEDIUM: 3,
    HARD: 4,
    VERY_HARD: 5,
};

export const DIFFICULTY_LABEL = {
    1: "very easy",
    2: "easy",
    3: "medium",
    4: "hard",
    5: "very hard",
};

export const EXERCISE_TYPES = {
    MCQ: "mcq",
    STEP_BASED: "step-based",
    FILL_BLANK: "fill-blank",
    OPEN: "open",
};

export const BOARDS = ["CBSE", "ICSE", "STATE", "IB", "OTHER"];

export const LANGUAGES = ["en", "hi"];

export const SKILL_TREND = {
    IMPROVING: "improving",
    STABLE: "stable",
    DECLINING: "declining",
};

export const SOCKET_EVENTS = {
    TUTOR_ASK: "ask",
    TUTOR_TOKEN: "token",
    TUTOR_DONE: "done",
    ANALYTICS_UPDATE: "analytics:update",
};

export const BADGE_TYPES = {
    STREAK_7: "streak-7",
    STREAK_30: "streak-30",
    SKILL_MASTER: "skill-master",
    FIRST_LOGIN: "first-login",
    PERFECT_SCORE: "perfect-score",
    FAST_LEARNER: "fast-learner",
};

export const STUDY_MODES = {
    LEARNING: "learning",
    EXAM: "exam",
};

export const EXPLANATION_MODES = ["visual", "story", "steps", "analogy"];

export const MEDIA_TYPES = ["video", "audio", "animation", "image"];

export const XP_VALUES = {
    CORRECT_ANSWER: 10,
    PERFECT_SCORE: 25,
    STREAK_BONUS: 5,
    DAILY_LOGIN: 2,
};
