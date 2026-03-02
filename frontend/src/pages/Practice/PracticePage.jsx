import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './PracticePage.module.css';
import { exerciseService } from '../../services/exercise.service';
import { contentService } from '../../services/content.service';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import Spinner from '../../components/ui/Spinner/Spinner';
import Badge from '../../components/ui/Badge/Badge';
import { toast } from 'react-hot-toast';

const PracticePage = () => {
    const [searchParams] = useSearchParams();
    const conceptId = searchParams.get('conceptId');

    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [exercise, setExercise] = useState(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [hint, setHint] = useState('');
    const [gettingHint, setGettingHint] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

    // Concepts list for the selector
    const [courses, setCourses] = useState([]);
    const [selectedConceptId, setSelectedConceptId] = useState(conceptId || '');

    // Timer: track how long student spends on each question
    const startTimeRef = useRef(null);
    const hintsUsedRef = useRef(0);

    const [config, setConfig] = useState({
        difficulty: 'medium',
        type: 'mcq'
    });

    // Load available courses for concept picker
    useEffect(() => {
        contentService.getCourses()
            .then(res => setCourses(res.data?.data || []))
            .catch(() => { /* Silently handle */ });
    }, []);

    const startQuiz = useCallback(async () => {
        setGenerating(true);
        setFeedback(null);
        setHint('');
        setAnswer('');
        hintsUsedRef.current = 0;
        startTimeRef.current = Date.now();

        try {
            const { data } = await exerciseService.generateQuestion(
                selectedConceptId || null,
                config.difficulty,
                config.type
            );
            setExercise(data.data);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to generate question.";
            toast.error(msg);
        } finally {
            setGenerating(false);
        }
    }, [selectedConceptId, config]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim() || !exercise) return;

        const timeTaken = startTimeRef.current
            ? Math.round((Date.now() - startTimeRef.current) / 1000)
            : 0;

        setLoading(true);
        try {
            const { data } = await exerciseService.submitAnswer({
                exerciseId: exercise._id,
                answer: answer.trim(),
                timeTaken,
                hintsUsed: hintsUsedRef.current,
                mode: 'learning',
            });

            const isCorrect = data.data?.isCorrect;
            const score = data.data?.score ?? 0;

            setSessionStats(prev => ({
                correct: prev.correct + (isCorrect ? 1 : 0),
                total: prev.total + 1,
            }));

            setFeedback({
                success: isCorrect,
                score,
                message: isCorrect
                    ? `🎉 Correct! (+${score} points)`
                    : `❌ Not quite. The correct answer was: "${exercise.solution}"`
            });

            if (isCorrect) toast.success("Mastery updated! 🔥");
        } catch (err) {
            toast.error("Submission failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleHint = async () => {
        if (!exercise) return;
        setGettingHint(true);
        hintsUsedRef.current += 1;
        try {
            const { data } = await exerciseService.getHint(exercise._id);
            setHint(data.data?.hint || "Think about the core concept carefully.");
        } catch {
            toast.error("Could not fetch hint.");
        } finally {
            setGettingHint(false);
        }
    };

    if (generating) return (
        <div className={styles.center}>
            <div className={styles.aiLoader}>
                <div className={styles.pulse} />
                <p>Crafting your practice question...</p>
            </div>
        </div>
    );

    const sessionAccuracy = sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1>Practice & Quiz ✦</h1>
                    <p>Level up your skills with AI-generated challenges</p>
                </div>
                {sessionStats.total > 0 && (
                    <div className={styles.sessionStats}>
                        <span className={styles.statPill}>
                            ✅ {sessionStats.correct}/{sessionStats.total} correct
                        </span>
                        <span className={styles.statPill} style={{ color: sessionAccuracy >= 70 ? '#10B981' : '#EF4444' }}>
                            {sessionAccuracy}% accuracy
                        </span>
                    </div>
                )}
            </header>

            {!exercise ? (
                <div className={styles.generatorBox}>
                    <Card className={styles.configCard}>
                        <h2>Start a New Session</h2>

                        {/* Concept Picker */}
                        <div className={styles.formGroup}>
                            <label>Topic (optional — leave blank for random)</label>
                            <select
                                id="concept-select"
                                className={styles.select}
                                value={selectedConceptId}
                                onChange={e => setSelectedConceptId(e.target.value)}
                            >
                                <option value="">🎲 Random Topic</option>
                                {courses.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.title} ({c.subject || 'General'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Complexity Level</label>
                            <div className={styles.options}>
                                {['easy', 'medium', 'hard'].map(d => (
                                    <button
                                        key={d}
                                        id={`diff-${d}`}
                                        className={[styles.optBtn, config.difficulty === d ? styles.activeOpt : ''].join(' ')}
                                        onClick={() => setConfig({ ...config, difficulty: d })}
                                    >
                                        {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Question Type</label>
                            <div className={styles.options}>
                                {[
                                    { key: 'mcq', label: '🔘 MCQ' },
                                    { key: 'fill-blank', label: '✏️ Fill Blank' },
                                    { key: 'open', label: '📝 Open Answer' },
                                ].map(t => (
                                    <button
                                        key={t.key}
                                        id={`type-${t.key}`}
                                        className={[styles.optBtn, config.type === t.key ? styles.activeOpt : ''].join(' ')}
                                        onClick={() => setConfig({ ...config, type: t.key })}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button primary fullWidth onClick={startQuiz} id="generate-btn">
                            Generate Question 🎲
                        </Button>
                    </Card>
                </div>
            ) : (
                <div className={styles.quizLayout}>
                    <Card className={styles.questionCard}>
                        <div className={styles.qHeader}>
                            <Badge variant="emerald">{typeof exercise.difficulty === 'number'
                                ? ['', 'Easy', 'Easy', 'Medium', 'Hard', 'Expert'][exercise.difficulty] || 'Medium'
                                : String(exercise.difficulty || 'Medium').toUpperCase()}</Badge>
                            <span className={styles.qType}>{exercise.type?.replace('-', ' ')}</span>
                        </div>

                        <div className={styles.questionText} id="question-text">
                            {exercise.question}
                        </div>

                        {/* MCQ Options */}
                        {exercise.options?.length > 0 && (
                            <div className={styles.mcqGrid}>
                                {exercise.options.map((opt, idx) => {
                                    let optStyle = styles.mcqOpt;
                                    if (feedback) {
                                        if (opt === exercise.solution) optStyle = `${styles.mcqOpt} ${styles.correctOpt}`;
                                        else if (opt === answer && !feedback.success) optStyle = `${styles.mcqOpt} ${styles.wrongOpt}`;
                                    } else if (answer === opt) {
                                        optStyle = `${styles.mcqOpt} ${styles.selectedOpt}`;
                                    }
                                    return (
                                        <button
                                            key={idx}
                                            id={`opt-${idx}`}
                                            className={optStyle}
                                            onClick={() => !feedback && setAnswer(opt)}
                                            disabled={!!feedback}
                                        >
                                            <span className={styles.optLetter}>{String.fromCharCode(65 + idx)}</span>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.answerForm}>
                            {/* Text input for fill-blank / open */}
                            {(!exercise.options || exercise.options.length === 0) && (
                                <textarea
                                    id="answer-input"
                                    className={styles.textField}
                                    placeholder={exercise.type === 'fill-blank'
                                        ? "Type a single word or short phrase..."
                                        : "Type your explanation or answer here..."}
                                    value={answer}
                                    onChange={e => setAnswer(e.target.value)}
                                    rows={4}
                                    disabled={!!feedback}
                                />
                            )}

                            {feedback && (
                                <div className={[styles.feedback, feedback.success ? styles.success : styles.error].join(' ')} id="feedback-box">
                                    {feedback.message}
                                </div>
                            )}

                            {hint && (
                                <div className={styles.hintBox} id="hint-box">
                                    <strong>💡 Hint:</strong> {hint}
                                </div>
                            )}

                            <div className={styles.actions}>
                                {!feedback && (
                                    <button type="button" className={styles.hintBtn} onClick={handleHint} disabled={gettingHint} id="hint-btn">
                                        {gettingHint ? 'Thinking...' : '💡 Need a Hint?'}
                                    </button>
                                )}
                                <div className={styles.primaryAction}>
                                    {!feedback ? (
                                        <Button primary type="submit" loading={loading} disabled={!answer.trim()} id="submit-btn">
                                            Submit Answer 🚀
                                        </Button>
                                    ) : (
                                        <Button primary onClick={startQuiz} id="next-btn">
                                            Next Question →
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </Card>

                    <aside className={styles.quizAside}>
                        <div className={styles.tipsBox}>
                            <h3>AI Tutor Tip</h3>
                            <p>"Don't rush! Think step-by-step before selecting your answer. Time taken is tracked for your analytics."</p>
                        </div>
                        {sessionStats.total > 0 && (
                            <div className={styles.miniStats}>
                                <div className={styles.miniStat}>
                                    <span className={styles.miniStatVal}>{sessionStats.total}</span>
                                    <span className={styles.miniStatLbl}>Questions</span>
                                </div>
                                <div className={styles.miniStat}>
                                    <span className={styles.miniStatVal} style={{ color: '#10B981' }}>{sessionStats.correct}</span>
                                    <span className={styles.miniStatLbl}>Correct</span>
                                </div>
                                <div className={styles.miniStat}>
                                    <span className={styles.miniStatVal} style={{ color: sessionAccuracy >= 70 ? '#10B981' : '#EF4444' }}>
                                        {sessionAccuracy}%
                                    </span>
                                    <span className={styles.miniStatLbl}>Accuracy</span>
                                </div>
                            </div>
                        )}
                        <button className={styles.exitBtn} id="exit-btn" onClick={() => { setExercise(null); setFeedback(null); }}>
                            ← End Practice
                        </button>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default PracticePage;
