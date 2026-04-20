'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import {
    FiUser, FiShield, FiCheckCircle, FiAlertCircle,
    FiLock, FiMail, FiHash, FiGrid, FiArrowRight
} from 'react-icons/fi';


export default function SettingsPage() {
    const { profile, user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form States
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [studentId, setStudentId] = useState(profile?.student_id_number || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const updateData: Record<string, string> = { full_name: fullName };
            if (profile?.role === 'student') {
                updateData.student_id_number = studentId;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profile!.id);

            if (error) throw error;

            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile changes saved successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: oldPassword,
            });
            if (authError) throw new Error('Incorrect current password.');
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;
            setMessage({ type: 'success', text: 'Password has been updated.' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Verification failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!user?.email) return;
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/login?reset=true`,
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Recovery email sent. Please check your inbox.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Service unavailable.' });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    const initials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <div className="settings-container" style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            {/* 1. Header Banner */}
            <div className="card-glass shadow-lg" style={{
                background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
                padding: 'var(--space-2xl) var(--space-xl)',
                borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--space-xl)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Pattern */}
                <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', right: 50, bottom: -80, width: 150, height: 150, background: 'rgba(215,255,0,0.1)', borderRadius: '50%' }} />

                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: 'var(--space-lg)', position: 'relative', zIndex: 1 }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: 'var(--radius-lg)',
                        background: 'rgba(255,255,255,0.2)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                        fontWeight: 800,
                        backdropFilter: 'blur(4px)'
                    }}>
                        {initials}
                    </div>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{profile.full_name}</h2>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: 12, marginTop: 4 }}>
                            <span className="badge" style={{ background: 'var(--color-accent)', color: 'var(--color-primary-dark)', fontWeight: 700 }}>{profile.role.replace('_', ' ').toUpperCase()}</span>
                            <span style={{ fontSize: 13, opacity: 0.8 }}>{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`badge badge-${message.type === 'success' ? 'paid' : 'unpaid'}`} style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-lg)',
                    width: '100%',
                    marginBottom: 'var(--space-lg)',
                    justifyContent: 'flex-start',
                    fontSize: '14px',
                    boxShadow: 'var(--shadow-sm)',
                    border: message.type === 'success' ? '1px solid var(--color-success)' : '1px solid var(--color-danger)'
                }}>
                    {message.type === 'success' ? <FiCheckCircle style={{ marginRight: 10, fontSize: 18 }} /> : <FiAlertCircle style={{ marginRight: 10, fontSize: 18 }} />}
                    {message.text}
                </div>
            )}

            {/* 2. Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 'var(--space-lg)' }}>

                {/* Profile Section */}
                <div className="card shadow-md" style={{ borderTop: '4px solid var(--color-primary)' }}>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: 12, marginBottom: 'var(--space-lg)' }}>
                        <div className="stat-icon green" style={{ width: 40, height: 40 }}><FiUser size={20} /></div>
                        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Profile Information</h3>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="flex-col gap-md">
                        <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Full Legal Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>

                        {profile.role === 'student' && (
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Student ID Number</label>
                                <div className="search-bar" style={{ borderRadius: 'var(--radius-md)', padding: '0 14px', background: 'var(--color-bg)' }}>
                                    <FiHash size={14} />
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ border: 'none', boxShadow: 'none' }}
                                        placeholder="e.g. 2021-0001"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Account Role</label>
                                <div className="flex-center" style={{
                                    justifyContent: 'flex-start',
                                    gap: 8,
                                    padding: '10px 14px',
                                    background: 'var(--color-bg)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 13,
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <FiShield size={14} />
                                    {profile.role.replace('_', ' ').toUpperCase()}
                                </div>
                            </div>
                            {profile.organization && (
                                <div className="form-group">
                                    <label className="form-label">Affiliation</label>
                                    <div className="flex-center" style={{
                                        justifyContent: 'flex-start',
                                        gap: 8,
                                        padding: '10px 14px',
                                        background: 'var(--color-bg)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 13,
                                        color: 'var(--color-text-secondary)',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <FiGrid size={14} />
                                        {profile.organization.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 'var(--space-md)' }}>
                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Saving Changes...' : 'Update Profile'}
                                <FiArrowRight style={{ marginLeft: 8 }} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security Section */}
                <div className="card shadow-md" style={{ borderTop: '4px solid var(--color-accent)' }}>
                    <div className="flex-center" style={{ justifyContent: 'flex-start', gap: 12, marginBottom: 'var(--space-lg)' }}>
                        <div className="stat-icon gold" style={{ width: 40, height: 40 }}><FiLock size={20} /></div>
                        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Security
                        </h3>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="flex-col gap-md">
                        <div className="form-group">
                            <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Current Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Verify your current identity"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Min. 6 chars"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', margin: 'var(--space-sm) 0' }}>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                style={{ border: 'none', color: 'var(--color-primary)', fontSize: 13, textDecoration: 'underline' }}
                                onClick={handleForgotPassword}
                                disabled={loading}
                            >
                                I forgot my current password
                            </button>
                        </div>

                        <div style={{ marginTop: 'var(--space-md)' }}>
                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', background: 'var(--color-primary-dark)' }} disabled={loading}>
                                {loading ? 'Processing...' : 'Change Secure Password'}
                                <FiArrowRight style={{ marginLeft: 8 }} />
                            </button>
                        </div>
                    </form>

                    <div style={{
                        marginTop: 'var(--space-xl)',
                        padding: 'var(--space-md)',
                        background: 'var(--color-primary-50)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        gap: 12
                    }}>
                        <FiMail className="text-primary" style={{ flexShrink: 0, marginTop: 4 }} />
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>Registered Email</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{user?.email}</p>
                            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Contact Admin to change your official email address.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
