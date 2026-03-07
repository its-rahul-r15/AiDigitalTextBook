import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PracticeAnalyticsPage.module.css';
import { practiceService } from '../../services/practice.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const PracticeAnalyticsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        practiceService.getPracticeAnalytics(id)
            .then(({ data }) => setAnalytics(data.data))
            .catch(() => toast.error('Failed to load analytics'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className={styles.center}><Spinner size="lg" /></div>;
    if (!analytics) return <div className={styles.center}><p>Could not load analytics.</p></div>;

    const { practiceSet, summary, studentResults, notAttempted } = analytics;

    const scoreClass = (pct) =>
        pct >= 70 ? styles.scoreHigh : pct >= 40 ? styles.scoreMid : styles.scoreLow;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>📊 {practiceSet.title}</h1>
                    <p>{practiceSet.totalQuestions} questions · Analysis of all student performance</p>
                </div>
                <button className={styles.backBtn} onClick={() => navigate('/teacher/practice')}>
                    ← Back to Practice Sets
                </button>
            </div>

            {/* Summary Grid */}
            <div className={styles.summaryGrid}>
                {[
                    { emoji: '👥', val: summary.totalStudents, label: 'Total Students' },
                    { emoji: '✅', val: summary.completedCount, label: 'Completed' },
                    { emoji: '⏳', val: summary.pendingCount, label: 'Pending' },
                    { emoji: '📈', val: `${summary.avgScore}%`, label: 'Avg Score' },
                    { emoji: '🏆', val: `${summary.highestScore}%`, label: 'Highest' },
                    { emoji: '📉', val: `${summary.lowestScore}%`, label: 'Lowest' },
                ].map((s, i) => (
                    <div key={i} className={styles.summaryCard}>
                        <span className={styles.summaryEmoji}>{s.emoji}</span>
                        <span className={styles.summaryVal}>{s.val}</span>
                        <span className={styles.summaryLabel}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Results Table */}
            <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
                    <h2>Student Results</h2>
                </div>

                {studentResults.length === 0 ? (
                    <div className={styles.emptyTable}>
                        <p>🕐 No student has attempted this practice yet.</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student</th>
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentResults.map((r, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <div className={styles.studentName}>
                                            {r.student?.fullName || 'Unknown'}
                                        </div>
                                        <div className={styles.studentEmail}>
                                            {r.student?.email || ''}
                                        </div>
                                    </td>
                                    <td>{r.score} / {r.totalMarks}</td>
                                    <td>
                                        <span className={`${styles.scoreBadge} ${scoreClass(r.percentage)}`}>
                                            {r.percentage}%
                                        </span>
                                    </td>
                                    <td>{new Date(r.completedAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Not Attempted */}
                {notAttempted.length > 0 && (
                    <div className={styles.pendingSection}>
                        <div className={styles.pendingTitle}>⏳ Not Yet Attempted ({notAttempted.length})</div>
                        <div className={styles.pendingList}>
                            {notAttempted.map((s, i) => (
                                <span key={i} className={styles.pendingChip}>
                                    {s.fullName || s.email}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeAnalyticsPage;
