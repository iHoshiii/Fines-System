'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiInfo, FiLock, FiMail } from 'react-icons/fi';

export default function LoginPage() {
    const { signIn, signUp, verifyOtp, user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'how-to-use' | 'login' | 'signup'>('login');
    const [howToUseTab, setHowToUseTab] = useState<'Student' | 'Organization' | 'Admin'>('Student');

    // Login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Sign up state — Step 1
    const [signUpData, setSignUpData] = useState({
        email: '', firstName: '', middleName: '', lastName: '',
        college: '', course: '', year: '', password: '', confirmPassword: ''
    });
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Sign up state — Step 2 (OTP)
    const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
    const [otpCode, setOtpCode] = useState('');
    const [pendingEmail, setPendingEmail] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loadingSignIn, setLoadingSignIn] = useState(false);
    const [loadingSignUp, setLoadingSignUp] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        if (!email.includes('@nvsu.edu.ph')) {
            setError('Please use your NVSU email address');
            return;
        }

        setLoadingSignIn(true);
        const { error } = await signIn(email, password);
        setLoadingSignIn(false);
        if (error) {
            // Provide more user-friendly error messages
            if (error.includes('Invalid login credentials')) {
                setError('Invalid email or password. Please check your credentials and try again.');
            } else if (error.includes('Email not confirmed')) {
                setError('Please check your email and confirm your account before signing in.');
            } else {
                setError(error);
            }
        } else {
            router.replace('/dashboard');
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!signUpData.email.trim() || !signUpData.firstName.trim() || !signUpData.lastName.trim() ||
            !signUpData.college.trim() || !signUpData.course.trim() ||
            !signUpData.year.trim() || !signUpData.password.trim()) {
            setError('All fields are required');
            return;
        }
        if (!signUpData.email.endsWith('@nvsu.edu.ph')) {
            setError('Please use your NVSU email address (@nvsu.edu.ph)');
            return;
        }
        if (signUpData.password !== signUpData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (signUpData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoadingSignUp(true);
        const { error } = await signUp({
            email: signUpData.email,
            password: signUpData.password,
            fullName: `${signUpData.firstName} ${signUpData.middleName} ${signUpData.lastName}`.replace(/\s+/g, ' ').trim(),
            studentId: '',
            college: signUpData.college,
            course: signUpData.course,
            year: signUpData.year,
        });
        setLoadingSignUp(false);

        if (error) {
            if (error.includes('already registered')) setError('An account with this email already exists');
            else if (error.includes('restricted to @nvsu.edu.ph')) setError('Only @nvsu.edu.ph email addresses are allowed to register.');
            else setError(error);
            return;
        }

        setPendingEmail(signUpData.email);
        setSignUpStep(2);
        setSuccessMsg(`An 8-digit code was sent to ${signUpData.email}`);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (otpCode.length !== 8) {
            setError('Please enter the 8-digit code');
            return;
        }
        setLoadingOtp(true);
        const { error } = await verifyOtp(pendingEmail, otpCode);
        setLoadingOtp(false);
        if (error) {
            setError('Invalid or expired code. Please try again.');
            return;
        }
        router.replace('/dashboard');
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
        <div className="app-layout">
            <style>{`
        @keyframes scrollText {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animated-header {
            background: linear-gradient(to right, #FFD700, #FFF700);
            height: 11vh;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            position: relative;
            box-shadow: 0 4px 18px rgba(255, 215, 0, 0.3);
        }
        .marquee-wrapper {
            display: flex;
            white-space: nowrap;
            animation: scrollText 10s linear infinite;
        }
        .animated-text {
            color: #006837;
            font-size: 3rem;
            font-weight: 800;
            padding-right: 50px;
            font-family: 'Montserrat', sans-serif;
            letter-spacing: 0.8px;
            line-height: 1;
        }
            `}</style>
            {/* Green Sidebar */}
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-logo" style={{ background: 'white', padding: 2 }}>
                        <img src="/NVSUlogos/nvsu.png" alt="NVSU Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div className="sidebar-brand-text">
                        <h1>NVSU Fines</h1>
                        <span>Management System</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Access</div>
                    {(['login', 'signup', 'how-to-use', ] as const).map((tab) => {
                        const labels = {
                            'login': 'Log in',
                            'signup': 'Sign up',
                            'how-to-use': 'How to use?',
                        };
                        const isActive = activeTab === tab;
                        
                        return (
                            <Fragment key={tab}>
                            <button
                                onClick={() => setActiveTab(tab)}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.8)',
                                    fontWeight: isActive ? 600 : 500,
                                    transition: 'all var(--transition-base)'
                                }}
                            >
                                {tab === 'how-to-use' && <FiInfo size={18} />}
                                {tab === 'login' && <FiLock size={18} />}
                                {tab === 'signup' && <FiMail size={18} />}
                                {labels[tab]}
                            </button>
                            {tab === 'how-to-use' && activeTab === 'how-to-use' && (
                                <div style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {(['Student', 'Organization', 'Admin'] as const).map((sub) => (
                                        <button
                                            key={sub}
                                            onClick={() => setHowToUseTab(sub)}
                                            style={{
                                                background: howToUseTab === sub ? 'rgba(255,215,0,0.15)' : 'none',
                                                border: 'none', cursor: 'pointer',
                                                textAlign: 'left', padding: '8px 16px',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: 13,
                                                color: howToUseTab === sub ? 'white' : 'rgba(255,255,255,0.6)',
                                                fontWeight: howToUseTab === sub ? 600 : 400,
                                                borderLeft: howToUseTab === sub ? '3px solid #FFD700' : '3px solid transparent',
                                            }}
                                        >{sub}</button>
                                    ))}
                                </div>
                            )}
                            </Fragment>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14 }}>
                        Welcome to NVSU
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <div className="animated-header" style={{ width: '100%' }}>
                    <div className="marquee-wrapper">
                        <div className="animated-text">Nueva Vizcaya State University &nbsp;&nbsp;&nbsp;&nbsp;</div>
                        <div className="animated-text">Nueva Vizcaya State University &nbsp;&nbsp;&nbsp;&nbsp;</div>
                        <div className="animated-text">Nueva Vizcaya State University &nbsp;&nbsp;&nbsp;&nbsp;</div>
                        <div className="animated-text">Nueva Vizcaya State University &nbsp;&nbsp;&nbsp;&nbsp;</div>
                    </div>
                </div>
                <div className="page-content" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, backgroundImage: 'url(/NVSUlogos/nvsu2.jpg)', backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%', backgroundPosition: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 104, 55, 0.65)', pointerEvents: 'none' }}></div>

                    <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 24, maxWidth: '600px', margin: '0 auto 24px' }}>
                            <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="alert alert-success" style={{ marginBottom: 24, maxWidth: '600px', margin: '0 auto 24px' }}>
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>
                {activeTab === 'how-to-use' && (
                    <div style={{ padding: '20px', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                            <FiInfo size={24} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 4 }} />
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--color-primary)' }}>
                                    How to Use the NVSU Fines System
                                </h3>
                                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                    Welcome to the Nueva Vizcaya State University Fines Management System.
                                </p>
                            </div>
                        </div>
                        <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', minHeight: 100, color: 'var(--color-text-secondary)' }}>
                            {howToUseTab === 'Student' && <p>Student tutorials coming soon.</p>}
                            {howToUseTab === 'Organization' && <p>Organization tutorials coming soon.</p>}
                            {howToUseTab === 'Admin' && <p>Admin tutorials coming soon.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'login' && (
                    <div className="login-card" style={{ marginLeft: 'auto', marginRight: 'auto', width: '400px'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                Sign In
                            </h2>
                        </div>

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

                            <div className="form-group" >
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
                                disabled={loadingSignIn}
                                style={{ marginTop: 16 }}
                            >
                                {loadingSignIn ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'signup' && signUpStep === 1 && (
                    <div className="login-card">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                Create an Account
                            </h2>
                        </div>

                        <form className="login-form" onSubmit={handleSignUp}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="signup-email">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <FiMail size={16} style={{
                                        position: 'absolute', left: 14, top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--color-text-muted)', pointerEvents: 'none'
                                    }} />
                                    <input
                                        id="signup-email"
                                        type="email"
                                        className="form-control"
                                        placeholder="you@nvsu.edu.ph"
                                        value={signUpData.email}
                                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                                        required
                                        style={{ paddingLeft: 40 }}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="firstName">First Name</label>
                                    <input
                                        id="firstName"
                                        type="text"
                                        className="form-control"
                                        placeholder="First name"
                                        value={signUpData.firstName}
                                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="middleName">Middle Name</label>
                                    <input
                                        id="middleName"
                                        type="text"
                                        className="form-control"
                                        placeholder="Middle name"
                                        value={signUpData.middleName}
                                        onChange={(e) => setSignUpData({ ...signUpData, middleName: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="lastName">Last Name</label>
                                    <input
                                        id="lastName"
                                        type="text"
                                        className="form-control"
                                        placeholder="Last name"
                                        value={signUpData.lastName}
                                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="college">College</label>
                                    <input
                                        id="college"
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., CITE"
                                        value={signUpData.college}
                                        onChange={(e) => setSignUpData({ ...signUpData, college: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="course">Course</label>
                                    <input
                                        id="course"
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., BSCS"
                                        value={signUpData.course}
                                        onChange={(e) => setSignUpData({ ...signUpData, course: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="year">Year/Section</label>
                                    <input
                                        id="year"
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g., 2A"
                                        value={signUpData.year}
                                        onChange={(e) => setSignUpData({ ...signUpData, year: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="signup-password">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiLock size={16} style={{
                                            position: 'absolute', left: 14, top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--color-text-muted)', pointerEvents: 'none'
                                        }} />
                                        <input
                                            id="signup-password"
                                            type={showSignUpPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="Create a password"
                                            value={signUpData.password}
                                            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                                            required
                                            style={{ paddingLeft: 40, paddingRight: 40 }}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                            style={{
                                                position: 'absolute', right: 14, top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none', border: 'none',
                                                color: 'var(--color-text-muted)', cursor: 'pointer',
                                                padding: 0, display: 'flex', alignItems: 'center'
                                            }}
                                            aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                                        >
                                            {showSignUpPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiLock size={16} style={{
                                            position: 'absolute', left: 14, top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--color-text-muted)', pointerEvents: 'none'
                                        }} />
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-control"
                                            placeholder="Confirm your password"
                                            value={signUpData.confirmPassword}
                                            onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                                            required
                                            style={{ paddingLeft: 40, paddingRight: 40 }}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{
                                                position: 'absolute', right: 14, top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none', border: 'none',
                                                color: 'var(--color-text-muted)', cursor: 'pointer',
                                                padding: 0, display: 'flex', alignItems: 'center'
                                            }}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                id="signup-submit-btn"
                                type="submit"
                                className="btn btn-primary w-full btn-lg"
                                disabled={loadingSignUp}
                                style={{ marginTop: 16 }}
                            >
                                {loadingSignUp ? 'Creating Account…' : 'Sign Up'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'signup' && signUpStep === 2 && (
                    <div className="login-card" style={{ marginLeft: 'auto', marginRight: 'auto', width: '400px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Verify Your Email</h2>
                            <p style={{ textAlign: 'center', margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                Enter the 6-digit code sent to <strong>{pendingEmail}</strong>
                            </p>
                        </div>
                        <form className="login-form" onSubmit={handleVerifyOtp}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="otp-code">Verification Code</label>
                                <input
                                    id="otp-code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    className="form-control"
                                    placeholder="00000000"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-full btn-lg"
                                disabled={loadingOtp}
                                style={{ marginTop: 8 }}
                            >
                                {loadingOtp ? 'Verifying…' : 'Verify & Continue'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSignUpStep(1); setOtpCode(''); setError(null); setSuccessMsg(null); }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 14, cursor: 'pointer', textDecoration: 'underline', marginTop: 8 }}
                            >
                                ← Back to sign up
                            </button>
                        </form>
                    </div>
                )}
                </div>
                </div>

                </div>
            </main>
        </div>
    );
}

