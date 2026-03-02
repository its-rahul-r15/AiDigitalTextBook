import api from '../lib/axios';

export const contentService = {
    // ── Course & Chapter ───────────────────────────────────────────────────
    getCourses: () => api.get('/content/courses'),
    getCourse: (id) => api.get(`/content/courses/${id}`),
    getChapters: (courseId) => api.get(`/content/courses/${courseId}/chapters`),
    getChapter: (chapterId) => api.get(`/content/chapters/${chapterId}`),
    getConcept: (id) => api.get(`/content/concepts/${id}`),

    // ── Search ─────────────────────────────────────────────────────────────
    search: (q) => api.get('/content/search', { params: { q } }),

    // ── Management (Teacher/Admin) ─────────────────────────────────────────
    createCourse: (data) => api.post('/content/courses', data),
    createChapter: (data) => api.post('/content/chapters', data),

    // ── Progress & Tracking ───────────────────────────────────────────────
    getProgress: () => api.get('/content/progress'),
    updateProgress: (data) => api.post('/content/progress', data),
    updateStudyTime: (minutes) => api.post('/content/progress/study-time', { minutes }),

    // ── Notes & Highlights (Moving to notes.service soon, keeping for compatibility) ──
    getNotes: () => api.get('/content/notes'),
    deleteNote: (id) => api.delete(`/content/notes/${id}`),
    saveHighlight: (data) => api.post('/content/highlight', data),
};
