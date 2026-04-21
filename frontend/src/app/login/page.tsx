'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi';

export default function LoginPage() {
    const { signIn, user, loading } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingSignIn, setLoadingSignIn] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoadingSignIn(true);
        const { error } = await signIn(email, password);
        setLoadingSignIn(false);
        if (error) {
            setError(error);
        } else {
            router.replace('/dashboard');
        }
    };

    if (loading) {
        return (
            <main className="login-page">
                <div className="login-card-wrapper">
                    <div className="flex-center" style={{ minHeight: '400px' }}>
                        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)' }} />
                    </div>
                </div>
            </main>
        );
    }

    if (user) return null;

    return (
        <main className="login-page">
            <div className="login-card-wrapper">
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div className="login-logo centered">N</div>
                    <div className="login-logo-text centered">
                        <h1>NVSU Fines System</h1>
                        <span>Nueva Vizcaya State University</span>
                    </div>
                </div>

                <div className="login-card">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <div style={{
                            width: 48, height: 48,
                            background: 'var(--color-primary-100)',
                            borderRadius: 'var(--radius-full)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-primary)'
                        }}>
                            <FiShield size={24} />
                        </div>
                        <h2 style={{ textAlign: 'center' }}>Welcome Back</h2>
                        <p style={{ textAlign: 'center', margin: 0 }}>Sign in to your account</p>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 16 }}>
                            <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <FiMail size={16} style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-text-muted)', pointerEvents: 'none'
                                }} />
                                <input
                                    id="email"
                                    type="email"
                                    className="form-control"
                                    placeholder="you@nvsu.edu.ph"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ paddingLeft: 40 }}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <FiLock size={16} style={{
                                    position: 'absolute', left: 14, top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-text-muted)', pointerEvents: 'none'
                                }} />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: 40, paddingRight: 40 }}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 14, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        color: 'var(--color-text-muted)', cursor: 'pointer',
                                        padding: 0, display: 'flex', alignItems: 'center'
                                    }}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ margin: 0 }}
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                onClick={() => setError("Password reset functionality coming soon!")}
                                style={{
                                    background: 'none', border: 'none', color: 'var(--color-primary)',
                                    fontSize: 14, cursor: 'pointer', textDecoration: 'underline'
                                }}
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            id="login-submit-btn"
                            type="submit"
                            className="btn btn-primary w-full btn-lg"
                            disabled={loading}
                            style={{ marginTop: 16 }}
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-muted text-sm text-center" style={{ marginTop: 24 }}>
                        Powered by NCSSC & University IT
                    </p>
                </div>
            </div>
        </main>
    );
}
