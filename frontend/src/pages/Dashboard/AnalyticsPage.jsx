import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './AnalyticsPage.module.css';
import { analyticsService } from '../../services/analytics.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { useAuthStore } from '../../store/authStore';

// ──────────────────────────────────────────────────────────────────────────────
// Helper: Format date to short label (e.g. "Feb 1")
// ──────────────────────────────────────────────────────────────────────────────
const fmtDate = (str) => {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ──────────────────────────────────────────────────────────────────────────────
// Line Chart (Pure SVG — no library)
// Works with data = [{ date, accuracy, avgScore, attempts }]
// ──────────────────────────────────────────────────────────────────────────────
const LineChart = ({ data = [], field = 'accuracy', color = '#6366F1', label = 'Accuracy %' }) => {
    if (!data.length) {
        return (
            <div className={styles.chartEmpty}>
                <p>📊 No performance data yet</p>
                <p>Complete practice sessions to see your trend</p>
            </div>
        );
    }

    const W = 540, H = 160, PAD = 32;
    const values = data.map(d => d[field] ?? 0);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    const pts = values.map((v, i) => ({
        x: PAD + (i / (values.length - 1 || 1)) * (W - PAD * 2),
        y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
        v,
        date: data[i]?.date,
    }));

    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD = `${pathD} L${pts[pts.length - 1].x},${H - PAD} L${pts[0].x},${H - PAD} Z`;

    // Grid lines
    const gridLines = [0, 25, 50, 75, 100].map(pct => ({
        y: PAD + (1 - pct / 100) * (H - PAD * 2),
        label: Math.round(min + (pct / 100) * range),
    }));

    return (
        <div className={styles.chartWrapper}>
            <svg viewBox={`0 0 ${W} ${H}`} className={styles.lineChart}>
                <defs>
                    <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Grid */}
                {gridLines.map((g, i) => (
                    <g key={i}>
                        <line x1={PAD} y1={g.y} x2={W - PAD} y2={g.y}
                            stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={PAD - 4} y={g.y + 4} fontSize="9" fill="#9CA3AF" textAnchor="end">
                            {g.label}
                        </text>
                    </g>
                ))}
                {/* Area fill */}
                <path d={areaD} fill={`url(#grad-${field})`} />
                {/* Line */}
                <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
                {/* Dots */}
                {pts.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
                        <title>{fmtDate(p.date)}: {p.v}{field === 'accuracy' || field === 'avgScore' ? '%' : ''}</title>
                    </g>
                ))}
                {/* X labels (show first, middle, last) */}
                {[0, Math.floor(pts.length / 2), pts.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => (
                    <text key={i} x={pts[i]?.x} y={H - 4} fontSize="9" fill="#9CA3AF" textAnchor="middle">
                        {fmtDate(pts[i]?.date)}
                    </text>
                ))}
            </svg>
            <p className={styles.chartLabel}>{label}</p>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Heatmap (full 365 days)
// ──────────────────────────────────────────────────────────────────────────────
const FullHeatmap = ({ data = [] }) => {
    const map = {};
    data.forEach(d => { map[d.date] = d; });
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Generate all 52 weeks × 7 days (364 days + today)
    const days = [];
    for (let i = 363; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const entry = map[key];
        days.push({ key, count: entry?.count || 0, accuracy: entry?.accuracy || 0 });
    }

    return (
        <div className={styles.fullHeatmap}>
            {days.map((d, i) => (
                <div
                    key={i}
                    className={styles.heatSquare}
                    title={`${d.key}: ${d.count} attempt${d.count !== 1 ? 's' : ''} ${d.count ? `(${d.accuracy}% accuracy)` : ''}`}
                    style={{
                        background: d.count
                            ? `rgba(99, 102, 241, ${0.1 + (d.count / maxCount) * 0.9})`
                            : '#F3F4F6',
                    }}
                />
            ))}
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Skill Bar (horizontal)
// ──────────────────────────────────────────────────────────────────────────────
const SkillBar = ({ name, level, trend, attempts }) => {
    const color = level >= 70 ? '#10B981' : level >= 40 ? '#6366F1' : '#EF4444';
    const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
    const trendColor = trend === 'improving' ? '#10B981' : trend === 'declining' ? '#EF4444' : '#9CA3AF';

    return (
        <div className={styles.skillRow}>
            <div className={styles.skillMeta}>
                <span className={styles.skillName}>{name}</span>
                <div className={styles.skillRight}>
                    <span style={{ color: trendColor, fontSize: 13, fontWeight: 700 }}>{trendIcon}</span>
                    <span className={styles.skillPct} style={{ color }}>{level}%</span>
                    <span className={styles.skillAttempts}>{attempts} tries</span>
                </div>
            </div>
            <div className={styles.skillBar}>
                <div className={styles.skillFill} style={{ width: `${level}%`, background: color }} />
            </div>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Main Analytics Page
// ──────────────────────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
    const user = useAuthStore(s => s.user);
    const [progress, setProgress] = useState(null);
    const [skills, setSkills] = useState([]);
    const [weakAreas, setWeakAreas] = useState([]);
    const [heatmap, setHeatmap] = useState([]);
    const [performance, setPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);
    const [activeChart, setActiveChart] = useState('accuracy');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [progRes, skillRes, weakRes, heatmapRes, perfRes] = await Promise.all([
                    analyticsService.getProgress(),
                    analyticsService.getSkills(),
                    analyticsService.getWeakAreas(),
                    analyticsService.getHeatmap(),
                    analyticsService.getDailyPerformance(days),
                ]);
                setProgress(progRes.data?.data || null);
                setSkills(skillRes.data?.data?.skills || []);
                setWeakAreas(weakRes.data?.data || []);
                setHeatmap(heatmapRes.data?.data?.heatmap || []);
                setPerformance(perfRes.data?.data?.performance || []);
            } catch {
                setError('Failed to load analytics. Check your connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [days]);

    if (loading) return <div className={styles.center}><Spinner /></div>;

    const accuracy = progress?.accuracy ?? 0;
    const recentAccuracy = progress?.recentAccuracy ?? 0;
    const mastery = progress?.overallMastery ?? 0;
    const streak = progress?.streak ?? 0;
    const totalAttempts = progress?.totalAttempts ?? 0;
    const correctAttempts = progress?.correctAttempts ?? 0;
    const avgScore = progress?.avgScore ?? 0;
    const hintsUsed = progress?.hintsUsed ?? 0;
    const totalTime = progress?.totalTimeMinutes ?? 0;
    const studyTimeMins = progress?.studyTimeMinutes ?? 0;
    const goalMins = progress?.weeklyGoalMinutes ?? 960;
    const goalPct = Math.min(100, Math.round((studyTimeMins / goalMins) * 100));
    const difficulty = progress?.currentDifficulty ?? 3;
    const diffLabel = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'][difficulty] || 'Medium';
    const completedCh = progress?.completedChapters ?? 0;

    const firstName = user?.name?.split(' ')[0] || 'Learner';

    const chartOptions = [
        { key: 'accuracy', label: 'Accuracy %', color: '#6366F1' },
        { key: 'avgScore', label: 'Avg Score %', color: '#10B981' },
        { key: 'attempts', label: 'Daily Attempts', color: '#F59E0B' },
    ];
    const selected = chartOptions.find(c => c.key === activeChart);

    return (
        <div className={styles.page}>
            {/* ── Page Header ── */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>📊 Learning Analytics</h1>
                    <p className={styles.pageSub}>Full detailed report for <strong>{firstName}</strong></p>
                </div>
                <Link to="/dashboard" className={styles.backBtn} id="back-to-dashboard">
                    ← Dashboard
                </Link>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* ── Overview Stats ── */}
            <div className={styles.statsGrid}>
                {[
                    { icon: '🎯', label: 'Overall Accuracy', value: `${accuracy}%`, sub: `${correctAttempts}/${totalAttempts} correct`, color: '#6366F1' },
                    { icon: '📈', label: 'Recent Accuracy', value: `${recentAccuracy}%`, sub: 'Last 50 attempts', color: '#8B5CF6' },
                    { icon: '⚡', label: 'Overall Mastery', value: `${mastery}%`, sub: `Level: ${diffLabel}`, color: '#10B981' },
                    { icon: '🔥', label: 'Study Streak', value: `${streak} days`, sub: streak > 0 ? 'Active!' : 'No streak yet', color: '#F59E0B' },
                    { icon: '📚', label: 'Total Attempts', value: totalAttempts, sub: `Avg score: ${avgScore}%`, color: '#EF4444' },
                    { icon: '🕓', label: 'Total Study Time', value: `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`, sub: 'All time', color: '#06B6D4' },
                    { icon: '✅', label: 'Chapters Completed', value: completedCh, sub: `${goalPct}% weekly goal`, color: '#84CC16' },
                    { icon: '💡', label: 'Hints Used', value: hintsUsed, sub: 'Total across all sessions', color: '#F97316' },
                ].map((s, i) => (
                    <div key={i} className={styles.statCard} id={`analytics-stat-${i}`}>
                        <div className={styles.statIcon} style={{ background: `${s.color}18`, color: s.color }}>
                            {s.icon}
                        </div>
                        <p className={styles.statLabel}>{s.label}</p>
                        <p className={styles.statValue} style={{ color: s.color }}>{s.value}</p>
                        <p className={styles.statSub}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Performance Trend ── */}
            <div className={styles.section} id="section-performance-trend">
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Performance Trend</h2>
                    <div className={styles.controls}>
                        <div className={styles.chartTabs}>
                            {chartOptions.map(c => (
                                <button
                                    key={c.key}
                                    id={`tab-${c.key}`}
                                    className={`${styles.chartTab} ${activeChart === c.key ? styles.chartTabActive : ''}`}
                                    onClick={() => setActiveChart(c.key)}
                                    style={activeChart === c.key ? { borderColor: c.color, color: c.color } : {}}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                        <select
                            id="days-select"
                            className={styles.select}
                            value={days}
                            onChange={e => setDays(Number(e.target.value))}
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={60}>Last 60 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </div>
                </div>
                <LineChart
                    data={performance}
                    field={selected?.key}
                    color={selected?.color}
                    label={`${selected?.label} over the last ${days} days`}
                />
            </div>

            {/* ── Skills + Weak Areas ── */}
            <div className={styles.twoCol}>
                {/* Skill Breakdown */}
                <div className={styles.section} id="section-skills">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Skill Breakdown</h2>
                        <span className={styles.count}>{skills.length} skills</span>
                    </div>
                    {skills.length > 0 ? (
                        <div className={styles.skillList}>
                            {skills.map((s, i) => (
                                <SkillBar key={i} {...s} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyBox}>
                            <p>🎓 No skills yet</p>
                            <p>Complete practice sessions to build your skill profile</p>
                        </div>
                    )}
                </div>

                {/* Weak Areas Deep Dive */}
                <div className={styles.section} id="section-weak-areas">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Areas to Improve</h2>
                        <span className={styles.count} style={{ color: '#EF4444' }}>
                            {weakAreas.length} flagged
                        </span>
                    </div>
                    {weakAreas.length > 0 ? (
                        <div className={styles.weakList}>
                            {weakAreas.map((w, i) => (
                                <div key={i} className={styles.weakCard} id={`weak-detail-${i}`}>
                                    <div className={styles.weakHeader}>
                                        <span className={styles.weakIcon}>
                                            {w.masteryScore < 20 ? '🔴' : w.masteryScore < 35 ? '🟠' : '🟡'}
                                        </span>
                                        <div className={styles.weakInfo}>
                                            <p className={styles.weakSkill}>{w.skill}</p>
                                            <p className={styles.weakAttempts}>{w.attempts || 0} attempts</p>
                                        </div>
                                        <div className={styles.weakScoreBadge}>
                                            <span>{w.masteryScore}%</span>
                                            <small>mastery</small>
                                        </div>
                                    </div>
                                    <div className={styles.weakBar}>
                                        <div
                                            className={styles.weakBarFill}
                                            style={{
                                                width: `${w.masteryScore}%`,
                                                background: w.masteryScore < 20
                                                    ? '#EF4444'
                                                    : w.masteryScore < 35
                                                        ? '#F59E0B'
                                                        : '#6366F1'
                                            }}
                                        />
                                    </div>
                                    <p className={styles.weakTip}>💡 {w.tip}</p>
                                    <div className={styles.weakTrend} style={{
                                        color: w.trend === 'improving' ? '#10B981' : w.trend === 'declining' ? '#EF4444' : '#9CA3AF'
                                    }}>
                                        {w.trend === 'improving' ? '↑ Improving' : w.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyBox} style={{ color: '#10B981' }}>
                            <p>✅ No weak areas!</p>
                            <p>Your mastery is strong across all skills</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Activity Heatmap ── */}
            <div className={styles.section} id="section-heatmap">
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Annual Study Activity</h2>
                    <div className={styles.heatmapLegend}>
                        <span>Less</span>
                        {[0.1, 0.35, 0.55, 0.75, 1].map((o, i) => (
                            <div key={i} className={styles.legendSq}
                                style={{ background: `rgba(99,102,241,${o})` }} />
                        ))}
                        <span>More</span>
                    </div>
                </div>
                <FullHeatmap data={heatmap} />
                <p className={styles.heatmapSub}>
                    {heatmap.length > 0
                        ? `${heatmap.reduce((s, d) => s + d.count, 0)} total attempts across ${heatmap.length} active days`
                        : 'No activity recorded yet. Start practising!'}
                </p>
            </div>
        </div>
    );
};

export default AnalyticsPage;
