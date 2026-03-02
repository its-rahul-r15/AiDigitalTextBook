import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateCoursePage.module.css';
import { contentService } from '../../services/content.service';
import Card from '../../components/ui/Card/Card';
import Button from '../../components/ui/Button/Button';
import { toast } from 'react-hot-toast';

const CreateCoursePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: '',
        gradeLevel: 10,
        board: 'CBSE'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            return toast.error("Title and Description are required");
        }

        setLoading(true);
        try {
            const { data } = await contentService.createCourse(formData);
            toast.success("Course created successfully!");
            navigate('/teacher');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create course");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backBtn}>← Back</button>
                <h1>Create New Course 📚</h1>
            </header>

            <div className={styles.container}>
                <Card className={styles.formCard}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.fieldGroup}>
                            <label>Course Title</label>
                            <input
                                className={styles.input}
                                placeholder="e.g. Advanced Organic Chemistry"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label>Description</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="What will students learn in this course?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                required
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <label>Grade Level</label>
                                <select
                                    className={styles.select}
                                    value={formData.gradeLevel}
                                    onChange={(e) => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
                                >
                                    {[6, 7, 8, 9, 10, 11, 12].map(g => (
                                        <option key={g} value={g}>Grade {g}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Educational Board</label>
                                <select
                                    className={styles.select}
                                    value={formData.board}
                                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                                >
                                    {['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER'].map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label>Thumbnail URL (Optional)</label>
                            <input
                                className={styles.input}
                                placeholder="https://example.com/image.jpg"
                                value={formData.thumbnail}
                                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                            />
                        </div>

                        <div className={styles.actions}>
                            <Button primary fullWidth type="submit" loading={loading}>
                                Launch Course 🚀
                            </Button>
                        </div>
                    </form>
                </Card>

                <aside className={styles.tipsAside}>
                    <div className={styles.tipBox}>
                        <h3>AI Suggestion</h3>
                        <p>A good course title is concise and mentions the core subject. You can add chapters and concepts once the course is created.</p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CreateCoursePage;
