import api from '../lib/axios';

export const adaptiveService = {
    // Get the current student's adaptive state (level, mastery, etc.)
    getState: () => api.get('/adaptive/state'),

    // Get the next recommended concept or task from AI
    getRecommendation: () => api.get('/adaptive/next-concept'),

    // Get the history of difficulty adjustments for the student
    getDifficultyHistory: () => api.get('/adaptive/difficulty-history'),
};
