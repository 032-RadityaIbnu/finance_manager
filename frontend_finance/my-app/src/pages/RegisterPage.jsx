import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthStepper from '../components/AuthStepper'; // 👈 Import Stepper

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            return setError('Password dan konfirmasi password tidak cocok!');
        }
        if (form.password.length < 6) {
            return setError('Password minimal 6 karakter!');
        }
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            setSuccess('Registrasi berhasil! Silakan masuk.');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-form-container">
                    {/* 🟢 STEPPER - Aktif di Step 1 */}
                    <AuthStepper activeStep={1} />

                    <h1 className="auth-title">Buat akun baru</h1>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="reg-name" className="form-label">Name</label>
                            <input
                                id="reg-name"
                                type="text"
                                name="name"
                                className="form-input"
                                value={form.name}
                                onChange={handleChange}
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-email" className="form-label">Email Address</label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                className="form-input"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-password" className="form-label">Password</label>
                            <input
                                id="reg-password"
                                type="password"
                                name="password"
                                className="form-input"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
                            <input
                                id="reg-confirm"
                                type="password"
                                name="confirm"
                                className="form-input"
                                value={form.confirm}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button
                            id="btn-register"
                            type="submit"
                            className="btn-submit"
                            disabled={loading}
                        >
                            {loading ? <span className="spinner"></span> : 'Sign Up'}
                        </button>
                    </form>

                    <div className="sso-divider">or</div>

                    <div className="sso-buttons">
                        <button type="button" className="sso-btn">
                            <svg viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>
                        <button type="button" className="sso-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.805 3.056 1.52-.065 2.126-.985 3.96-.985 1.834 0 2.404.985 3.995.952 1.623-.03 2.65-1.503 3.626-2.951 1.127-1.646 1.593-3.245 1.62-3.327-.037-.015-3.111-1.196-3.14-4.79-.028-3.007 2.455-4.469 2.57-4.544-1.424-2.083-3.629-2.28-4.417-2.316-2-.132-3.896 1.258-4.954 1.258-1.058 0-2.632-1.157-4.225-1.11z" />
                                <path d="M15.426 3.407c.801-1.144 1.341-2.736 1.194-4.329-1.259.055-2.793.844-3.619 1.956-.732.96-1.344 2.585-1.171 4.148 1.405.109 2.766-.632 3.596-1.775z" />
                            </svg>
                            Sign in with Apple
                        </button>
                    </div>

                    <p className="auth-switch">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link" id="link-to-login">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
            <div className="auth-right"></div>
        </div>
    );
}