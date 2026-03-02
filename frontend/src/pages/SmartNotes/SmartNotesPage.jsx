import { useState, useEffect } from 'react';
import styles from './SmartNotesPage.module.css';
import { contentService } from '../../services/content.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const SmartNotesPage = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const { data: res } = await contentService.getNotes();
                const fetchedNotes = res.data || [];
                setNotes(fetchedNotes);
                if (fetchedNotes.length > 0) {
                    setSelectedNote(fetchedNotes[0]);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load notes.');
            } finally {
                setLoading(false);
            }
        };
        fetchNotes();
    }, []);

    const handleDeleteNote = async (id) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await contentService.deleteNote(id);
            toast.success('Note removed');
            const updated = notes.filter(n => n._id !== id);
            setNotes(updated);
            if (selectedNote?._id === id) {
                setSelectedNote(updated[0] || null);
            }
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className={styles.loading}><Spinner /></div>;

    const summaryPoints = selectedNote?.summary ? selectedNote.summary.split('. ').filter(p => p.trim()) : [];

    return (
        <div className={styles.container}>
            {/* Left: Recent Highlights List */}
            <aside className={styles.highlightsAside}>
                <div className={styles.asideHeader}>
                    <h3 className={styles.asideTitle}>RECENT HIGHLIGHTS</h3>
                </div>
                <div className={styles.highlightList}>
                    {notes.map((note) => (
                        <div
                            key={note._id}
                            className={[styles.highlightItem, selectedNote?._id === note._id ? styles.activeItem : ''].join(' ')}
                            onClick={() => setSelectedNote(note)}
                        >
                            <div className={styles.itemMeta}>
                                <span className={styles.itemBadge}>AI SUMMARY</span>
                                <span className={styles.itemTime}>
                                    {new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <p className={styles.itemSnippet}>
                                {note.highlightedText.substring(0, 100)}...
                            </p>
                            <div className={styles.itemChapter}>
                                CHAPTER {note.chapterId?.orderIndex || '1'}: {note.chapterId?.title || 'QUANTUM PRINCIPLES'}
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && <div className={styles.emptyAside}>No highlights yet</div>}
                </div>
            </aside>

            {/* Right: Detailed View */}
            <main className={styles.detailView}>
                <header className={styles.pageHeader}>
                    <div className={styles.pageInfo}>
                        <h2 className={styles.pageTitle}>Smart Notes</h2>
                        <span className={styles.emeraldBadge}>EMERALD EDITION</span>
                    </div>

                </header>

                {selectedNote ? (
                    <div className={styles.noteContent}>
                        <nav className={styles.breadcrumbs}>
                            TEXTBOOKS / {selectedNote.courseId?.title?.toUpperCase() || 'MODERN PHYSICS'} / {selectedNote.chapterId?.title?.toUpperCase() || 'WAVE-PARTICLE DUALITY'}
                        </nav>

                        <h1 className={styles.noteTitle}>
                            {selectedNote.chapterId?.title || 'Quantum Mechanics'}: Reflection
                        </h1>

                        <div className={styles.originalSection}>
                            <div className={styles.sectionLabel}>
                                <span className={styles.bookIcon}>📖</span> ORIGINAL HIGHLIGHT
                            </div>
                            <blockquote className={styles.quote}>
                                "{selectedNote.highlightedText}"
                            </blockquote>
                        </div>

                        <div className={styles.aiResult}>
                            <div className={styles.aiHeader}>
                                <span className={styles.aiFlash}>⚡</span> AI-GENERATED SUMMARY
                                <div className={styles.aiTrophy}>⚙️</div>
                            </div>
                            <div className={styles.pointList}>
                                {summaryPoints.length > 0 ? summaryPoints.map((point, idx) => (
                                    <div key={idx} className={styles.pointItem}>
                                        <div className={styles.pointNum}>{idx + 1}</div>
                                        <p>{point.trim()}{point.endsWith('.') ? '' : '.'}</p>
                                    </div>
                                )) : <p>Generating insights...</p>}
                            </div>
                        </div>

                        <div className={styles.bottomActions}>
                            <button className={styles.primaryAction}>
                                <span className={styles.actionIcon}>🃏</span> Generate Flashcard
                            </button>
                            <div className={styles.secondaryActions}>
                                <button className={styles.actionBtn}>
                                    <span className={styles.actionIcon}>📁</span> Share to Library
                                </button>
                                <button className={styles.actionBtn}>✎</button>
                                <button className={styles.actionBtn} onClick={() => handleDeleteNote(selectedNote._id)}>🗑</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyContent}>
                        <span className={styles.emptyIcon}>📝</span>
                        <h3>Explore your knowledge</h3>
                        <p>Select a highlight from the left to view detailed AI reflections and create study cards.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SmartNotesPage;
