import { useState, useEffect } from 'react';
import styles from './TeacherPracticePage.module.css';
import { practiceService } from '../../services/practice.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const TeacherPracticePage = () => {
    const [loading, setLoading] = useState(true);
    const [sets, setSets] = useState([]);
    const [view, setView] = useState('list');        // 'list' | 'quiz' | 'result'
    const [activeSet, setActiveSet] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});       // { questionId: selectedAnswer }
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        practiceService.getAssignedPracticeSets()
            .then(({ data }) => setSets(data.data || []))
            .catch(() => toast.error('Failed to load practice sets'))
            .finally(() => setLoading(false));
    }, []);

    const handleStartQuiz = (set) => {
        // Questions are already included in the assigned endpoint response (without correctAnswer)
        setActiveSet(set);
        setAnswers({});
        setCurrentQ(0);
        setView('quiz');
    };

    const selectAnswer = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async () => {
        if (!activeSet) return;
        setSubmitting(true);
        try {
            const answersList = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
                questionId,
                selectedAnswer,
            }));
            const { data } = await practiceService.submitPracticeSet(activeSet._id, answersList);
            setResult(data.data);
            setView('result');
            toast.success(data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const backToList = () => {
        setView('list');
        setActiveSet(null);
        setResult(null);
        setAnswers({});
        setCurrentQ(0);
        setLoading(true);
        practiceService.getAssignedPracticeSets()
            .then(({ data }) => setSets(data.data || []))
            .finally(() => setLoading(false));
    };

    if (loading) return <div className={styles.center}><Spinner size="lg" /></div>;

    // ── RESULT VIEW ──
    if (view === 'result' && result) {
        return (
            <div className={styles.page}>
                <div className={styles.resultContainer}>
                    <span className={styles.resultEmoji}>
                        {result.percentage >= 70 ? '🎉' : result.percentage >= 40 ? '💪' : '📚'}
                    </span>
                    <div className={styles.resultScore}>{result.percentage}%</div>
                    <div className={styles.resultDetails}>
                        You scored <strong>{result.score}</strong> out of <strong>{result.totalMarks}</strong> marks
                    </div>

                    {result.answers && (
                        <div className={styles.resultCard}>
                            <h3>Question Summary</h3>
                            {result.answers.map((a, i) => (
                                <div key={i} className={styles.resultItem}>
                                    <span>Q{i + 1}</span>
                                    <span className={a.isCorrect ? styles.correct : styles.incorrect}>
                                        {a.isCorrect ? '✅ Correct' : '❌ Wrong'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button className={styles.backToListBtn} onClick={backToList}>
                        ← Back to Practice Sets
                    </button>
                </div>
            </div>
        );
    }

    // ── QUIZ VIEW ──
    if (view === 'quiz' && activeSet) {
        const questions = activeSet.questions || [];

        if (questions.length === 0) {
            return (
                <div className={styles.page}>
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>⚠️</span>
                        <h2>Questions not loaded</h2>
                        <p>Could not load the questions for this practice set.</p>
                        <button className={styles.backToListBtn} onClick={backToList}>← Back</button>
                    </div>
                </div>
            );
        }

        const q = questions[currentQ];
        const isLast = currentQ === questions.length - 1;
        const allAnswered = questions.every(qu => answers[qu._id]);

        return (
            <div className={styles.page}>
                <div className={styles.quizContainer}>
                    <div className={styles.quizHeader}>
                        <h1 className={styles.quizTitle}>{activeSet.title}</h1>
                        <span className={styles.progress}>{currentQ + 1} / {questions.length}</span>
                    </div>

                    <div className={styles.questionCard}>
                        <div className={styles.questionNum}>Question {currentQ + 1}</div>
                        <div className={styles.questionText}>{q.questionText}</div>

                        <div className={styles.optionsList}>
                            {q.options?.map((opt, idx) => (
                                <button
                                    key={idx}
                                    className={`${styles.optionBtn} ${answers[q._id] === opt ? styles.optionSelected : ''}`}
                                    onClick={() => selectAnswer(q._id, opt)}
                                >
                                    <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.navBtns}>
                        {currentQ > 0 && (
                            <button className={styles.prevBtn} onClick={() => setCurrentQ(c => c - 1)}>
                                ← Previous
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        {!isLast ? (
                            <button className={styles.nextBtn} onClick={() => setCurrentQ(c => c + 1)}>
                                Next →
                            </button>
                        ) : (
                            <button
                                className={styles.submitAllBtn}
                                onClick={handleSubmit}
                                disabled={submitting || !allAnswered}
                            >
                                {submitting ? 'Submitting...' : '🚀 Submit All Answers'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── LIST VIEW ──
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>📋 Practice Assignments</h1>
                <p>Complete practice sets assigned by your teacher</p>
            </div>

            {sets.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <h2>No Practice Sets</h2>
                    <p>Your teacher hasn't assigned any practice sets yet. Check back later!</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {sets.map(set => (
                        <div key={set._id} className={styles.setCard}>
                            <h3 className={styles.setTitle}>{set.title}</h3>
                            {set.description && <p className={styles.setDesc}>{set.description}</p>}
                            <div className={styles.setMeta}>
                                <div className={styles.metaItem}>
                                    <span>📝</span>
                                    <span>{set.totalQuestions} questions</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span>⭐</span>
                                    <span>{set.totalMarks} marks</span>
                                </div>
                            </div>

                            {set.attempted ? (
                                <div className={styles.completedBadge}>
                                    <span>✅ Completed — {set.result?.percentage}%</span>
                                    <button className={styles.retryBtn} onClick={() => handleStartQuiz(set)}>
                                        🔄 Retry
                                    </button>
                                </div>
                            ) : (
                                <button className={styles.startBtn} onClick={() => handleStartQuiz(set)}>
                                    Start Practice →
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherPracticePage;
