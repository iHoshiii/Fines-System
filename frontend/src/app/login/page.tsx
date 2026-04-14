'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiShield } from 'react-icons/fi';

export default function LoginPage() {
    const { signIn } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);
        if (error) {
            setError(error);
        } else {
            router.replace('/dashboard');
        }
    };

    return (
        <main className="login-page">
            {/* Left Panel */}
            <div className="login-left">
                <div className="login-logo-wrap">
                    <div className="login-logo">N</div>
                    <div className="login-logo-text">
                        <h1>NVSU Fines System</h1>
                        <span>Nueva Vizcaya State University</span>
                    </div>
                </div>

                <p className="login-tagline">
                    Manage Student <span>Fines</span> — Clear, Fast &amp; Organized.
                </p>
                <p className="login-sub">
                    A centralized platform for tracking and managing student fines across all organizations — NCSSC, College Orgs, and Sub-Orgs.
                </p>

                <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                        { icon: '🏫', title: 'Multi-Organization Support', desc: 'Admin, NCSSC, College Orgs & Sub-Orgs' },
                        { icon: '🔒', title: 'Role-Based Access', desc: 'Every user sees only what they need' },
                        { icon: '📊', title: 'Real-Time Tracking', desc: 'Instant fine status updates and reports' },
                    ].map((f) => (
                        <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 20 }}>{f.icon}</span>
                            <div>
                                <p style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{f.title}</p>
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel — Login Card */}
            <div className="login-right">
                <div className="login-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{
                            width: 36, height: 36,
                            background: 'var(--color-primary-100)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-primary)'
                        }}>
                            <FiShield size={18} />
                        </div>
                        <h2>Welcome Back</h2>
                    </div>
                    <p>Sign in to your NVSU Fines System account</p>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 8 }}>
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
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: 40 }}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button
                            id="login-submit-btn"
                            type="submit"
                            className="btn btn-primary w-full btn-lg"
                            disabled={loading}
                            style={{ marginTop: 8 }}
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-muted text-sm text-center" style={{ marginTop: 20 }}>
                        Contact your administrator if you need access.
                    </p>
                </div>
            </div>
        </main>
    );
}
