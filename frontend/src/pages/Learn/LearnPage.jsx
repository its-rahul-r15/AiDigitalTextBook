import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './LearnPage.module.css';
import { contentService } from '../../services/content.service';
import { exerciseService } from '../../services/exercise.service';
import Badge from '../../components/ui/Badge/Badge';
import Card from '../../components/ui/Card/Card';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const LearnPage = () => {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('courseId');

    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [currentChapter, setCurrentChapter] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selection, setSelection] = useState({ text: '', x: 0, y: 0 });

    // Quiz state
    const [quizMode, setQuizMode] = useState(false);        // true when quiz is active
    const [quizLoading, setQuizLoading] = useState(false);   // generating quiz
    const [quizQuestions, setQuizQuestions] = useState([]);   // array of exercise docs
    const [quizAnswers, setQuizAnswers] = useState({});       // {exerciseId: selectedOption}
    const [quizSubmitting, setQuizSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState(null);      // {score, passed, results}
    const [currentQIdx, setCurrentQIdx] = useState(0);       // current question index

    // Cheatsheet state
    const [cheatsheet, setCheatsheet] = useState(null);
    const [cheatsheetLoading, setCheatsheetLoading] = useState(false);
    const [showCheatsheet, setShowCheatsheet] = useState(false);

    // 1. Study Time Heartbeat: Pulse every 60s
    useEffect(() => {
        const interval = setInterval(() => {
            if (course?._id && !loading) {
                contentService.updateStudyTime(1).catch(err => console.error("Heartbeat failed:", err));
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [course?._id, loading]);

    // Handle text selection for Smart Notes
    useEffect(() => {
        const handleMouseUp = () => {
            if (quizMode) return; // Disable selection during quiz
            const sel = window.getSelection();
            const text = sel.toString().trim();
            if (text && text.length > 5) {
                const range = sel.getRangeAt(0).getBoundingClientRect();
                setSelection({ text, x: range.left + range.width / 2, y: range.top + window.scrollY - 10 });
            } else {
                setSelection({ text: '', x: 0, y: 0 });
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [quizMode]);

    const saveSelectionAsNote = async () => {
        if (!selection.text) return;
        const toastId = toast.loading('Generating AI summary...');
        try {
            await contentService.saveHighlight({
                courseId: course._id, chapterId: currentChapter._id,
                conceptId: currentChapter._id, highlightedText: selection.text
            });
            toast.success('Note saved to Smart Notes!', { id: toastId });
            setSelection({ text: '', x: 0, y: 0 });
        } catch (err) {
            toast.error('Failed to save note.', { id: toastId });
        }
    };

    useEffect(() => {
        const loadData = async (targetId, initialChapterId = null) => {
            try {
                const { data: progressRes } = await contentService.getProgress();
                setProgressData(progressRes.data);
                const { data: courseRes } = await contentService.getCourse(targetId);
                setCourse(courseRes.data);
                const { data: chaptersRes } = await contentService.getChapters(targetId);
                const sortedChapters = (chaptersRes.data || []).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                setChapters(sortedChapters);
                if (sortedChapters.length > 0) {
                    const activeCh = initialChapterId
                        ? sortedChapters.find(c => c._id === initialChapterId) || sortedChapters[0]
                        : sortedChapters[0];
                    setCurrentChapter(activeCh);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };

        const init = async () => {
            setLoading(true);
            if (courseId) {
                await loadData(courseId);
            } else {
                try {
                    const { data: progressRes } = await contentService.getProgress();
                    const savedProgress = progressRes.data;
                    if (savedProgress?.lastCourseId) {
                        await loadData(savedProgress.lastCourseId._id, savedProgress.lastChapterId?._id);
                    } else {
                        const { data: coursesRes } = await contentService.getCourses();
                        const availableCourses = coursesRes.data || [];
                        if (availableCourses.length > 0) await loadData(availableCourses[0]._id);
                        else setLoading(false);
                    }
                } catch (err) {
                    setError('Unable to load content.');
                    setLoading(false);
                }
            }
        };
        init();
    }, [courseId]);

    useEffect(() => {
        if (course?._id && currentChapter?._id) {
            contentService.updateProgress({
                courseId: course._id, chapterId: currentChapter._id, isCompleted: false
            }).catch(err => console.error('Failed to save progress:', err));
        }
        // Reset quiz when chapter changes
        setQuizMode(false);
        setQuizQuestions([]);
        setQuizAnswers({});
        setQuizResult(null);
        setCurrentQIdx(0);
    }, [course?._id, currentChapter?._id]);

    // Check if a chapter's quiz is passed
    const isChapterPassed = (chapterId) => {
        const score = progressData?.chapterQuizScores?.[chapterId]
            ?? progressData?.chapterQuizScores?.get?.(chapterId);
        return (score || 0) >= 70;
    };

    // Check if student can access a chapter (first chapter always accessible, others need previous passed)
    const canAccessChapter = (chapterIdx) => {
        if (chapterIdx === 0) return true;
        const prevChapter = chapters[chapterIdx - 1];
        return prevChapter ? isChapterPassed(prevChapter._id) : true;
    };

    const handleStartQuiz = async () => {
        if (!currentChapter) return;
        setQuizLoading(true);
        setQuizMode(true);
        setQuizResult(null);
        setQuizAnswers({});
        setCurrentQIdx(0);

        try {
            const { data } = await exerciseService.generateChapterQuiz(currentChapter._id);
            const questions = data.data || [];
            if (questions.length === 0) {
                toast.error('Could not generate quiz. Try again.');
                setQuizMode(false);
                return;
            }
            setQuizQuestions(questions);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate quiz');
            setQuizMode(false);
        } finally {
            setQuizLoading(false);
        }
    };

    const handleSelectOption = (exerciseId, option) => {
        if (quizResult) return; // Already submitted
        setQuizAnswers(prev => ({ ...prev, [exerciseId]: option }));
    };

    const handleSubmitQuiz = async () => {
        const answers = quizQuestions.map(q => ({
            exerciseId: q._id,
            answer: quizAnswers[q._id] || '',
        }));

        // Check all answered
        const unanswered = answers.filter(a => !a.answer);
        if (unanswered.length > 0) {
            toast.error(`Please answer all questions. ${unanswered.length} remaining.`);
            return;
        }

        setQuizSubmitting(true);
        try {
            const { data } = await exerciseService.submitChapterQuiz({
                chapterId: currentChapter._id,
                answers,
            });
            setQuizResult(data.data);

            // Refresh progress
            const { data: progressRes } = await contentService.getProgress();
            setProgressData(progressRes.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit quiz');
        } finally {
            setQuizSubmitting(false);
        }
    };

    const handleGoToNextChapter = () => {
        const currentIdx = chapters.findIndex(ch => ch._id === currentChapter._id);
        if (currentIdx >= 0 && currentIdx < chapters.length - 1) {
            setCurrentChapter(chapters[currentIdx + 1]);
        }
    };

    const handleRetryReading = () => {
        setQuizMode(false);
        setQuizQuestions([]);
        setQuizAnswers({});
        setQuizResult(null);
        setCurrentQIdx(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGenerateCheatsheet = async () => {
        if (!currentChapter) return;
        setCheatsheetLoading(true);
        setShowCheatsheet(true);
        try {
            const { data } = await contentService.getCheatsheet(currentChapter._id);
            setCheatsheet(data.data);
        } catch (err) {
            toast.error('Failed to generate cheatsheet');
            setShowCheatsheet(false);
        } finally {
            setCheatsheetLoading(false);
        }
    };

    // Render a single content section
    const renderContentSection = (section, index) => {
        switch (section.type) {
            case 'text':
                return (
                    <div key={section._id || index} className={styles.contentBlock}>
                        <p className={styles.contentText}>{section.body}</p>
                    </div>
                );
            case 'image':
                return (
                    <div key={section._id || index} className={styles.contentBlock}>
                        <div className={styles.contentImageWrap}>
                            <img src={section.url} alt={section.caption || 'Chapter image'} className={styles.contentImage} />
                            {section.caption && <p className={styles.contentCaption}>{section.caption}</p>}
                        </div>
                    </div>
                );
            case 'diagram':
                return (
                    <div key={section._id || index} className={styles.contentBlock}>
                        <div className={styles.contentDiagramWrap}>
                            <img src={section.url} alt={section.caption || 'Diagram'} className={styles.contentDiagram} />
                            {section.caption && <p className={styles.contentCaption}>📊 {section.caption}</p>}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) return (
        <div className={styles.loadingContainer}>
            <Spinner size="lg" />
            <p>Gathering your learning materials...</p>
        </div>
    );

    if (error || !course) return (
        <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Oops!</h2>
            <p>{error || 'Course not found'}</p>
        </div>
    );

    const completedCount = progressData?.completedChapters?.length || 0;
    const totalChapters = chapters.length || 1;
    const masteryPct = Math.min(100, Math.round((completedCount / totalChapters) * 100));

    const sortedSections = [...(currentChapter?.contentSections || [])].sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );

    const currentChapterIdx = chapters.findIndex(ch => ch._id === currentChapter?._id);
    const isLastChapter = currentChapterIdx === chapters.length - 1;
    const isCurrentPassed = isChapterPassed(currentChapter?._id);

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <header className={styles.header}>
                <div className={styles.breadcrumbs}>
                    <span className={styles.crumb}>Course</span>
                    <span className={styles.separator}>›</span>
                    <span className={styles.activeCrumb}>{course.title}</span>
                </div>
            </header>

            <div className={styles.mainLayout}>
                {/* Left Content Area */}
                <main className={styles.contentArea}>
                    {/* Chapter Title Bar */}
                    <div className={styles.chapterTitleBar}>
                        <span className={styles.chapterTag}>Chapter {currentChapter?.orderIndex || 1}</span>
                        <h1 className={styles.chapterMainTitle}>{currentChapter?.title}</h1>
                    </div>

                    {/* Quiz Mode */}
                    {quizMode ? (
                        <section className={styles.chapterDetails}>
                            {quizLoading ? (
                                <div className={styles.quizLoadingState}>
                                    <div className={styles.quizPulse}></div>
                                    <h2>🤖 AI is generating your quiz...</h2>
                                    <p>Creating 5 questions from this chapter's content</p>
                                </div>
                            ) : quizResult ? (
                                /* Quiz Result */
                                <div className={styles.quizResultContainer}>
                                    <div className={quizResult.passed ? styles.resultPassed : styles.resultFailed}>
                                        <span className={styles.resultEmoji}>
                                            {quizResult.passed ? '🎉' : '📚'}
                                        </span>
                                        <h2>{quizResult.passed ? 'Congratulations!' : 'Keep Learning!'}</h2>
                                        <div className={styles.scoreCircle}>
                                            <span className={styles.scoreNumber}>{quizResult.score}%</span>
                                        </div>
                                        <p className={styles.scoreDetail}>
                                            {quizResult.correctCount}/{quizResult.totalQuestions} correct answers
                                        </p>
                                        <p className={styles.resultMessage}>
                                            {quizResult.passed
                                                ? 'You have passed this chapter! You can now proceed to the next one.'
                                                : 'You need at least 70% to pass. Please read the chapter again carefully and retake the quiz.'
                                            }
                                        </p>

                                        {/* Show question results */}
                                        <div className={styles.resultDetails}>
                                            {quizResult.results?.map((r, i) => (
                                                <div key={i} className={`${styles.resultItem} ${r.isCorrect ? styles.resultCorrect : styles.resultWrong}`}>
                                                    <span className={styles.resultQNum}>Q{i + 1}</span>
                                                    <span className={styles.resultQText}>{r.question}</span>
                                                    <span className={styles.resultIcon}>{r.isCorrect ? '✅' : '❌'}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.resultActions}>
                                            {quizResult.passed ? (
                                                isLastChapter ? (
                                                    <button className={styles.nextBtn} onClick={handleRetryReading}>
                                                        🏆 Course Complete!
                                                    </button>
                                                ) : (
                                                    <button className={styles.nextBtn} onClick={handleGoToNextChapter}>
                                                        Next Chapter →
                                                    </button>
                                                )
                                            ) : (
                                                <>
                                                    <button className={styles.retryBtn} onClick={handleRetryReading}>
                                                        📖 Read Again
                                                    </button>
                                                    <button className={styles.retakeBtn} onClick={handleStartQuiz}>
                                                        🔄 Retake Quiz
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Quiz Questions */
                                <div className={styles.quizContainer}>
                                    <div className={styles.quizHeader}>
                                        <h2>📝 Chapter Quiz</h2>
                                        <div className={styles.quizProgress}>
                                            Question {currentQIdx + 1} of {quizQuestions.length}
                                        </div>
                                    </div>

                                    {/* Progress dots */}
                                    <div className={styles.quizDots}>
                                        {quizQuestions.map((q, i) => (
                                            <button
                                                key={q._id}
                                                className={`${styles.quizDot} ${i === currentQIdx ? styles.quizDotActive : ''} ${quizAnswers[q._id] ? styles.quizDotAnswered : ''}`}
                                                onClick={() => setCurrentQIdx(i)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Current Question */}
                                    {quizQuestions[currentQIdx] && (
                                        <div className={styles.questionCard}>
                                            <p className={styles.questionText}>
                                                {quizQuestions[currentQIdx].question}
                                            </p>
                                            <div className={styles.optionsGrid}>
                                                {quizQuestions[currentQIdx].options?.map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        className={`${styles.optionBtn} ${quizAnswers[quizQuestions[currentQIdx]._id] === opt ? styles.optionSelected : ''}`}
                                                        onClick={() => handleSelectOption(quizQuestions[currentQIdx]._id, opt)}
                                                    >
                                                        <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                                                        <span>{opt}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation */}
                                    <div className={styles.quizNav}>
                                        <button
                                            className={styles.quizNavBtn}
                                            onClick={() => setCurrentQIdx(Math.max(0, currentQIdx - 1))}
                                            disabled={currentQIdx === 0}
                                        >
                                            ← Previous
                                        </button>

                                        {currentQIdx < quizQuestions.length - 1 ? (
                                            <button
                                                className={styles.quizNavBtn}
                                                onClick={() => setCurrentQIdx(currentQIdx + 1)}
                                            >
                                                Next →
                                            </button>
                                        ) : (
                                            <button
                                                className={styles.submitQuizBtn}
                                                onClick={handleSubmitQuiz}
                                                disabled={quizSubmitting}
                                            >
                                                {quizSubmitting ? 'Submitting...' : '🚀 Submit Quiz'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : (
                        /* Normal Content View */
                        <section className={styles.chapterDetails}>
                            <div className={styles.detailsHeader}>
                                <div className={styles.titleSection}>
                                    <h2 className={styles.mainTitle}>{currentChapter?.title}</h2>
                                    <p className={styles.subTitle}>Overall Mastery Progress</p>
                                </div>
                                <div className={styles.progressSection}>
                                    <span className={styles.progressPct}>{masteryPct}%</span>
                                    <div className={styles.mainProgress}>
                                        <div className={styles.mainProgressFill} style={{ width: `${masteryPct}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {currentChapter?.description && (
                                <div className={styles.chapterDescription}>
                                    <p>{currentChapter.description}</p>
                                </div>
                            )}

                            {sortedSections.length > 0 ? (
                                <div className={styles.contentSections}>
                                    {sortedSections.map((section, idx) => renderContentSection(section, idx))}
                                </div>
                            ) : (
                                <div className={styles.emptyContent}>
                                    <span className={styles.emptyIcon}>📄</span>
                                    <p>No content has been added to this chapter yet.</p>
                                    <p className={styles.emptyHint}>Your teacher will add content soon.</p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className={styles.chapterActions}>
                                {isCurrentPassed ? (
                                    <div className={styles.passedBadge}>
                                        ✅ Quiz Passed — {progressData?.chapterQuizScores?.[currentChapter?._id] ?? progressData?.chapterQuizScores?.get?.(currentChapter?._id) ?? 0}% Score
                                    </div>
                                ) : null}

                                <div className={styles.chapterBtns}>
                                    <button className={styles.takeQuizBtn} onClick={handleStartQuiz}>
                                        {isCurrentPassed ? '🔄 Retake Quiz' : '📝 Next → Take Quiz'}
                                    </button>

                                    <button className={styles.cheatsheetBtn} onClick={handleGenerateCheatsheet}>
                                        📋 Cheatsheet
                                    </button>
                                </div>

                                {isCurrentPassed && !isLastChapter && (
                                    <button className={styles.nextChapterBtn} onClick={handleGoToNextChapter}>
                                        Next Chapter →
                                    </button>
                                )}
                            </div>
                        </section>
                    )}
                </main>

                {/* Right Module Chapters Sidebar */}
                <aside className={styles.moduleSidebar}>
                    <div className={styles.moduleHeader}>
                        <h3>Module Chapters</h3>
                        <p>Total {totalChapters} Lessons</p>
                    </div>

                    <div className={styles.chapterList}>
                        {chapters.map((ch, idx) => {
                            const isCompleted = isChapterPassed(ch._id);
                            const isActive = currentChapter?._id === ch._id;
                            const accessible = canAccessChapter(idx);

                            return (
                                <div
                                    key={ch._id}
                                    className={[
                                        styles.chapterCard,
                                        isActive ? styles.activeChCard : '',
                                        !accessible ? styles.lockedChCard : '',
                                    ].join(' ')}
                                    onClick={() => accessible && setCurrentChapter(ch)}
                                    title={!accessible ? 'Pass the previous chapter quiz to unlock' : ''}
                                >
                                    <div className={styles.chIndex}>0{idx + 1}</div>
                                    <div className={styles.chInfo}>
                                        <div className={styles.chInfoTitle}>{ch.title}</div>
                                        <div className={styles.chInfoMeta}>
                                            {isCompleted ? 'PASSED ✅' : (isActive ? 'ACTIVE' : (accessible ? 'AVAILABLE' : 'LOCKED 🔒'))}
                                        </div>
                                    </div>
                                    <div className={styles.chStatus}>
                                        {isCompleted ? <span className={styles.checkIcon}>✓</span>
                                            : (isActive ? <span className={styles.activeDot}></span>
                                                : (!accessible ? '🔒' : '○'))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* AI Tutor Bubble */}
                    <div className={styles.aiTutorContainer}>
                        <div className={styles.aiTutorHeader}>
                            <span className={styles.aiIcon}>🤖</span>
                            <span>AI Tutor</span>
                        </div>
                        <div className={styles.aiBubble}>
                            <p>{quizMode
                                ? '"Take your time with each question. Read carefully before answering!"'
                                : '"Would you like me to summarize this chapter for your notes?"'
                            }</p>
                            <div className={styles.aiActions}>
                                <button className={styles.aiYes}>Yes</button>
                                <button className={styles.aiLater}>Later</button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Floating Selection Action */}
            {selection.text && (
                <button
                    className={styles.selectionBtn}
                    style={{ left: selection.x, top: selection.y }}
                    onClick={saveSelectionAsNote}
                >
                    ✦ Save Note
                </button>
            )}

            {/* Cheatsheet Overlay */}
            {showCheatsheet && (
                <>
                    <div className={styles.cheatsheetBackdrop} onClick={() => setShowCheatsheet(false)} />
                    <div className={styles.cheatsheetModal}>
                        <div className={styles.cheatsheetHeader}>
                            <div>
                                <span className={styles.cheatsheetEmoji}>{cheatsheet?.emoji || '📋'}</span>
                                <h2>{cheatsheet?.title || currentChapter?.title || 'Cheatsheet'}</h2>
                            </div>
                            <button className={styles.cheatsheetClose} onClick={() => setShowCheatsheet(false)}>✕</button>
                        </div>

                        {cheatsheetLoading ? (
                            <div className={styles.cheatsheetLoading}>
                                <Spinner size="lg" />
                                <p>🧠 AI is generating your cheatsheet...</p>
                            </div>
                        ) : cheatsheet ? (
                            <div className={styles.cheatsheetBody}>
                                {cheatsheet.sections?.map((sec, sIdx) => (
                                    <div key={sIdx} className={`${styles.cheatSection} ${styles[`cheatType_${sec.type}`] || ''}`}>
                                        <h3 className={styles.cheatSectionTitle}>{sec.heading}</h3>
                                        {sec.type === 'definitions' ? (
                                            <div className={styles.defList}>
                                                {sec.items?.map((item, i) => (
                                                    <div key={i} className={styles.defItem}>
                                                        <span className={styles.defTerm}>{typeof item === 'object' ? item.term : item}</span>
                                                        {typeof item === 'object' && <span className={styles.defMeaning}>{item.meaning}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : sec.type === 'formulas' ? (
                                            <div className={styles.formulaList}>
                                                {sec.items?.map((item, i) => (
                                                    <div key={i} className={styles.formulaItem}>{item}</div>
                                                ))}
                                            </div>
                                        ) : (
                                            <ul className={styles.cheatBullets}>
                                                {sec.items?.map((item, i) => (
                                                    <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
};

export default LearnPage;
