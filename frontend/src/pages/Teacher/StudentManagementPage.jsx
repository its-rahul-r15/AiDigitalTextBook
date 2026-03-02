import { useState, useEffect } from 'react';
import styles from './StudentManagementPage.module.css';
import { teacherService } from '../../services/teacher.service';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import Spinner from '../../components/ui/Spinner/Spinner';
import Badge from '../../components/ui/Badge/Badge';
import { toast } from 'react-hot-toast';

// ─── Mini bar chart for recent 7-day activity ──────────────────────────────────
const MiniChart = ({ data = [] }) => {
    if (!data.length) return <p className={styles.noData}>No activity this week</p>;
    const max = Math.max(...data.map(d => d.attempts), 1);
    return (
        <div className={styles.miniChart}>
            {data.map((d, i) => (
                <div key={i} className={styles.miniBarWrap} title={`${d.date}: ${d.attempts} attempts (${d.accuracy}% accuracy)`}>
                    <div className={styles.miniBar} style={{ height: `${(d.attempts / max) * 100}%` }} />
                    <span className={styles.miniDate}>{d.date?.slice(5)}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Student Detail Slide-Over Panel ──────────────────────────────────────────
const StudentDetailPanel = ({ studentId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        setError(null);
        teacherService.getStudentProfile(studentId)
            .then(res => setData(res.data?.data || null))
            .catch(() => setError('Failed to load student analytics.'))
            .finally(() => setLoading(false));
    }, [studentId]);

    const diffLabels = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    const a = data?.analytics;

    return (
        <>
            {/* Backdrop */}
            <div className={styles.backdrop} onClick={onClose} />

            {/* Panel */}
            <aside className={styles.panel} id="student-detail-panel">
                <div className={styles.panelHeader}>
                    <div>
                        <h2 className={styles.panelTitle}>
                            {data?.student?.fullName || data?.student?.name || 'Student Analytics'}
                        </h2>
                        {data?.student?.email && (
                            <p className={styles.panelEmail}>{data.student.email}</p>
                        )}
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} id="close-panel-btn">✕</button>
                </div>

                {loading && (
                    <div className={styles.panelCenter}><Spinner /></div>
                )}

                {error && (
                    <div className={styles.panelError}>{error}</div>
                )}

                {!loading && !error && a && (
                    <div className={styles.panelBody}>
                        {/* ─ Stat Grid ─ */}
                        <div className={styles.statGrid}>
                            <div className={styles.statBox} id="panel-accuracy">
                                <span className={styles.statEmoji}>🎯</span>
                                <p className={styles.statVal}>{a.accuracy}%</p>
                                <p className={styles.statLbl}>Accuracy</p>
                            </div>
                            <div className={styles.statBox} id="panel-mastery">
                                <span className={styles.statEmoji}>⚡</span>
                                <p className={styles.statVal} style={{ color: '#10B981' }}>{a.overallMastery}%</p>
                                <p className={styles.statLbl}>Mastery</p>
                            </div>
                            <div className={styles.statBox} id="panel-streak">
                                <span className={styles.statEmoji}>🔥</span>
                                <p className={styles.statVal} style={{ color: '#F59E0B' }}>{a.streak}d</p>
                                <p className={styles.statLbl}>Streak</p>
                            </div>
                            <div className={styles.statBox} id="panel-attempts">
                                <span className={styles.statEmoji}>📚</span>
                                <p className={styles.statVal}>{a.totalAttempts}</p>
                                <p className={styles.statLbl}>Attempts</p>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statEmoji}>✅</span>
                                <p className={styles.statVal}>{a.avgScore}%</p>
                                <p className={styles.statLbl}>Avg Score</p>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statEmoji}>🕓</span>
                                <p className={styles.statVal}>{Math.floor(a.totalTimeMinutes / 60)}h {a.totalTimeMinutes % 60}m</p>
                                <p className={styles.statLbl}>Study Time</p>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statEmoji}>📖</span>
                                <p className={styles.statVal}>{a.completedChapters}</p>
                                <p className={styles.statLbl}>Chapters</p>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statEmoji}>💡</span>
                                <p className={styles.statVal}>{diffLabels[a.currentDifficulty] || 'Medium'}</p>
                                <p className={styles.statLbl}>Difficulty</p>
                            </div>
                        </div>

                        {/* ─ 7-Day Activity ─ */}
                        <div className={styles.panelSection}>
                            <h4 className={styles.panelSectionTitle}>7-Day Activity</h4>
                            <MiniChart data={a.recentActivity} />
                        </div>

                        {/* ─ Skill Breakdown ─ */}
                        {a.skills?.length > 0 && (
                            <div className={styles.panelSection}>
                                <h4 className={styles.panelSectionTitle}>Skill Mastery</h4>
                                <div className={styles.skillsList}>
                                    {a.skills.map((s, i) => {
                                        const color = s.level >= 70 ? '#10B981' : s.level >= 40 ? '#6366F1' : '#EF4444';
                                        const trend = s.trend === 'improving' ? '↑' : s.trend === 'declining' ? '↓' : '→';
                                        return (
                                            <div key={i} className={styles.skillRow}>
                                                <div className={styles.skillRowTop}>
                                                    <span className={styles.skillName}>{s.name}</span>
                                                    <div className={styles.skillRight}>
                                                        <span style={{ color: s.trend === 'improving' ? '#10B981' : s.trend === 'declining' ? '#EF4444' : '#9CA3AF', fontWeight: 700, fontSize: 12 }}>{trend}</span>
                                                        <span style={{ color, fontWeight: 800, fontSize: 13 }}>{s.level}%</span>
                                                    </div>
                                                </div>
                                                <div className={styles.skillBarTrack}>
                                                    <div className={styles.skillBarFill} style={{ width: `${s.level}%`, background: color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─ Weak Areas ─ */}
                        {a.weakAreas?.length > 0 && (
                            <div className={styles.panelSection}>
                                <h4 className={styles.panelSectionTitle}>
                                    ⚠️ Weak Areas
                                    <span className={styles.weakCount}>{a.weakAreas.length}</span>
                                </h4>
                                <div className={styles.weakList}>
                                    {a.weakAreas.map((w, i) => (
                                        <div key={i} className={styles.weakItem}>
                                            <span>{w.level < 20 ? '🔴' : w.level < 35 ? '🟠' : '🟡'}</span>
                                            <div className={styles.weakInfo}>
                                                <span className={styles.weakName}>{w.name}</span>
                                                <span className={styles.weakPct}>{w.level}% mastery</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {a.skills?.length === 0 && a.totalAttempts === 0 && (
                            <div className={styles.panelEmpty}>
                                <p>🎓 No activity yet</p>
                                <p>This student hasn't attempted any exercises yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </aside>
        </>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
const StudentManagementPage = () => {
    const [classroom, setClassroom] = useState(null);
    const [students, setStudents] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [showEnroll, setShowEnroll] = useState(false);
    const [emails, setEmails] = useState('');
    const [enrolling, setEnrolling] = useState(false);

    // Create Class Form
    const [showCreate, setShowCreate] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [creating, setCreating] = useState(false);

    // ── View Detail Panel ──────────────────────────────────────────────────────
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const classRes = await teacherService.getClass();
            const classroomData = classRes.data?.data;
            setClassroom(classroomData);
            setStudents(classroomData?.students || []);

            const overrideRes = await teacherService.getOverrides();
            setOverrides(overrideRes.data?.data || []);
        } catch (apiErr) {
            if (apiErr.response?.status !== 404) {
                toast.error("Failed to connect to teacher services.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) return;
        setCreating(true);
        try {
            await teacherService.createClass({ name: newClassName.trim() });
            toast.success("Classroom created successfully!");
            setShowCreate(false);
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Creation failed.");
        } finally {
            setCreating(false);
        }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        const emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
        if (emailList.length === 0 || !classroom) return;
        setEnrolling(true);
        try {
            await teacherService.enrollStudents(classroom._id, emailList);
            toast.success(`${emailList.length} students enrollment processed!`);
            setEmails('');
            setShowEnroll(false);
            loadData();
        } catch {
            toast.error("Enrollment failed.");
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <div className={styles.center}><Spinner size="lg" /></div>;

    // ─── Empty State (No Classroom) ───
    if (!classroom && !showCreate) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🏫</div>
                <h2>Prepare your Digital Classroom</h2>
                <p>You haven't initialized a classroom yet. Start by creating one to manage your students and AI overrides.</p>
                <Button primary onClick={() => setShowCreate(true)}>Create Classroom Now</Button>
            </div>
        );
    }

    // ─── Create Classroom Form ───
    if (showCreate && !classroom) {
        return (
            <div className={styles.center}>
                <Card className={styles.enrollCard}>
                    <h3>Create New Classroom</h3>
                    <form onSubmit={handleCreateClass} className={styles.createForm}>
                        <div className={styles.fieldGroup}>
                            <label>Classroom Name</label>
                            <input
                                className={styles.input}
                                placeholder="e.g. Science Section A"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.enrollActions}>
                            <button type="button" onClick={() => setShowCreate(false)}>Back</button>
                            <Button primary type="submit" loading={creating}>Initialize Class 🚀</Button>
                        </div>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* ── View Detail Slide Panel ── */}
            {selectedStudentId && (
                <StudentDetailPanel
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}

            <header className={styles.header}>
                <div>
                    <h1>{classroom.name} 👩‍🏫</h1>
                    <p>Enroll students, monitor progress, and manage AI rules</p>
                </div>
                <Button primary onClick={() => setShowEnroll(true)}>+ Enroll Students</Button>
            </header>

            {showEnroll && (
                <Card className={styles.enrollCard}>
                    <h3>Enroll Students</h3>
                    <p>Enter email addresses separated by commas. Students must have an account first.</p>
                    <form onSubmit={handleEnroll}>
                        <textarea
                            className={styles.textarea}
                            placeholder="student1@gmail.com, student2@gmail.com..."
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            rows={3}
                        />
                        <div className={styles.enrollActions}>
                            <button type="button" onClick={() => setShowEnroll(false)}>Cancel</button>
                            <Button primary type="submit" loading={enrolling}>Enroll Students</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className={styles.mainGrid}>
                {/* ── Roster ── */}
                <Card className={styles.rosterCard}>
                    <div className={styles.cardHeader}>
                        <h3>Class Roster</h3>
                        <Badge variant="emerald">{students.length} Student{students.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    {students.length > 0 ? (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Progress</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s._id}>
                                        <td>
                                            <div className={styles.studentName}>
                                                <strong>{s.fullName || s.name || 'New Learner'}</strong>
                                                <span>{s.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.barContainer}>
                                                <div className={styles.progressTrack}>
                                                    <div className={styles.bar} style={{ width: `${s.courseProgress || 0}%` }} />
                                                </div>
                                                <span>{s.courseProgress || 0}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.viewBtn}
                                                id={`view-detail-${s._id}`}
                                                onClick={() => setSelectedStudentId(s._id)}
                                            >
                                                View Details →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={styles.emptyRoster}>
                            <p>No students enrolled yet.</p>
                            <Button onClick={() => setShowEnroll(true)}>Enroll First Student</Button>
                        </div>
                    )}
                </Card>

                {/* ── AI Overrides ── */}
                <Card className={styles.sideCard}>
                    <div className={styles.cardHeader}>
                        <h3>AI Behaviour</h3>
                        <Badge variant="primary">{overrides.length}</Badge>
                    </div>
                    <div className={styles.overridesList}>
                        {overrides.length > 0 ? overrides.map((o, idx) => (
                            <div key={idx} className={styles.overrideItem}>
                                <div>
                                    <p className={styles.ovTarget}>{o.rule}</p>
                                    <p className={styles.ovVal}>{o.value}</p>
                                </div>
                                <button className={styles.delBtn}>×</button>
                            </div>
                        )) : (
                            <div className={styles.emptyOverrides}>
                                <p>No active AI overrides.</p>
                                <button className={styles.setBtn}>Add Rule</button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentManagementPage;
