import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import styles from './Auth.module.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.email) e.email = 'Email is required';
        if (!form.password) e.password = 'Password is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const { data } = await authService.login(form);
            const user = data.data?.user;
            login(user, data.data?.accessToken);
            toast.success('Welcome back!');
            // Route by role
            navigate(user?.role === 'teacher' ? '/teacher' : '/learn');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <Link to="/" className={styles.back}>← Back to home</Link>
                <div className={styles.logoWrap}>
                    <div className={styles.logo}>✦</div>
                    <h1 className={styles.title}>Welcome back</h1>
                    <p className={styles.sub}>Sign in to continue learning</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <Input id="email" label="Email" type="email" placeholder="you@example.com"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        error={errors.email} />
                    <Input id="password" label="Password" type="password" placeholder="••••••••"
                        value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                        error={errors.password} />
                    <Button type="submit" fullWidth loading={loading} size="lg">Sign In</Button>
                </form>

                <p className={styles.switch}>
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
