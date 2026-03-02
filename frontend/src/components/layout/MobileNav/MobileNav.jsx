import { NavLink } from 'react-router-dom';
import styles from './MobileNav.module.css';
import { useAuthStore } from '../../../store/authStore';

const STUDENT_NAV = [
    { to: '/learn', label: 'Learn', icon: '📖' },
    { to: '/library', label: 'Library', icon: '🏛️' },
    { to: '/ai-chat', label: 'AI Chat', icon: '🤖' },
    { to: '/notes', label: 'Notes', icon: '📝' },
    { to: '/profile', label: 'Profile', icon: '👤' },
];

const TEACHER_NAV = [
    { to: '/teacher', label: 'Dashboard', icon: '🏠' },
    { to: '/library', label: 'Courses', icon: '🏛️' },
    { to: '/ai-chat', label: 'AI Tutor', icon: '🤖' },
    { to: '/profile', label: 'Profile', icon: '👤' },
];

const MobileNav = () => {
    const user = useAuthStore((s) => s.user);
    const isTeacher = user?.role === 'teacher';
    const NAV_ITEMS = isTeacher ? TEACHER_NAV : STUDENT_NAV;

    return (
        <nav className={styles.nav}>
            {NAV_ITEMS.map(({ to, label, icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => [styles.item, isActive ? styles.active : ''].join(' ')}
                >
                    <span className={styles.icon}>{icon}</span>
                    <span className={styles.label}>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default MobileNav;
