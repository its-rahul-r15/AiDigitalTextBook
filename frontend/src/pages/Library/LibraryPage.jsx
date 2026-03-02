import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LibraryPage.module.css';
import { contentService } from '../../services/content.service';
import Card from '../../components/ui/Card/Card';
import Spinner from '../../components/ui/Spinner/Spinner';

const SUBJECT_COLORS = {
    Mathematics: { bg: 'rgba(217,48,37,0.08)', color: 'var(--danger)' },
    Science: { bg: 'rgba(67,97,238,0.08)', color: 'var(--primary)' },
    'Social Science': { bg: 'rgba(52,168,83,0.08)', color: 'var(--accent-green)' },
    Hindi: { bg: 'rgba(249,168,37,0.1)', color: 'var(--warning)' },
    English: { bg: 'rgba(67,97,238,0.08)', color: 'var(--primary)' },
    Other: { bg: 'rgba(95,99,104,0.08)', color: 'var(--text-secondary)' },
};

const LibraryPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        contentService.getCourses()
            .then(({ data }) => setCourses(data.data || []))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load courses.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = courses.filter((c) =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.subject?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Library</h1>
                <p>Browse your published courses</p>
            </div>

            <div className={styles.searchWrap}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    className={styles.search}
                    placeholder="Search by title or subject..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading && <div className={styles.center}><Spinner size="lg" /></div>}

            {error && (
                <div className={styles.errorState}>
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className={styles.emptyState}>
                    <span>📚</span>
                    <p>{search ? 'No courses match your search.' : 'No published courses yet. Ask your teacher to publish a course.'}</p>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className={styles.grid}>
                    {filtered.map((course) => {
                        const clr = SUBJECT_COLORS[course.subject] || SUBJECT_COLORS.Other;
                        return (
                            <Card key={course._id} hover className={styles.courseCard}>
                                <div className={styles.subjectPill} style={{ background: clr.bg, color: clr.color }}>
                                    {course.subject || 'General'}
                                </div>
                                <h3 className={styles.courseTitle}>{course.title}</h3>
                                <div className={styles.courseMeta}>
                                    <div className={styles.courseMetaLeft}>
                                        {course.grade && <span className={styles.metaTag}>Class {course.grade}</span>}
                                        {course.board && <span className={styles.metaTag}>{course.board}</span>}
                                        {course.language && <span className={styles.metaTag}>{course.language === 'hi' ? 'Hindi' : 'English'}</span>}
                                    </div>
                                    <span className={styles.chapCount}>{course.chapterCount || 0} chapters</span>
                                </div>
                                <button
                                    className={styles.openBtn}
                                    onClick={() => navigate(`/learn?courseId=${course._id}`)}
                                >
                                    Open →
                                </button>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LibraryPage;
