import api from '../lib/axios';

export const tutorService = {
    sendMessage: (data) => api.post('/tutor/chat', data),
};
