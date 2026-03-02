import api from '../lib/axios';

export const gamificationService = {
    getProfile: () => api.get('/gamification/profile'),
    getBadges: () => api.get('/gamification/badges'),
};
