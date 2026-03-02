import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';

import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import LearnPage from '../pages/Learn/LearnPage';
import LibraryPage from '../pages/Library/LibraryPage';
import AIChatPage from '../pages/AIChat/AIChatPage';
import SmartNotesPage from '../pages/SmartNotes/SmartNotesPage';
import FlashcardsPage from '../pages/SmartNotes/FlashcardsPage';
import PracticePage from '../pages/Practice/PracticePage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AnalyticsPage from '../pages/Dashboard/AnalyticsPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import TeacherDashboard from '../pages/Teacher/TeacherDashboard';
import CreateChapterPage from '../pages/Teacher/CreateChapterPage';
import CreateCoursePage from '../pages/Teacher/CreateCoursePage';
import StudentManagementPage from '../pages/Teacher/StudentManagementPage';

// Blocks unauthenticated access
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Blocks non-teachers from accessing teacher routes
const TeacherRoute = ({ children }) => {
    const user = useAuthStore((s) => s.user);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'teacher') return <Navigate to="/learn" replace />;
    return children;
};

const AppRouter = () => (
    <BrowserRouter>
        <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Layout Routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Student routes */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route path="/notes" element={<SmartNotesPage />} />
                <Route path="/flashcards" element={<FlashcardsPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Teacher-only routes (nested layout) */}
                <Route path="/teacher" element={
                    <TeacherRoute><TeacherDashboard /></TeacherRoute>
                } />
                <Route path="/teacher/create-chapter" element={
                    <TeacherRoute><CreateChapterPage /></TeacherRoute>
                } />
                <Route path="/teacher/create-course" element={
                    <TeacherRoute><CreateCoursePage /></TeacherRoute>
                } />
                <Route path="/teacher/students" element={
                    <TeacherRoute><StudentManagementPage /></TeacherRoute>
                } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
);

export default AppRouter;
