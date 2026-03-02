import { useState, useEffect } from 'react';
import styles from './ProfilePage.module.css';
import { useAuthStore } from '../../store/authStore';
import { gamificationService } from '../../services/gamification.service';
import Badge from '../../components/ui/Badge/Badge';
import Spinner from '../../components/ui/Spinner/Spinner';
import Card from '../../components/ui/Card/Card';

const ProfilePage = () => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        gamificationService.getProfile()
            .then(({ data }) => setStats(data.data))
            .catch((err) => setError(err.response?.data?.message || 'Could not load profile stats.'))
            .finally(() => setLoading(false));
    }, []);

    // Real values from backend: xp, level, xpProgress (0-99), xpForNextLevel, currentStreak, longestStreak
    const xp = stats?.xp ?? 0;
    const level = stats?.level ?? 1;
    const xpProgress = stats?.xpProgress ?? 0;   // XP within current level (0–99)
    const xpToNext = stats?.xpForNextLevel ?? 100; // total XP needed for next level
    const streak = stats?.currentStreak ?? 0;
    const longestStreak = stats?.longestStreak ?? 0;
    const badges = stats?.recentBadges ?? [];
    const pct = Math.min(100, Math.round((xpProgress / xpToNext) * 100));

    const R = 56;
    const CIRC = 2 * Math.PI * R;
    const offset = CIRC - (pct / 100) * CIRC;

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <h2>Personal Mastery</h2>
                <button className={styles.settingsBtn}>⚙️</button>
            </div>

            {/* Avatar */}
            <div className={styles.avatarSection}>
                <div className={styles.avatarWrap}>
                    <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || 'A'}</div>
                    <div className={styles.levelBadge}>LVL {level}</div>
                </div>
                <h3 className={styles.userName}>{user?.name || '—'}</h3>
                <p className={styles.userRole}>{user?.role || 'student'}</p>
            </div>

            {/* XP ring */}
            <div className={styles.masteryRingWrap}>
                {loading ? (
                    <div className={styles.spinnerWrap}><Spinner size="lg" /></div>
                ) : (
                    <>
                        <svg className={styles.ring} viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border-light)" strokeWidth="10" />
                            <circle cx="70" cy="70" r={R} fill="none" stroke="url(#ringGrad)"
                                strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={CIRC} strokeDashoffset={offset}
                                transform="rotate(-90 70 70)"
                                style={{ transition: 'stroke-dashoffset 1s ease' }} />
                            <defs>
                                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgb(67,97,238)" />
                                    <stop offset="100%" stopColor="rgb(88,114,255)" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className={styles.ringText}>
                            <span className={styles.ringPct}>{pct}%</span>
                            <span className={styles.ringLabel}>LEVEL {level} PROGRESS</span>
                        </div>
                    </>
                )}
            </div>

            {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

            {/* Stats row */}
            {!loading && stats && (
                <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                        <span className={styles.statNum}>{xp}</span>
                        <span className={styles.statLabel}>Total XP</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNum}>{streak}</span>
                        <span className={styles.statLabel}>Day Streak 🔥</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNum}>{longestStreak}</span>
                        <span className={styles.statLabel}>Best Streak</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNum}>{badges.length}</span>
                        <span className={styles.statLabel}>Badges</span>
                    </div>
                </div>
            )}

            {/* XP progress */}
            {!loading && stats && (
                <Card className={styles.xpCard}>
                    <div className={styles.xpTop}>
                        <div>
                            <p className={styles.xpHint}>XP to next level</p>
                            <h3 className={styles.xpNum}>{xpProgress} / {xpToNext} XP</h3>
                        </div>
                        <span className={styles.xpIcon}>📈</span>
                    </div>
                    <div className={styles.xpBar}>
                        <div className={styles.xpFill} style={{ width: `${pct}%` }} />
                    </div>
                </Card>
            )}

            {/* Recent badges */}
            {!loading && badges.length > 0 && (
                <section>
                    <div className={styles.sectionRow}>
                        <h4>Recent Badges</h4>
                        <Badge variant="primary">{badges.length} earned</Badge>
                    </div>
                    <div className={styles.badgeList}>
                        {badges.map((b) => (
                            <div key={b._id} className={styles.badgeCard}>
                                <span className={styles.badgeIcon}>🏅</span>
                                <span className={styles.badgeName}>{b.badgeName}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <button className={styles.logoutBtn} onClick={logout}>Sign Out</button>
        </div>
    );
};

export default ProfilePage;
