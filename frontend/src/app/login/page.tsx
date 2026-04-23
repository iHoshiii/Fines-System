'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiInfo, FiLock, FiMail } from 'react-icons/fi';

export default function LoginPage() {
    const { signIn, user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'how-to-use' | 'login' | 'signup'>('login');
    
    // Login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    
    // Sign up state
    const [signUpData, setSignUpData] = useState({
        email: '',
        firstName: '',
        middleName: '',
        lastName: '',
        college: '',
        course: '',
        year: '',
        password: '',
        confirmPassword: ''
    });
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    const [loadingSignIn, setLoadingSignIn] = useState(false);
    const [loadingSignUp, setLoadingSignUp] = useState(false);

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

        // Validation
        if (!signUpData.email.trim() || !signUpData.firstName.trim() || !signUpData.lastName.trim() || 
            !signUpData.college.trim() || !signUpData.course.trim() || 
            !signUpData.year.trim() || !signUpData.password.trim()) {
            setError('All fields are required');
            return;
        }
        
        if (!signUpData.email.includes('@nvsu.edu.ph')) {
            setError('Please use your NVSU email address');
            return;
        }
        
        if (signUpData.password !== signUpData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (signUpData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoadingSignUp(true);
        
        try {
            // Create user in Supabase Auth
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: signUpData.email,
                password: signUpData.password,
                options: {
                    data: {
                        full_name: `${signUpData.firstName} ${signUpData.middleName} ${signUpData.lastName}`.trim(),
                        role: 'student',
                        college: signUpData.college,
                        course: signUpData.course,
                        year_section: signUpData.year
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                    setError('An account with this email already exists');
                } else {
                    setError(signUpError.message);
                }
                return;
            }

            setError('Account created successfully! Please check your email to confirm your account.');
            // Reset form after successful signup
            setSignUpData({
                email: '',
                firstName: '',
                middleName: '',
                lastName: '',
                college: '',
                course: '',
                year: '',
                password: '',
                confirmPassword: ''
            });
            
        } catch (err) {
            setError('An error occurred during sign up');
        } finally {
            setLoadingSignUp(false);
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
        <div className="app-layout">
            <style>{`
                @keyframes scrollText {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }
                
                .animated-header {
                    background: linear-gradient(to right, #FFD700, #FFF700);
                    height: 20vh;
                    min-height: 180px;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-shadow: 0 4px 18px rgba(255, 215, 0, 0.3);
                    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
                }
                
                .animated-text {
                    color: #006837;
                    font-size: clamp(2rem, 5vw, 4.2rem);
                    font-weight: 800;
                    white-space: nowrap;
                    animation: scrollText 10s linear infinite;
                    font-family: 'Montserrat', sans-serif;
                    letter-spacing: 0.8px;
                    line-height: 1;
                }
            `}</style>
            {/* Green Sidebar */}
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-logo">N</div>
                    <div className="sidebar-brand-text">
                        <h1>NVSU Fines</h1>
                        <span>Management System</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Access</div>
                    {(['how-to-use', 'login', 'signup'] as const).map((tab) => {
                        const labels = {
                            'how-to-use': 'How to use?',
                            'login': 'Log in',
                            'signup': 'Sign up'
                        };
                        const isActive = activeTab === tab;
                        
                        return (
                            <button
                                key={tab}
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
            <main className="main-content">
                <div className="page-content" style={{ padding: '10px 0px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="animated-header" style={{ marginBottom: 32, width: '100%' }}>
                        <div className="animated-text">Nueva Vizcaya State University</div>
                    </div> 

                    {/* Error display */}
                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: 24, maxWidth: '600px', margin: '0 auto 24px' }}>
                            <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>{error}</span>
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
                                    Welcome to the Nueva Vizcaya State University Fines Management System. This platform helps students, faculty, and organizations manage fines efficiently.
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--color-primary)' }}>For Students:</h4>
                                <ul style={{ paddingLeft: 20, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                                    <li><strong>View Fines:</strong> Check your outstanding fines and payment history</li>
                                    <li><strong>Make Payments:</strong> Pay fines online through integrated payment methods</li>
                                    <li><strong>Track Status:</strong> Monitor payment confirmations and fine settlements</li>
                                    <li><strong>Receive Notifications:</strong> Get alerts about new fines and deadlines</li>
                                </ul>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--color-primary)' }}>For Organizations:</h4>
                                <ul style={{ paddingLeft: 20, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                                    <li><strong>Manage Members:</strong> Add and manage organization members</li>
                                    <li><strong>Issue Fines:</strong> Create and assign fines to members</li>
                                    <li><strong>Monitor Payments:</strong> Track payment status across the organization</li>
                                    <li><strong>Generate Reports:</strong> Create detailed financial reports</li>
                                </ul>
                            </div>
                            
                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--color-primary)' }}>Getting Started:</h4>
                                <ol style={{ paddingLeft: 20, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                                    <li>Sign up using your NVSU email address</li>
                                    <li>Complete your profile information</li>
                                    <li>Verify your account through email confirmation</li>
                                    <li>Log in to access your dashboard</li>
                                    <li>Navigate through the different sections as needed</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'login' && (
                    <div className="login-card" style={{ marginTop: '65px', marginLeft: 'auto', marginRight: 'auto', width: '400px'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                Sign In
                            </h2>
                            <p style={{ textAlign: 'center', margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                Welcome back to NVSU Fines System
                            </p>
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

                {activeTab === 'signup' && (
                    <div className="login-card">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                Create an Account
                            </h2>
                            <p style={{ textAlign: 'center', margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                Join the NVSU Fines System
                            </p>
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
                </div>
                </div>
            </main>
        </div>
    );
}

