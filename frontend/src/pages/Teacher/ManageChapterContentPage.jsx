import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contentService } from '../../services/content.service';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import Spinner from '../../components/ui/Spinner/Spinner';
import styles from './ManageChapterContentPage.module.css';

const SECTION_TYPES = [
    { value: 'text', label: '📝 Text', icon: '📝' },
    { value: 'image', label: '🖼️ Image', icon: '🖼️' },
    { value: 'diagram', label: '📊 Diagram', icon: '📊' },
];

const ManageChapterContentPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [saving, setSaving] = useState(false);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedChapterId, setSelectedChapterId] = useState('');
    const [sections, setSections] = useState([]);

    // Load courses on mount
    useEffect(() => {
        contentService.getCourses()
            .then(({ data }) => {
                const fetched = data.data || [];
                setCourses(fetched);
                if (fetched.length > 0) {
                    setSelectedCourseId(fetched[0]._id);
                }
            })
            .catch(() => toast.error('Failed to load courses'))
            .finally(() => setLoadingCourses(false));
    }, []);

    // Load chapters when course changes
    useEffect(() => {
        if (!selectedCourseId) return;
        setLoadingChapters(true);
        setChapters([]);
        setSelectedChapterId('');
        setSections([]);

        contentService.getChapters(selectedCourseId)
            .then(({ data }) => {
                const fetched = (data.data || []).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                setChapters(fetched);
                if (fetched.length > 0) {
                    setSelectedChapterId(fetched[0]._id);
                }
            })
            .catch(() => toast.error('Failed to load chapters'))
            .finally(() => setLoadingChapters(false));
    }, [selectedCourseId]);

    // Load existing content when chapter changes
    useEffect(() => {
        if (!selectedChapterId) {
            setSections([]);
            return;
        }
        const chapter = chapters.find(c => c._id === selectedChapterId);
        if (chapter?.contentSections?.length > 0) {
            const sorted = [...chapter.contentSections].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            setSections(sorted.map((s, i) => ({
                id: s._id || `existing-${i}`,
                type: s.type,
                body: s.body || '',
                url: s.url || '',
                caption: s.caption || '',
            })));
        } else {
            setSections([]);
        }
    }, [selectedChapterId, chapters]);

    const addSection = (type) => {
        setSections(prev => [
            ...prev,
            {
                id: `new-${Date.now()}`,
                type,
                body: '',
                url: '',
                caption: '',
            }
        ]);
    };

    const updateSection = (index, field, value) => {
        setSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const removeSection = (index) => {
        setSections(prev => prev.filter((_, i) => i !== index));
    };

    const moveSection = (index, direction) => {
        const newSections = [...sections];
        const target = index + direction;
        if (target < 0 || target >= newSections.length) return;
        [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
        setSections(newSections);
    };

    const handleSave = async () => {
        if (!selectedChapterId) {
            toast.error('Please select a chapter first');
            return;
        }

        const contentSections = sections.map((s, i) => ({
            type: s.type,
            body: s.type === 'text' ? s.body : undefined,
            url: s.type !== 'text' ? s.url : undefined,
            caption: s.type !== 'text' ? s.caption : undefined,
            orderIndex: i,
        }));

        // Validate
        for (const sec of contentSections) {
            if (sec.type === 'text' && !sec.body?.trim()) {
                toast.error('Text sections cannot be empty');
                return;
            }
            if ((sec.type === 'image' || sec.type === 'diagram') && !sec.url?.trim()) {
                toast.error(`${sec.type} sections need a URL`);
                return;
            }
        }

        setSaving(true);
        try {
            const { data } = await contentService.updateChapterContent(selectedChapterId, contentSections);
            // Update local chapters with new data
            setChapters(prev => prev.map(ch =>
                ch._id === selectedChapterId ? { ...ch, contentSections: data.data.contentSections } : ch
            ));
            toast.success('Content saved successfully! ✅');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save content');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link to="/teacher" className={styles.back}>← Back to Dashboard</Link>
                <h1>Manage Chapter Content</h1>
                <p>Add text, images, and diagrams to your chapters.</p>
            </div>

            {/* Course & Chapter Selectors */}
            <Card className={styles.selectorCard}>
                <div className={styles.selectors}>
                    <div className={styles.field}>
                        <label className={styles.label}>Select Course</label>
                        {loadingCourses ? (
                            <div className={styles.skeleton}>Loading...</div>
                        ) : (
                            <select
                                className={styles.select}
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                            >
                                {courses.map(c => (
                                    <option key={c._id} value={c._id}>{c.title} ({c.subject})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Select Chapter</label>
                        {loadingChapters ? (
                            <div className={styles.skeleton}>Loading chapters...</div>
                        ) : chapters.length === 0 ? (
                            <div className={styles.skeleton}>No chapters found</div>
                        ) : (
                            <select
                                className={styles.select}
                                value={selectedChapterId}
                                onChange={(e) => setSelectedChapterId(e.target.value)}
                            >
                                {chapters.map(ch => (
                                    <option key={ch._id} value={ch._id}>
                                        Ch {ch.orderIndex}: {ch.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </Card>

            {/* Add Section Buttons */}
            {selectedChapterId && (
                <div className={styles.addBar}>
                    <span className={styles.addLabel}>Add Section:</span>
                    {SECTION_TYPES.map(st => (
                        <button
                            key={st.value}
                            className={styles.addBtn}
                            onClick={() => addSection(st.value)}
                        >
                            {st.icon} {st.label.split(' ')[1]}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Sections Editor */}
            <div className={styles.sectionsContainer}>
                {sections.length === 0 && selectedChapterId && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📄</span>
                        <p>No content sections yet.</p>
                        <p className={styles.emptyHint}>Click the buttons above to add text, images, or diagrams.</p>
                    </div>
                )}

                {sections.map((section, idx) => (
                    <Card key={section.id} className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionType}>
                                {SECTION_TYPES.find(st => st.value === section.type)?.icon}
                                <span>{section.type.toUpperCase()}</span>
                                <span className={styles.sectionIndex}>#{idx + 1}</span>
                            </div>
                            <div className={styles.sectionActions}>
                                <button
                                    className={styles.moveBtn}
                                    onClick={() => moveSection(idx, -1)}
                                    disabled={idx === 0}
                                    title="Move Up"
                                >↑</button>
                                <button
                                    className={styles.moveBtn}
                                    onClick={() => moveSection(idx, 1)}
                                    disabled={idx === sections.length - 1}
                                    title="Move Down"
                                >↓</button>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => removeSection(idx)}
                                    title="Remove"
                                >✕</button>
                            </div>
                        </div>

                        <div className={styles.sectionBody}>
                            {section.type === 'text' && (
                                <textarea
                                    className={styles.contentTextarea}
                                    placeholder="Write your content here... You can write detailed explanations, key points, formulas, etc."
                                    value={section.body}
                                    onChange={(e) => updateSection(idx, 'body', e.target.value)}
                                    rows={6}
                                />
                            )}

                            {(section.type === 'image' || section.type === 'diagram') && (
                                <>
                                    <Input
                                        label={`${section.type === 'image' ? 'Image' : 'Diagram'} URL`}
                                        placeholder="https://example.com/image.png"
                                        value={section.url}
                                        onChange={(e) => updateSection(idx, 'url', e.target.value)}
                                    />
                                    <Input
                                        label="Caption (Optional)"
                                        placeholder="Describe this image/diagram..."
                                        value={section.caption}
                                        onChange={(e) => updateSection(idx, 'caption', e.target.value)}
                                    />
                                    {section.url && (
                                        <div className={styles.preview}>
                                            <p className={styles.previewLabel}>Preview:</p>
                                            <img
                                                src={section.url}
                                                alt={section.caption || 'Preview'}
                                                className={styles.previewImg}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Save Bar */}
            {sections.length > 0 && (
                <div className={styles.saveBar}>
                    <div className={styles.saveInfo}>
                        <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className={styles.saveActions}>
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/teacher')}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            loading={saving}
                        >
                            💾 Save Content
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageChapterContentPage;
