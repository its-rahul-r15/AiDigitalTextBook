import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

const LandingPage = () => (
    <div className={styles.page}>
        <header className={styles.header}>
            <div className={styles.brand}>
                <div className={styles.brandIcon}>✦</div>
                <span className={styles.brandName}>Ai Digital <span>Text Book</span></span>
            </div>
            <Link to="/login" className={styles.signIn}>Sign In</Link>
        </header>

        <main className={styles.main}>
            <div className={styles.hero}>
                <div className={styles.aiPill}>
                    <span className={styles.dot} />
                    AI-POWERED LEARNING
                </div>

                <h1 className={styles.headline}>
                    Personalized<br />
                    <span className={styles.highlight}>Smart Learning</span>
                </h1>
                <p className={styles.sub}>
                    Experience the future of education with AI-powered interactive textbooks
                    tailored to your unique learning style.
                </p>

                <div className={styles.cards}>
                    <Link to="/register" className={styles.roleCard}>
                        <div className={styles.roleIcon} style={{ background: 'rgba(67,97,238,0.1)' }}>🎓</div>
                        <div>
                            <h3>Student</h3>
                            <p>Interactive paths and personalized study aids.</p>
                        </div>
                    </Link>

                    <Link to="/register" className={styles.roleCard}>
                        <div className={styles.roleIcon} style={{ background: 'rgba(52,168,83,0.1)' }}>👩‍🏫</div>
                        <div>
                            <h3>Teacher</h3>
                            <p>Automated grading and insight dashboards.</p>
                        </div>
                    </Link>
                </div>

                <Link to="/register" className={styles.cta}>
                    Start Smart Learning →
                </Link>
            </div>

            <div className={styles.visual}>
                <div className={styles.floatCard}>
                    <div className={styles.fcTop}>
                        <span className={styles.fcDot} />
                        <span>Adaptive Mode Active</span>
                    </div>
                    <div className={styles.fcStat}>
                        <span className={styles.fcNum}>87%</span>
                        <span>Topic Mastery</span>
                    </div>
                    <div className={styles.fcBar}><div className={styles.fcFill} style={{ width: '87%' }} /></div>
                </div>

                <div className={styles.floatCard2}>
                    <div>⚡ AI Generated Quiz</div>
                    <div className={styles.fcSubtext}>5 questions · 2 min</div>
                </div>

                <div className={styles.rings}>
                    <div className={styles.ring1} />
                    <div className={styles.ring2} />
                    <div className={styles.centerDot}>✦</div>
                </div>
            </div>
        </main>

        <footer className={styles.footer}>
            © 2024 Ai Digital Text Book · Smart Interactive Systems
        </footer>
    </div>
);

export default LandingPage;
