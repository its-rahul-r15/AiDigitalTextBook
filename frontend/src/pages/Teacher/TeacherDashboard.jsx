import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './TeacherDashboard.module.css';
import { useAuthStore } from '../../store/authStore';
import { contentService } from '../../services/content.service';
import Card from '../../components/ui/Card/Card';
import Spinner from '../../components/ui/Spinner/Spinner';
import Badge from '../../components/ui/Badge/Badge';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        contentService.getCourses()
            .then(({ data }) => setCourses(data.data || []))
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className={styles.page}>

            {/* Welcome banner */}
            <div className={styles.banner}>
                <div className={styles.bannerLeft}>
                    <span className={styles.bannerTag}>TEACHER DASHBOARD</span>
                    <h1>{greeting}, {user?.fullName?.split(' ')[0] || 'Teacher'} 👩‍🏫</h1>
                    <p>Manage your courses, chapters, and student progress from here.</p>
                </div>
                <div className={styles.bannerArt}>📚</div>
            </div>

            {/* Quick stats */}
            <div className={styles.statsRow}>
                <div className={styles.stat}>
                    <span className={styles.statNum}>{courses.length}</span>
                    <span className={styles.statLabel}>Published Courses</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>
                        {courses.reduce((sum, c) => sum + (c.chapterCount || 0), 0)}
                    </span>
                    <span className={styles.statLabel}>Total Chapters</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>—</span>
                    <span className={styles.statLabel}>Active Students</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>—</span>
                    <span className={styles.statLabel}>Avg. Progress</span>
                </div>
            </div>

            {/* Courses list */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Your Courses</h2>
                    <Badge variant="primary">{courses.length} published</Badge>
                </div>

                {loading && <div className={styles.center}><Spinner size="lg" /></div>}

                {!loading && courses.length === 0 && (
                    <div className={styles.empty}>
                        <span>📗</span>
                        <p>No published courses yet. Create a course from the admin panel and set it to published.</p>
                    </div>
                )}

                {!loading && courses.length > 0 && (
                    <div className={styles.grid}>
                        {courses.map((course) => (
                            <Card key={course._id} hover className={styles.courseCard}>
                                <div className={styles.courseHead}>
                                    <div className={styles.courseIcon}>📖</div>
                                    <div>
                                        <h3 className={styles.courseTitle}>{course.title}</h3>
                                        <p className={styles.courseSub}>{course.subject} · Class {course.grade} · {course.board}</p>
                                    </div>
                                </div>
                                <div className={styles.courseStats}>
                                    <span>{course.chapterCount || 0} chapters</span>
                                    <span className={styles.lang}>{course.language === 'hi' ? '🇮🇳 Hindi' : '🇬🇧 English'}</span>
                                </div>
                                <div className={styles.courseActions}>
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => navigate(`/learn?courseId=${course._id}`)}
                                    >
                                        View Chapters
                                    </button>
                                    <button className={styles.actionBtnSecondary}>Analytics</button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick actions */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actions}>
                    {[
                        { icon: '📚', label: 'Create Course', hint: 'Start a new subject or course', link: '/teacher/create-course' },
                        { icon: '➕', label: 'Create Chapter', hint: 'Add a new chapter to a course', link: '/teacher/create-chapter' },
                        { icon: '📝', label: 'Assign Exercise', hint: 'Set exercises for students' },
                        { icon: '📊', label: 'View Analytics', hint: 'Track student performance', link: '/teacher/students' },
                        { icon: '💬', label: 'Ask AI Tutor', hint: 'Get AI suggestions for lessons', link: '/ai-chat' },
                    ].map((a) => (
                        <NavLink key={a.label} to={a.link || '#'} className={styles.actionNavLink}>
                            <Card hover className={styles.actionCard}>
                                <span className={styles.actionIcon}>{a.icon}</span>
                                <div>
                                    <p className={styles.actionLabel}>{a.label}</p>
                                    <p className={styles.actionHint}>{a.hint}</p>
                                </div>
                            </Card>
                        </NavLink>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default TeacherDashboard;
