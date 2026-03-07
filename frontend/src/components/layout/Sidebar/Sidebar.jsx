import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { useAuthStore } from '../../../store/authStore.js';
import { contentService } from '../../../services/content.service.js';

const STUDENT_NAV = [

    { to: '/learn', label: 'Textbooks', icon: '📖' },
    { to: '/notes', label: 'Smart Notes', icon: '📝' },
    { to: '/flashcards', label: 'Flashcards', icon: '🗂️' },
    { to: '/practice', label: 'Practice', icon: '✦' },
    { to: '/teacher-practice', label: 'Assignments', icon: '📋' },
    { to: '/ai-chat', label: 'AI Tutor', icon: '💬' },
    { to: '/library', label: 'Library', icon: '🏛️' },
];

const TEACHER_NAV = [
    { to: '/teacher', label: 'Dashboard', icon: '🏠' },
    { to: '/learn', label: 'Textbooks', icon: '📖' },
    { to: '/teacher/practice', label: 'Practice Sets', icon: '📝' },
    { to: '/library', label: 'Courses', icon: '🏛️' },
    { to: '/notes', label: 'Smart Notes', icon: '📝' },
    { to: '/profile', label: 'Profile', icon: '👤' },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [progress, setProgress] = useState(null);
    const isTeacher = user?.role === 'teacher';
    const NAV_ITEMS = isTeacher ? TEACHER_NAV : STUDENT_NAV;

    useEffect(() => {
        if (!isTeacher) {
            contentService.getProgress().then(res => {
                setProgress(res.data);
            }).catch(err => console.error("Sidebar progress fetch failed:", err));
        }
    }, [isTeacher]);

    const studyHours = progress ? Math.floor(progress.studyTimeMinutes / 60) : 0;
    const goalHours = progress ? Math.floor(progress.weeklyGoalMinutes / 60) : 16;
    const goalPct = progress ? Math.min(100, Math.round((progress.studyTimeMinutes / progress.weeklyGoalMinutes) * 100)) : 0;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <div className={styles.brandLogo}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                    </svg>
                </div>
                <div className={styles.brandText}>
                    <div className={styles.brandName}>Ai Digital</div>
                    <div className={styles.brandSub}>TEXT BOOK</div>
                </div>
            </div>

            <nav className={styles.nav}>
                {NAV_ITEMS.map(({ to, label, icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
                    >
                        <span className={styles.navIcon}>{icon}</span>
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {!isTeacher && (
                <div className={styles.sidebarFooter}>


                    <div className={styles.userProfile} onClick={() => navigate('/profile')}>
                        <div className={styles.avatarWrap}>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" className={styles.userAvatar} />
                        </div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user?.fullName || 'Alex Chen'}</div>
                            <div className={styles.userRole}>Premium Student</div>
                        </div>
                        <button
                            className={styles.logoutBtn}
                            onClick={(e) => { e.stopPropagation(); logout(); }}
                            title="Logout"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            )}

            {isTeacher && (
                <div className={styles.sidebarFooter}>
                    <div className={styles.userProfile} onClick={() => navigate('/profile')}>
                        <div className={styles.avatarWrap}>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher" alt="User" className={styles.userAvatar} />
                        </div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user?.fullName || 'Teacher'}</div>
                            <div className={styles.userRole}>Instructor</div>
                        </div>
                        <button
                            className={styles.logoutBtn}
                            onClick={(e) => { e.stopPropagation(); logout(); }}
                            title="Logout"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
