import api from '../lib/axios';

export const analyticsService = {
    // [Student] Get full overview progress stats (attempts, accuracy, streak, study time)
    getProgress: () => api.get('/analytics/progress'),

    // [Student] Get skill mastery levels → returns { skills: [{ name, level, trend, attempts }] }
    getSkills: () => api.get('/analytics/skills'),

    // [Student] Get activity heatmap data (365 days) → returns { heatmap: [{ date, count, accuracy }] }
    getHeatmap: () => api.get('/analytics/heatmap'),

    // [Student] Get daily performance trend (line chart) → returns { performance: [{ date, attempts, accuracy, avgScore }] }
    getDailyPerformance: (days = 30) => api.get('/analytics/performance', { params: { days } }),

    // [Student] Get AI-driven weak area analysis and tips
    getWeakAreas: () => api.get('/analytics/weak-areas'),

    // [Student] Get monthly study report
    getMonthlyReport: (month) => api.get(`/analytics/report/${month}`),

    // Log a study event (page visit, video watch, etc.)
    logEvent: (data) => api.post('/analytics/log', data),

    // [Teacher] Get analytics for the whole class
    getClassAnalytics: () => api.get('/analytics/class'),
};
