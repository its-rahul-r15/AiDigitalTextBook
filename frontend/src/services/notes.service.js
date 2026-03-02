import api from '../lib/axios';

export const notesService = {
    // Get all user notes (can filter by conceptId)
    getNotes: (conceptId, cursor) => api.get('/notes', { params: { conceptId, cursor } }),

    // Save a highlight and generate an AI summary
    // Note: uses /content/highlight as it's the primary entry point in the backend
    saveHighlight: (data) => api.post('/content/highlight', data),

    // Generate a standalone AI summary for a text
    summarize: (data) => api.post('/notes/summarize', data),

    // Generate AI flashcards for a concept or highlight
    generateFlashcards: (data) => api.post('/notes/flashcards', data),

    // Delete a note
    deleteNote: (id) => api.delete(`/notes/${id}`),

    // Legacy support (matches content.service implementation for now)
    getUserNotes: () => api.get('/content/notes'),
};
