import api from '../lib/axios';

export const tutorService = {
    sendMessage: (data) => api.post('/tutor/chat', data),
    ask: (data) => api.post('/tutor/ask', data),
    explain: (data) => api.post('/tutor/explain', data),
    simplify: (data) => api.post('/tutor/simplify', data),
    translate: (data) => api.post('/tutor/translate', data),
    relevance: (data) => api.post('/tutor/relevance', data),
    getHistory: (page = 1, limit = 50) => api.get(`/tutor/history?page=${page}&limit=${limit}`),
    searchHistory: (q) => api.get(`/tutor/history/search?q=${encodeURIComponent(q)}`),
};
