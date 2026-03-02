import api from '../lib/axios';

export const exerciseService = {
    // Generate a new AI practice question
    generateQuestion: (conceptId, difficulty = 'medium', type = 'mcq') =>
        api.get('/exercises/generate', { params: { conceptId, difficulty, type } }),

    // Get attempt history for a concept
    getHistory: (conceptId, cursor) =>
        api.get('/exercises/history', { params: { conceptId, cursor } }),

    // Get specific exercise details
    getExercise: (id) => api.get(`/exercises/${id}`),

    // Submit an answer
    submitAnswer: (data) => api.post('/exercises/submit', data),

    // Get an AI hint for a problem
    getHint: (exerciseId) => api.post('/exercises/hint', { exerciseId }),

    // [Teacher] Batch generate questions for a chapter
    batchGenerate: (data) => api.post('/exercises/batch-generate', data),
};
