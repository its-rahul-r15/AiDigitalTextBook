import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import styles from './Auth.module.css';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER'];

const RegisterPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        schoolName: '',
        boardName: 'CBSE',
        gradeLevel: '',
        role: 'student',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Full name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        if (!form.schoolName.trim()) e.schoolName = 'School name is required';
        if (form.password.length < 8) e.password = 'Minimum 8 characters';
        if (!/[A-Z]/.test(form.password)) e.password = (e.password || '') + ' · 1 uppercase required';
        if (!/[0-9]/.test(form.password)) e.password = (e.password || '') + ' · 1 number required';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password))
            e.password = (e.password || '') + ' · 1 special char required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = {
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                schoolName: form.schoolName,
                boardName: form.boardName,
                role: form.role,
                ...(form.gradeLevel && { gradeLevel: parseInt(form.gradeLevel) }),
            };
            const { data } = await authService.register(payload);
            // Register returns the user but no token — redirect to login
            toast.success("Account created! Please sign in.");
            navigate('/login');
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed.';
            const detail = err.response?.data?.errors?.[0]?.msg;
            toast.error(detail || msg);
        } finally {
            setLoading(false);
        }
    };

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <Link to="/" className={styles.back}>← Back to home</Link>
                <div className={styles.logoWrap}>
                    <div className={styles.logo}>✦</div>
                    <h1 className={styles.title}>Create account</h1>
                    <p className={styles.sub}>Join thousands of smart learners</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <Input id="fullName" label="Full Name" placeholder="Alex Johnson"
                        value={form.fullName} onChange={set('fullName')} error={errors.fullName} />

                    <Input id="email" label="Email" type="email" placeholder="you@example.com"
                        value={form.email} onChange={set('email')} error={errors.email} />

                    <Input id="password" label="Password" type="password"
                        placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                        value={form.password} onChange={set('password')} error={errors.password} />

                    <Input id="schoolName" label="School Name" placeholder="Delhi Public School"
                        value={form.schoolName} onChange={set('schoolName')} error={errors.schoolName} />

                    {/* Board selector */}
                    <div className={styles.selectGroup}>
                        <label className={styles.selectLabel} htmlFor="boardName">Education Board</label>
                        <select id="boardName" className={styles.select}
                            value={form.boardName} onChange={set('boardName')}>
                            {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    {/* Grade (optional) */}
                    <div className={styles.selectGroup}>
                        <label className={styles.selectLabel} htmlFor="gradeLevel">Class / Grade (optional)</label>
                        <select id="gradeLevel" className={styles.select}
                            value={form.gradeLevel} onChange={set('gradeLevel')}>
                            <option value="">— Select class —</option>
                            {[6, 7, 8, 9, 10, 11, 12].map((g) => <option key={g} value={g}>Class {g}</option>)}
                        </select>
                    </div>

                    {/* Role */}
                    <div className={styles.roleGroup}>
                        <span className={styles.roleLabel}>I am a</span>
                        <div className={styles.roleBtns}>
                            {['student', 'teacher'].map((r) => (
                                <button key={r} type="button"
                                    className={[styles.roleBtn, form.role === r ? styles.roleBtnActive : ''].join(' ')}
                                    onClick={() => setForm({ ...form, role: r })}>
                                    {r === 'student' ? '🎓' : '👩‍🏫'} {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" fullWidth loading={loading} size="lg">Create Account</Button>
                </form>

                <p className={styles.switch}>
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
