'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { FiUser, FiShield, FiCheckCircle, FiAlertCircle, FiLock, FiInfo } from 'react-icons/fi';
import axios from 'axios';

type SettingsTab = 'profile' | 'account';

export default function SettingsPage() {
    const { profile, user, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Profile State
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [studentId, setStudentId] = useState(profile?.student_id_number || '');

    // Account State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token;
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/profile`,
                {
                    full_name: fullName,
                    student_id_number: profile?.role === 'student' ? studentId : undefined,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update profile.' });
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
            // Re-authenticate to verify old password
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: oldPassword,
            });

            if (authError) {
                throw new Error('Current password incorrect. Verification failed.');
            }

            // Update to new password
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password.' });
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
            setMessage({ type: 'success', text: 'Password reset email sent. Please check your inbox.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to send reset email.' });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    return (
        <div className="settings-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header className="page-header">
                <div className="page-header-left">
                    <h2>Settings</h2>
                    <p>Manage your personal profile and security preferences</p>
                </div>
            </header>

            <div className="tabs-container" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
                {/* Vertical Tabs Sidebar */}
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                    <div className="sidebar-section-label" style={{ color: 'var(--color-text-secondary)', padding: '0 8px 8px', marginBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                        Settings Menu
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                            className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('profile'); setMessage(null); }}
                            style={{
                                color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                background: activeTab === 'profile' ? 'var(--color-primary-50)' : 'transparent',
                                borderRadius: 'var(--radius-md)',
                                justifyContent: 'flex-start',
                                padding: '12px 16px',
                                width: '100%'
                            }}
                        >
                            <FiUser size={18} />
                            Profile Details
                        </button>
                        <button
                            className={`sidebar-link ${activeTab === 'account' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('account'); setMessage(null); }}
                            style={{
                                color: activeTab === 'account' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                background: activeTab === 'account' ? 'var(--color-primary-50)' : 'transparent',
                                borderRadius: 'var(--radius-md)',
                                justifyContent: 'flex-start',
                                padding: '12px 16px',
                                width: '100%'
                            }}
                        >
                            <FiShield size={18} />
                            Account Security
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-col gap-md">
                    {message && (
                        <div className={`badge badge-${message.type === 'success' ? 'paid' : 'unpaid'}`} style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            width: '100%',
                            justifyContent: 'flex-start',
                            fontSize: '14px'
                        }}>
                            {message.type === 'success' ? <FiCheckCircle style={{ marginRight: 8 }} /> : <FiAlertCircle style={{ marginRight: 8 }} />}
                            {message.text}
                        </div>
                    )}

                    <div className="card shadow-md">
                        {activeTab === 'profile' ? (
                            <div className="modal-body" style={{ padding: 0 }}>
                                <div className="flex-col gap-sm mb-lg" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-md)' }}>
                                    <h3 style={{ fontSize: 18, color: 'var(--color-primary)' }}>Personal Information</h3>
                                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Update your public information and identity details.</p>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="flex-col gap-md">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Full Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={user?.email || ''}
                                                disabled
                                                style={{ background: 'var(--color-bg)', opacity: 0.8 }}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">System Role</label>
                                            <div style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                                {profile.role.replace('_', ' ').toUpperCase()}
                                            </div>
                                        </div>
                                        {profile.role === 'student' && (
                                            <div className="form-group">
                                                <label className="form-label">Student ID Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. 2021-0123"
                                                    value={studentId}
                                                    onChange={(e) => setStudentId(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {profile.organization && (
                                        <div className="form-group">
                                            <label className="form-label">Organization / Department</label>
                                            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: 8, padding: '10px 14px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-primary-200)' }}>
                                                <FiInfo className="text-primary" />
                                                <span style={{ fontSize: 14, color: 'var(--color-primary-dark)', fontWeight: 600 }}>{profile.organization.name}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="modal-body" style={{ padding: 0 }}>
                                <div className="flex-col gap-sm mb-lg" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-md)' }}>
                                    <h3 style={{ fontSize: 18, color: 'var(--color-primary)' }}>Account Security</h3>
                                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Secure your account with a strong password.</p>
                                </div>

                                <form onSubmit={handleUpdatePassword} className="flex-col gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Current Password</label>
                                        <div className="search-bar" style={{ borderRadius: 'var(--radius-md)', padding: '0 14px' }}>
                                            <FiLock size={14} />
                                            <input
                                                type="password"
                                                className="form-control"
                                                style={{ border: 'none', boxShadow: 'none' }}
                                                placeholder="Enter current password to verify identity"
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">New Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Min. 6 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Confirm New Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Repeat new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-col gap-md" style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? 'Verifying & Updating...' : 'Update Password'}
                                        </button>

                                        <div style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                style={{ border: 'none', color: 'var(--color-primary)', textDecoration: 'underline' }}
                                                onClick={handleForgotPassword}
                                                disabled={loading}
                                            >
                                                Forgot your password?
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
