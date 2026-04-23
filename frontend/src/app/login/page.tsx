'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';

export default function LoginPage() {
    const { signIn, user, loading } = useAuth();
    const router = useRouter();
    
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
    const [isSignUp, setIsSignUp] = useState(false);

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
        <main className="login-page">
            <div className="login-card-wrapper" style={{ maxWidth: isSignUp ? '700px' : '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: 'bold', 
                        background: 'linear-gradient(135deg, #FFD700 0%, #006837 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: 8
                    }}>
                        NVSU Fines System
                    </h1>
                </div>

                {/* Error display */}
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 16 }}>
                        <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Single Card for both forms */}
                <div className="login-card">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                            {isSignUp ? 'Create an Account' : 'Sign In'}
                        </h2>
                        <p style={{ textAlign: 'center', margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                            {isSignUp ? 'Join the NVSU Fines System' : 'Welcome back to NVSU Fines System'}
                        </p>
                    </div>

                    {isSignUp ? (
                        /* Sign Up Form */
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
                                        placeholder="Your college"
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
                                        placeholder="Your course"
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
                                        placeholder="e.g., 2nd Year - A"
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

                            <button
                                type="button"
                                onClick={() => setIsSignUp(false)}
                                className="btn btn-secondary w-full"
                                style={{ marginTop: 16 }}
                            >
                                Sign In
                            </button>
                        </form>
                    ) : (
                        /* Sign In Form */
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
                                disabled={loadingSignIn}
                                style={{ marginTop: 16 }}
                            >
                                {loadingSignIn ? 'Signing in…' : 'Sign In'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsSignUp(true)}
                                className="btn btn-secondary w-full"
                                style={{ marginTop: 16 }}
                            >
                                Sign Up
                            </button>
                        </form>
                    )}
                </div>
                </div>
        </main>
    );
}

