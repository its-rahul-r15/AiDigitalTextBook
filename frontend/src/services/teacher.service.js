import api from '../lib/axios';

export const teacherService = {
    // Get details of the class(es) managed by the teacher
    getClass: () => api.get('/teacher/class'),

    // Create a new class
    createClass: (data) => api.post('/teacher/class', data),

    // Enroll students in a class via email list
    enrollStudents: (classId, emails) => api.post(`/teacher/class/${classId}/enroll`, { emails }),

    // Get all manual difficulty overrides
    getOverrides: () => api.get('/teacher/override'),

    // Set a manual difficulty override for a student/concept
    setOverride: (data) => api.post('/teacher/override', data),

    // Delete a specific override
    deleteOverride: (index) => api.delete(`/teacher/override/${index}`),

    // Get full profile/progress for a specific student in the class
    getStudentProfile: (studentId) => api.get(`/teacher/student/${studentId}`),
};
