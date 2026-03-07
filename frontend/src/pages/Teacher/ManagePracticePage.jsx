import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ManagePracticePage.module.css';
import { practiceService } from '../../services/practice.service';
import { contentService } from '../../services/content.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const emptyQuestion = () => ({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1,
});

const ManagePracticePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sets, setSets] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);

    // Create form state
    const [mode, setMode] = useState('manual'); // 'manual' | 'ai'
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([emptyQuestion()]);

    // AI mode state
    const [aiSource, setAiSource] = useState('chapter'); // 'chapter' | 'topic'
    const [courses, setCourses] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedChapter, setSelectedChapter] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [questionCount, setQuestionCount] = useState(5);

    const loadSets = async () => {
        try {
            const { data } = await practiceService.getMyPracticeSets();
            setSets(data.data || []);
        } catch {
            toast.error('Failed to load practice sets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSets(); }, []);

    // Load courses when AI mode is selected
    useEffect(() => {
        if (mode === 'ai' && courses.length === 0) {
            contentService.getCourses()
                .then(({ data }) => setCourses(data.data || []))
                .catch(() => toast.error('Failed to load courses'));
        }
    }, [mode]);

    // Load chapters when a course is selected
    useEffect(() => {
        if (selectedCourse) {
            setChapters([]);
            setSelectedChapter('');
            contentService.getChapters(selectedCourse)
                .then(({ data }) => setChapters(data.data || []))
                .catch(() => toast.error('Failed to load chapters'));
        }
    }, [selectedCourse]);

    const handleToggle = async (id) => {
        try {
            const { data } = await practiceService.togglePracticeSet(id);
            setSets(prev => prev.map(s =>
                s._id === id ? { ...s, isActive: data.data.isActive } : s
            ));
            toast.success(data.message);
        } catch {
            toast.error('Toggle failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this practice set? All student attempts will be removed.')) return;
        try {
            await practiceService.deletePracticeSet(id);
            setSets(prev => prev.filter(s => s._id !== id));
            toast.success('Deleted');
        } catch {
            toast.error('Delete failed');
        }
    };

    const updateQuestion = (idx, field, value) => {
        setQuestions(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };

    const updateOption = (qIdx, optIdx, value) => {
        setQuestions(prev => {
            const copy = [...prev];
            const opts = [...copy[qIdx].options];
            opts[optIdx] = value;
            copy[qIdx] = { ...copy[qIdx], options: opts };
            return copy;
        });
    };

    const removeQuestion = (idx) => {
        if (questions.length <= 1) return;
        setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setQuestions([emptyQuestion()]);
        setMode('manual');
        setAiSource('chapter');
        setSelectedCourse('');
        setSelectedChapter('');
        setCustomTopic('');
        setQuestionCount(5);
        setShowCreate(false);
    };

    const handleCreate = async () => {
        if (!title.trim()) return toast.error('Title is required');

        if (mode === 'manual') {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.questionText.trim()) return toast.error(`Question ${i + 1}: text is required`);
                if (q.options.some(o => !o.trim())) return toast.error(`Question ${i + 1}: all options are required`);
                if (!q.correctAnswer) return toast.error(`Question ${i + 1}: select the correct answer`);
            }
        } else {
            if (aiSource === 'chapter' && !selectedChapter) return toast.error('Please select a chapter');
            if (aiSource === 'topic' && !customTopic.trim()) return toast.error('Please enter a topic');
        }

        setSaving(true);
        try {
            const payload = { title, description, generationMode: mode };

            if (mode === 'manual') {
                payload.questions = questions;
            } else {
                payload.questionCount = questionCount;
                if (aiSource === 'chapter') {
                    payload.chapterId = selectedChapter;
                } else {
                    payload.topic = customTopic;
                }
            }

            const { data } = await practiceService.createPracticeSet(payload);
            toast.success(data.message || 'Practice set created! 🎉');
            resetForm();
            loadSets();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Creation failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.center}><Spinner size="lg" /></div>;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>📝 Practice Sets</h1>
                    <p>Create practice questions for your students — manually or with AI</p>
                </div>
                <button className={styles.createBtn} onClick={() => setShowCreate(true)} id="create-practice-btn">
                    ➕ Create Practice Set
                </button>
            </div>

            {sets.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📋</span>
                    <h2>No Practice Sets Yet</h2>
                    <p>Create your first practice set — type questions manually or let AI generate them from a chapter or topic.</p>
                    <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
                        ➕ Create Your First Set
                    </button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {sets.map(set => (
                        <div key={set._id} className={styles.setCard}>
                            <div className={styles.setCardHead}>
                                <h3 className={styles.setTitle}>{set.title}</h3>
                                <span className={set.isActive ? styles.statusActive : styles.statusInactive}>
                                    {set.isActive ? '● Active' : '● Inactive'}
                                </span>
                            </div>
                            {set.description && <p className={styles.setDesc}>{set.description}</p>}

                            <div className={styles.setMeta}>
                                <div className={styles.metaItem}>
                                    <span>📝</span>
                                    <span>{set.questions?.length || 0} questions</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span>👥</span>
                                    <span>{set.attemptCount || 0} attempts</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span>{set.generationMode === 'ai' ? '🤖' : '✍️'}</span>
                                    <span>{set.generationMode === 'ai' ? 'AI Generated' : 'Manual'}</span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span>📅</span>
                                    <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className={styles.toggleRow}>
                                <span className={styles.toggleLabel}>Show to students</span>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={set.isActive}
                                        onChange={() => handleToggle(set._id)}
                                    />
                                    <span className={styles.slider} />
                                </label>
                            </div>

                            <div className={styles.setActions}>
                                <button
                                    className={styles.analyticsBtn}
                                    onClick={() => navigate(`/teacher/practice/${set._id}/analytics`)}
                                >
                                    📊 View Analytics
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDelete(set._id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create Modal ──────────────────────────────────────── */}
            {showCreate && (
                <>
                    <div className={styles.backdrop} onClick={resetForm} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Create Practice Set</h2>
                            <button className={styles.closeBtn} onClick={resetForm}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            {/* Mode Selector */}
                            <div className={styles.modeSelector}>
                                <button
                                    className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`}
                                    onClick={() => setMode('manual')}
                                >
                                    ✍️ Manual
                                </button>
                                <button
                                    className={`${styles.modeBtn} ${mode === 'ai' ? styles.modeBtnActive : ''}`}
                                    onClick={() => setMode('ai')}
                                >
                                    🤖 AI Generate
                                </button>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Title *</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Chapter 3 Revision"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    id="practice-title"
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Description (optional)</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Brief description for students..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* ── AI Mode Fields ── */}
                            {mode === 'ai' && (
                                <div className={styles.aiSection}>
                                    <div className={styles.aiSourceToggle}>
                                        <button
                                            className={`${styles.sourceBtn} ${aiSource === 'chapter' ? styles.sourceBtnActive : ''}`}
                                            onClick={() => setAiSource('chapter')}
                                        >
                                            📖 From Chapter
                                        </button>
                                        <button
                                            className={`${styles.sourceBtn} ${aiSource === 'topic' ? styles.sourceBtnActive : ''}`}
                                            onClick={() => setAiSource('topic')}
                                        >
                                            📌 Custom Topic
                                        </button>
                                    </div>

                                    {aiSource === 'chapter' ? (
                                        <>
                                            <div className={styles.fieldGroup}>
                                                <label>Select Course</label>
                                                <select
                                                    className={styles.input}
                                                    value={selectedCourse}
                                                    onChange={e => setSelectedCourse(e.target.value)}
                                                >
                                                    <option value="">— Choose a course —</option>
                                                    {courses.map(c => (
                                                        <option key={c._id} value={c._id}>
                                                            {c.title} ({c.subject} · Class {c.grade})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedCourse && (
                                                <div className={styles.fieldGroup}>
                                                    <label>Select Chapter</label>
                                                    <select
                                                        className={styles.input}
                                                        value={selectedChapter}
                                                        onChange={e => setSelectedChapter(e.target.value)}
                                                    >
                                                        <option value="">— Choose a chapter —</option>
                                                        {chapters.map(ch => (
                                                            <option key={ch._id} value={ch._id}>
                                                                {ch.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className={styles.fieldGroup}>
                                            <label>Topic</label>
                                            <textarea
                                                className={styles.textarea}
                                                placeholder="e.g. Photosynthesis process in plants, Quadratic equations, Indian Independence Movement..."
                                                value={customTopic}
                                                onChange={e => setCustomTopic(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    <div className={styles.fieldGroup}>
                                        <label>Number of Questions (1-20)</label>
                                        <input
                                            className={styles.input}
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={questionCount}
                                            onChange={e => setQuestionCount(parseInt(e.target.value) || 5)}
                                        />
                                    </div>

                                    <div className={styles.aiHint}>
                                        💡 AI will generate MCQ questions automatically. You can edit them after creation.
                                    </div>
                                </div>
                            )}

                            {/* ── Manual Mode Fields ── */}
                            {mode === 'manual' && (
                                <div className={styles.questionsArea}>
                                    <label>Questions</label>
                                    {questions.map((q, qIdx) => (
                                        <div key={qIdx} className={styles.questionBlock}>
                                            <div className={styles.questionNum}>Question {qIdx + 1}</div>
                                            {questions.length > 1 && (
                                                <button className={styles.removeQBtn} onClick={() => removeQuestion(qIdx)}>✕</button>
                                            )}
                                            <input
                                                className={styles.input}
                                                placeholder="Type the question here..."
                                                value={q.questionText}
                                                onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)}
                                            />
                                            <div className={styles.optionsGrid}>
                                                {q.options.map((opt, optIdx) => (
                                                    <input
                                                        key={optIdx}
                                                        className={styles.input}
                                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                        value={opt}
                                                        onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                                                    />
                                                ))}
                                            </div>
                                            <div className={styles.correctSelect}>
                                                <label>✅ Correct Answer</label>
                                                <select
                                                    value={q.correctAnswer}
                                                    onChange={e => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                                                >
                                                    <option value="">— Select correct option —</option>
                                                    {q.options.filter(o => o.trim()).map((opt, i) => (
                                                        <option key={i} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        className={styles.addQBtn}
                                        onClick={() => setQuestions(prev => [...prev, emptyQuestion()])}
                                    >
                                        + Add Another Question
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={resetForm}>Cancel</button>
                            <button className={styles.saveBtn} onClick={handleCreate} disabled={saving} id="save-practice-btn">
                                {saving
                                    ? (mode === 'ai' ? '🤖 Generating...' : 'Creating...')
                                    : (mode === 'ai' ? '🤖 Generate with AI' : '🚀 Create Practice Set')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManagePracticePage;
