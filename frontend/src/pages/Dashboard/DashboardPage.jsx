import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { contentService } from '../../services/content.service';
import { analyticsService } from '../../services/analytics.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { useAuthStore } from '../../store/authStore';

// ──────────────────────────────────────────────────
// Mini Circular Progress (SVG — no library needed)
// ──────────────────────────────────────────────────
const CircularProgress = ({ value, size = 80, stroke = 7, color = 'var(--primary)' }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (value / 100) * circ;
    return (
        <svg width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
                fontSize={size * 0.2} fontWeight="800" fill="var(--text-primary)">
                {value}%
            </text>
        </svg>
    );
};

// ──────────────────────────────────────────────────
// Mini Sparkline (last 7 days bar chart)
// ──────────────────────────────────────────────────
const Sparkline = ({ data = [], color = 'var(--primary)' }) => {
    if (!data.length) return <div className={styles.sparklineEmpty}>No data yet</div>;
    const max = Math.max(...data.map(d => d.accuracy || 0), 1);
    return (
        <div className={styles.sparkline}>
            {data.slice(-7).map((d, i) => (
                <div key={i} className={styles.sparkBar} title={`${d.date}: ${d.accuracy}%`}>
                    <div
                        className={styles.sparkFill}
                        style={{ height: `${((d.accuracy || 0) / max) * 100}%`, background: color }}
                    />
                </div>
            ))}
        </div>
    );
};

// ──────────────────────────────────────────────────
// Heatmap (last 28 days)
// ──────────────────────────────────────────────────
const Heatmap = ({ data = [] }) => {
    // Build a map of date → count
    const map = {};
    data.forEach(d => { map[d.date] = d.count; });
    const maxCount = Math.max(...Object.values(map), 1);

    const days = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const count = map[key] || 0;
        days.push({ key, count, label: `${key}: ${count} attempt${count !== 1 ? 's' : ''}` });
    }

    return (
        <div className={styles.heatmap}>
            {days.map(d => (
                <div
                    key={d.key}
                    className={styles.heatSquare}
                    title={d.label}
                    style={{
                        background: d.count
                            ? `rgba(99, 102, 241, ${0.15 + (d.count / maxCount) * 0.85})`
                            : '#F3F4F6'
                    }}
                />
            ))}
        </div>
    );
};

// ──────────────────────────────────────────────────
// Main Dashboard Page
// ──────────────────────────────────────────────────
const DashboardPage = () => {
    const user = useAuthStore(s => s.user);
    const [progress, setProgress] = useState(null);
    const [skills, setSkills] = useState([]);
    const [weakAreas, setWeakAreas] = useState([]);
    const [heatmap, setHeatmap] = useState([]);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            const [progRes, skillRes, weakRes, heatmapRes, perfRes] = await Promise.all([
                analyticsService.getProgress(),
                analyticsService.getSkills(),
                analyticsService.getWeakAreas(),
                analyticsService.getHeatmap(),
                analyticsService.getDailyPerformance(30),
            ]);
            setProgress(progRes.data?.data || progRes.data || null);
            setSkills(skillRes.data?.data?.skills || []);
            setWeakAreas(weakRes.data?.data || []);
            setHeatmap(heatmapRes.data?.data?.heatmap || []);
            setPerformance(perfRes.data?.data?.performance || []);
        } catch (e) {
            setError('Could not load analytics. Please ensure you are logged in and have activity data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className={styles.center}><Spinner /></div>;

    const studyHours = progress ? Math.floor((progress.studyTimeMinutes || 0) / 60) : 0;
    const studyMins = progress ? (progress.studyTimeMinutes || 0) % 60 : 0;
    const goalHours = progress ? Math.floor((progress.weeklyGoalMinutes || 960) / 60) : 16;
    const goalPct = progress
        ? Math.min(100, Math.round(((progress.studyTimeMinutes || 0) / (progress.weeklyGoalMinutes || 960)) * 100))
        : 0;
    const accuracy = progress?.accuracy ?? 0;
    const mastery = progress?.overallMastery ?? 0;
    const streak = progress?.streak ?? 0;

    // Difficulty label
    const diffLabels = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
    const difficulty = progress?.currentDifficulty || 3;

    const firstName = user?.name?.split(' ')[0] || 'Learner';

    return (
        <div className={styles.page}>
            {/* ── Header ── */}
            <header className={styles.header}>
                <div className={styles.welcome}>
                    <h1 className={styles.title}>
                        Welcome back, <span className={styles.highlight}>{firstName}</span> 👋
                    </h1>
                    <p className={styles.sub}>Your personalised learning analytics for today</p>
                </div>
                <div className={styles.headerActions}>
                    <Link to="/analytics" className={styles.detailsBtn} id="view-analytics-btn">
                        View Full Analytics →
                    </Link>
                    <Link to="/practice" className={styles.quickPracticeBtn} id="quick-practice-btn">
                        Start Practice ✦
                    </Link>
                </div>
            </header>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* ── Stat Cards Row ── */}
            <div className={styles.statsRow}>
                <div className={styles.statCard} id="stat-accuracy">
                    <div className={styles.statIcon} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>🎯</div>
                    <div>
                        <p className={styles.statLabel}>Accuracy</p>
                        <p className={styles.statValue}>{accuracy}%</p>
                        <p className={styles.statSub}>{progress?.totalAttempts ?? 0} total attempts</p>
                    </div>
                </div>
                <div className={styles.statCard} id="stat-mastery">
                    <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>⚡</div>
                    <div>
                        <p className={styles.statLabel}>Overall Mastery</p>
                        <p className={styles.statValue} style={{ color: '#10B981' }}>{mastery}%</p>
                        <p className={styles.statSub}>Level: {diffLabels[difficulty]}</p>
                    </div>
                </div>
                <div className={styles.statCard} id="stat-streak">
                    <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>🔥</div>
                    <div>
                        <p className={styles.statLabel}>Study Streak</p>
                        <p className={styles.statValue} style={{ color: '#F59E0B' }}>{streak} day{streak !== 1 ? 's' : ''}</p>
                        <p className={styles.statSub}>{streak > 0 ? 'Keep it up!' : 'Start your streak today!'}</p>
                    </div>
                </div>
                <div className={styles.statCard} id="stat-chapters">
                    <div className={styles.statIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>📚</div>
                    <div>
                        <p className={styles.statLabel}>Chapters Done</p>
                        <p className={styles.statValue} style={{ color: '#EF4444' }}>{progress?.completedChapters ?? 0}</p>
                        <p className={styles.statSub}>Avg score: {progress?.avgScore ?? 0}%</p>
                    </div>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className={styles.grid}>
                {/* Weekly Goal */}
                <div className={`${styles.card} ${styles.goalCard}`} id="card-weekly-goal">
                    <div className={styles.cardHeader}>
                        <h3>Weekly Goal</h3>
                        <span className={`${styles.badge} ${goalPct >= 100 ? styles.badgeSuccess : ''}`}>{goalPct}%</span>
                    </div>
                    <div className={styles.goalBody}>
                        <CircularProgress value={goalPct} size={90} />
                        <div className={styles.goalInfo}>
                            <p className={styles.goalTime}>
                                <strong>{studyHours}h {studyMins}m</strong> studied
                            </p>
                            <p className={styles.goalTarget}>Goal: {goalHours}h per week</p>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${goalPct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skill Mastery */}
                <div className={styles.card} id="card-skill-mastery">
                    <div className={styles.cardHeader}>
                        <h3>Skill Mastery</h3>
                        <span className={styles.cardMeta}>{skills.length} skills tracked</span>
                    </div>
                    <div className={styles.skillList}>
                        {skills.length > 0 ? (
                            skills.slice(0, 4).map(skill => (
                                <div key={skill.name} className={styles.skillItem}>
                                    <div className={styles.skillInfo}>
                                        <span>{skill.name}</span>
                                        <div className={styles.skillMeta}>
                                            {skill.trend === 'improving' && <span className={styles.trendUp}>↑</span>}
                                            {skill.trend === 'declining' && <span className={styles.trendDown}>↓</span>}
                                            {skill.trend === 'stable' && <span className={styles.trendStable}>→</span>}
                                            <span>{skill.level}%</span>
                                        </div>
                                    </div>
                                    <div className={styles.skillBar}>
                                        <div
                                            className={styles.skillFill}
                                            style={{
                                                width: `${skill.level}%`,
                                                background: skill.level >= 70
                                                    ? '#10B981'
                                                    : skill.level >= 40
                                                        ? '#6366F1'
                                                        : '#EF4444'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>🎓 No skills tracked yet</p>
                                <p className={styles.emptyHint}>Complete practice sessions to see your skill breakdown</p>
                            </div>
                        )}
                    </div>
                    {skills.length > 4 && (
                        <Link to="/analytics" className={styles.viewMore}>+{skills.length - 4} more skills →</Link>
                    )}
                </div>

                {/* Performance Sparkline (Last 7 days) */}
                <div className={styles.card} id="card-performance-trend">
                    <div className={styles.cardHeader}>
                        <h3>7-Day Accuracy Trend</h3>
                        <span className={styles.cardMeta}>
                            {performance.length > 0
                                ? `Latest: ${performance[performance.length - 1]?.accuracy ?? 0}%`
                                : 'No data'}
                        </span>
                    </div>
                    <Sparkline data={performance} color="#6366F1" />
                    <p className={styles.sparklineLabel}>
                        {performance.length > 0
                            ? `Based on ${performance.reduce((s, d) => s + d.attempts, 0)} attempts`
                            : 'Start practising to see your trend'}
                    </p>
                </div>

                {/* Weak Areas */}
                <div className={styles.card} id="card-weak-areas">
                    <div className={styles.cardHeader}>
                        <h3>Areas to Improve</h3>
                        <span className={styles.badge} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                            {weakAreas.length} weak
                        </span>
                    </div>
                    <div className={styles.tipsList}>
                        {weakAreas.length > 0 ? (
                            weakAreas.slice(0, 3).map((item, idx) => (
                                <div key={idx} className={styles.tipItem} id={`weak-area-${idx}`}>
                                    <span className={styles.tipIcon}>
                                        {item.masteryScore < 20 ? '🔴' : item.masteryScore < 35 ? '🟠' : '🟡'}
                                    </span>
                                    <div className={styles.tipContent}>
                                        <div className={styles.tipTop}>
                                            <p className={styles.tipArea}>{item.skill}</p>
                                            <span className={styles.tipScore}>{item.masteryScore}%</span>
                                        </div>
                                        <p className={styles.tipText}>{item.tip}</p>
                                        <div className={styles.tipBar}>
                                            <div
                                                className={styles.tipBarFill}
                                                style={{ width: `${item.masteryScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>✅ No weak areas detected!</p>
                                <p className={styles.emptyHint}>Keep practising to maintain your skills</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Heatmap */}
                <div className={`${styles.card} ${styles.heatmapCard}`} id="card-heatmap">
                    <div className={styles.cardHeader}>
                        <h3>Study Consistency</h3>
                        <span className={styles.cardMeta}>Last 28 days</span>
                    </div>
                    <Heatmap data={heatmap} />
                    <div className={styles.heatmapLegend}>
                        <span>Less</span>
                        {[0.15, 0.35, 0.55, 0.75, 1].map((o, i) => (
                            <div key={i} className={styles.legendSquare}
                                style={{ background: `rgba(99, 102, 241, ${o})` }} />
                        ))}
                        <span>More</span>
                    </div>
                </div>
            </div>

            {/* ── Quick Links ── */}
            <div className={styles.quickLinks}>
                <Link to="/analytics" id="full-analytics-link" className={styles.quickLink}>
                    📊 Full Analytics Report
                </Link>
                <Link to="/practice" id="practice-link" className={styles.quickLink}>
                    🎯 Start Practice
                </Link>
                <Link to="/library" id="library-link" className={styles.quickLink}>
                    📚 Browse Library
                </Link>
                <Link to="/notes" id="notes-link" className={styles.quickLink}>
                    📝 Smart Notes
                </Link>
            </div>
        </div>
    );
};

export default DashboardPage;
