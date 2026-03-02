import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './LearnPage.module.css';
import { contentService } from '../../services/content.service';
import Badge from '../../components/ui/Badge/Badge';
import Card from '../../components/ui/Card/Card';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const BARS = [
    { label: 'Ground', height: 55 },
    { label: 'Vector', height: 100, active: true },
    { label: 'Excited', height: 65 },
];

const LearnPage = () => {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('courseId');

    const [isPlaying, setIsPlaying] = useState(false);
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [currentChapter, setCurrentChapter] = useState(null);
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selection, setSelection] = useState({ text: '', x: 0, y: 0 });

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
            const sel = window.getSelection();
            const text = sel.toString().trim();

            if (text && text.length > 5) {
                const range = sel.getRangeAt(0).getBoundingClientRect();
                setSelection({
                    text,
                    x: range.left + range.width / 2,
                    y: range.top + window.scrollY - 10
                });
            } else {
                setSelection({ text: '', x: 0, y: 0 });
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const saveSelectionAsNote = async () => {
        if (!selection.text) return;
        const toastId = toast.loading('Generating AI summary...');
        try {
            await contentService.saveHighlight({
                courseId: course._id,
                chapterId: currentChapter._id,
                conceptId: currentChapter._id,
                highlightedText: selection.text
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
                // Fetch progress first
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
                        if (availableCourses.length > 0) {
                            await loadData(availableCourses[0]._id);
                        } else {
                            setLoading(false);
                        }
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
                courseId: course._id,
                chapterId: currentChapter._id,
                isCompleted: false // Mark as active, not yet fully completed
            }).catch(err => console.error('Failed to save progress:', err));
        }
    }, [course?._id, currentChapter?._id]);

    const handleMarkComplete = async () => {
        if (!course || !currentChapter) return;
        try {
            const { data: res } = await contentService.updateProgress({
                courseId: course._id,
                chapterId: currentChapter._id,
                isCompleted: true
            });
            setProgressData(res.data);
            toast.success("Chapter marked as completed!");
        } catch (err) {
            toast.error("Failed to update progress.");
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

    // Dynamic Progress Calculation
    const completedCount = progressData?.completedChapters?.length || 0;
    const totalChapters = chapters.length || 1;
    const masteryPct = Math.min(100, Math.round((completedCount / totalChapters) * 100));

    // Get Video if available
    const videoRef = currentChapter?.mediaRefs?.find(m => m.type === 'video');
    const videoUrl = videoRef?.url || "https://images.unsplash.com/photo-1544333346-647a9fd3693e?auto=format&fit=crop&q=80&w=1200";

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
                {/* Left Content Area (Video + Text) */}
                <main className={styles.contentArea}>
                    <div className={styles.videoPlayer}>
                        <div className={styles.videoThumb}>
                            <img src={videoUrl} alt="Lesson Visual" />
                            <div className={styles.videoOverlay}>
                                <button className={styles.playCenterIcon} onClick={() => setIsPlaying(!isPlaying)}>
                                    {isPlaying ? '⏸' : '▶'}
                                </button>
                            </div>
                        </div>
                        <div className={styles.videoMeta}>
                            <div className={styles.videoTime}>00:00 / 00:00</div>
                            <div className={styles.videoSeek}>
                                <div className={styles.seekFill} style={{ width: '0%' }}></div>
                            </div>
                            <div className={styles.videoSettings}>⚙️ ⛶</div>
                        </div>
                        <div className={styles.videoTitleBar}>
                            Chapter {currentChapter?.orderIndex || 1}: {currentChapter?.title}
                        </div>
                    </div>

                    <section className={styles.chapterDetails}>
                        <div className={styles.detailsHeader}>
                            <div className={styles.titleSection}>
                                <h1 className={styles.mainTitle}>{currentChapter?.title}</h1>
                                <p className={styles.subTitle}>Overall Mastery Progress</p>
                            </div>
                            <div className={styles.progressSection}>
                                <span className={styles.progressPct}>{masteryPct}%</span>
                                <div className={styles.mainProgress}>
                                    <div className={styles.mainProgressFill} style={{ width: `${masteryPct}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.textContent}>
                            <p>
                                {currentChapter?.description || 'No description available for this chapter yet.'}
                            </p>

                            {!progressData?.completedChapters?.includes(currentChapter?._id) && (
                                <button className={styles.completeBtn} onClick={handleMarkComplete}>
                                    Mark as Completed ✓
                                </button>
                            )}
                        </div>
                    </section>
                </main>

                {/* Right Module Chapters Sidebar */}
                <aside className={styles.moduleSidebar}>
                    <div className={styles.moduleHeader}>
                        <h3>Module Chapters</h3>
                        <p>Total {totalChapters} Lessons</p>
                    </div>

                    <div className={styles.chapterList}>
                        {chapters.map((ch, idx) => {
                            const isCompleted = progressData?.completedChapters?.includes(ch._id);
                            const isActive = currentChapter?._id === ch._id;

                            return (
                                <div
                                    key={ch._id}
                                    className={[
                                        styles.chapterCard,
                                        isActive ? styles.activeChCard : ''
                                    ].join(' ')}
                                    onClick={() => setCurrentChapter(ch)}
                                >
                                    <div className={styles.chIndex}>0{idx + 1}</div>
                                    <div className={styles.chInfo}>
                                        <div className={styles.chInfoTitle}>{ch.title}</div>
                                        <div className={styles.chInfoMeta}>
                                            {isCompleted ? 'COMPLETED' : (isActive ? 'ACTIVE' : 'LOCKED')}
                                        </div>
                                    </div>
                                    <div className={styles.chStatus}>
                                        {isCompleted ? <span className={styles.checkIcon}>✓</span> : (isActive ? <span className={styles.activeDot}></span> : '🔒')}
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
                            <p>"Would you like me to summarize this chapter for your notes?"</p>
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
        </div>
    );
};

export default LearnPage;
