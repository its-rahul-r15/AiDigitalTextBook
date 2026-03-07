import { useState, useEffect } from 'react';
import styles from './FlashcardsPage.module.css';
import { contentService } from '../../services/content.service';
import Spinner from '../../components/ui/Spinner/Spinner';
import { toast } from 'react-hot-toast';

const FlashcardsPage = () => {
    const [cheatsheets, setCheatsheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedIdx, setExpandedIdx] = useState(null);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const { data: res } = await contentService.getNotes();
                const notes = res.data || [];
                // Filter notes that have cheatsheet data
                const sheets = notes
                    .filter(n => n.cheatsheetData && n.cheatsheetData.sections)
                    .map(n => ({
                        ...n.cheatsheetData,
                        chapterTitle: n.chapterId?.title || 'Chapter',
                        noteId: n._id,
                        createdAt: n.createdAt,
                    }));
                setCheatsheets(sheets);
            } catch (err) {
                toast.error("Failed to load cheatsheets");
            } finally {
                setLoading(false);
            }
        };
        fetchCards();
    }, []);

    if (loading) return <div className={styles.center}><Spinner size="lg" /></div>;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>📋 Cheatsheets</h1>
                    <p className={styles.sub}>Quick revision cards generated from your chapters</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>{cheatsheets.length}</span>
                        <span className={styles.statLbl}>Cheatsheets</span>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {cheatsheets.length > 0 ? (
                    <div className={styles.sheetList}>
                        {cheatsheets.map((sheet, idx) => (
                            <div key={idx} className={styles.sheetCard}>
                                <div
                                    className={styles.sheetHeader}
                                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                >
                                    <div className={styles.sheetTitleRow}>
                                        <span className={styles.sheetEmoji}>{sheet.emoji || '📋'}</span>
                                        <div>
                                            <h2 className={styles.sheetTitle}>{sheet.title || sheet.chapterTitle}</h2>
                                            <span className={styles.sheetChapter}>{sheet.chapterTitle}</span>
                                        </div>
                                    </div>
                                    <span className={styles.expandIcon}>
                                        {expandedIdx === idx ? '▲' : '▼'}
                                    </span>
                                </div>

                                {expandedIdx === idx && (
                                    <div className={styles.sheetBody}>
                                        {sheet.sections?.map((sec, sIdx) => (
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
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h2>No Cheatsheets Yet</h2>
                        <p>Go to any chapter in Textbooks and click the <strong>📋 Cheatsheet</strong> button to generate AI-powered revision cards.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FlashcardsPage;
