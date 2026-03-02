import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contentService } from '../../services/content.service';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import styles from './CreateChapterPage.module.css';

const CreateChapterPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        courseId: '',
        title: '',
        description: '',
        orderIndex: 1,
        isOfflineAvailable: false
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        contentService.getCourses()
            .then(({ data }) => {
                const fetchedCourses = data.data || [];
                setCourses(fetchedCourses);
                if (fetchedCourses.length > 0) {
                    setForm(prev => ({ ...prev, courseId: fetchedCourses[0]._id }));
                }
            })
            .catch(() => toast.error('Failed to load courses'))
            .finally(() => setLoadingCourses(false));
    }, []);

    const validate = () => {
        const e = {};
        if (!form.courseId) e.courseId = 'Please select a course';
        if (!form.title.trim()) e.title = 'Chapter title is required';
        if (form.orderIndex < 1) e.orderIndex = 'Order index must be at least 1';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await contentService.createChapter(form);
            toast.success('Chapter created successfully!');
            navigate('/teacher');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create chapter');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link to="/teacher" className={styles.back}>← Back to Dashboard</Link>
                <h1>Create New Chapter</h1>
                <p>Add a new learning module to one of your courses.</p>
            </div>

            <Card className={styles.formCard}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>Target Course</label>
                        {loadingCourses ? (
                            <div className={styles.skeleton}>Loading courses...</div>
                        ) : (
                            <select
                                className={styles.select}
                                value={form.courseId}
                                onChange={(e) => handleChange('courseId', e.target.value)}
                            >
                                {courses.map(course => (
                                    <option key={course._id} value={course._id}>
                                        {course.title} ({course.subject})
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.courseId && <p className={styles.errorText}>{errors.courseId}</p>}
                    </div>

                    <Input
                        label="Chapter Title"
                        placeholder="e.g. Introduction to Thermodynamics"
                        value={form.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        error={errors.title}
                    />

                    <div className={styles.field}>
                        <label className={styles.label}>Description (Optional)</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Briefly describe what this chapter covers..."
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>

                    <Input
                        label="Order Index"
                        type="number"
                        min="1"
                        value={form.orderIndex}
                        onChange={(e) => handleChange('orderIndex', parseInt(e.target.value) || 1)}
                        error={errors.orderIndex}
                        hint="Determines the sequence of chapters in the course."
                    />

                    <div className={styles.checkboxField}>
                        <input
                            type="checkbox"
                            id="isOffline"
                            checked={form.isOfflineAvailable}
                            onChange={(e) => handleChange('isOfflineAvailable', e.target.checked)}
                        />
                        <label htmlFor="isOffline">Available for offline study</label>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/teacher')}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={loadingCourses}
                        >
                            Create Chapter
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateChapterPage;
