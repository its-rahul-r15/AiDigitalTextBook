import api from '../lib/axios';

export const practiceService = {
    // ── Teacher ─────────────────────────────────────────────────────────────
    createPracticeSet: (data) => api.post('/practice', data),
    getMyPracticeSets: () => api.get('/practice/my-sets'),
    togglePracticeSet: (id) => api.patch(`/practice/${id}/toggle`),
    deletePracticeSet: (id) => api.delete(`/practice/${id}`),
    getPracticeAnalytics: (id) => api.get(`/practice/${id}/analytics`),

    // ── Student ─────────────────────────────────────────────────────────────
    getAssignedPracticeSets: () => api.get('/practice/assigned'),
    submitPracticeSet: (id, answers) => api.post(`/practice/${id}/submit`, { answers }),
    getPracticeResult: (id) => api.get(`/practice/${id}/result`),
};
