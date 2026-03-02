import { useState, useEffect } from 'react';
import styles from './FlashcardsPage.module.css';
import { contentService } from '../../services/content.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const FlashcardsPage = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const { data: res } = await contentService.getNotes();
                const notes = res.data || [];
                const cards = notes.flatMap(n => (n.flashcards || []).map(c => ({ ...c, sourceTitle: n.chapterId?.title })));
                setFlashcards(cards);
            } catch (err) {
                toast.error("Failed to load cards");
            } finally {
                setLoading(false);
            }
        };
        fetchCards();
    }, []);

    const next = () => {
        setCurrentIdx((i) => (i + 1) % flashcards.length);
        setFlipped(false);
    };

    const prev = () => {
        setCurrentIdx((i) => (i - 1 + flashcards.length) % flashcards.length);
        setFlipped(false);
    };

    if (loading) return <div className={styles.center}><Spinner /></div>;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Flashcards</h1>
                    <p className={styles.sub}>Master your concepts with active recall</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>{flashcards.length}</span>
                        <span className={styles.statLbl}>Total Cards</span>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {flashcards.length > 0 ? (
                    <div className={styles.studyArea}>
                        <div className={styles.cardInfo}>
                            CARD {currentIdx + 1} OF {flashcards.length} · {flashcards[currentIdx].sourceTitle || 'General'}
                        </div>

                        <div
                            className={[styles.flashcard, flipped ? styles.flipped : ''].join(' ')}
                            onClick={() => setFlipped(!flipped)}
                        >
                            <div className={styles.cardFront}>
                                <h2>{flashcards[currentIdx].front || flashcards[currentIdx].q}</h2>
                                <p className={styles.hint}>Click to reveal answer</p>
                            </div>
                            <div className={styles.cardBack}>
                                <h2>{flashcards[currentIdx].back || flashcards[currentIdx].a}</h2>
                                <p className={styles.hint}>Click to flip back</p>
                            </div>
                        </div>

                        <div className={styles.controls}>
                            <button className={styles.navBtn} onClick={prev}>← Previous</button>
                            <div className={styles.indicators}>
                                {flashcards.map((_, idx) => (
                                    <div key={idx} className={[styles.dot, idx === currentIdx ? styles.activeDot : ''].join(' ')} />
                                ))}
                            </div>
                            <button className={styles.navBtn} onClick={next}>Next →</button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🃏</div>
                        <h2>No Cards Yet</h2>
                        <p>Save notes in your textbooks to generate AI flashcards automatically.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FlashcardsPage;
