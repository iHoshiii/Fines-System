'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { FiUser, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
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
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update password.' });
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return null;

    return (
        <div className="settings-page">
            <header className="page-header">
                <div className="page-header-left">
                    <h2>Settings</h2>
                    <p>Manage your account and profile information</p>
                </div>
            </header>

            <div className="tabs-container">
                <div className="tabs-list">
                    <button
                        className={`tab-trigger ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('profile'); setMessage(null); }}
                    >
                        <FiUser style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Profile
                    </button>
                    <button
                        className={`tab-trigger ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('account'); setMessage(null); }}
                    >
                        <FiShield style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Account
                    </button>
                </div>

                {message && (
                    <div className={`badge badge-${message.type === 'success' ? 'paid' : 'unpaid'}`} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                        {message.type === 'success' ? <FiCheckCircle style={{ marginRight: 8 }} /> : <FiAlertCircle style={{ marginRight: 8 }} />}
                        {message.text}
                    </div>
                )}

                <div className="card settings-card">
                    {activeTab === 'profile' ? (
                        <form onSubmit={handleUpdateProfile} className="modal-body" style={{ padding: 0 }}>
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
                                    title="Email cannot be changed"
                                />
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Email contact is managed by administrator.</span>
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

                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={profile.role.replace('_', ' ').toUpperCase()}
                                    disabled
                                />
                            </div>

                            {profile.organization && (
                                <div className="form-group">
                                    <label className="form-label">Organization / Department</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={profile.organization.name}
                                        disabled
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: 'var(--space-md)' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="modal-body" style={{ padding: 0 }}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter new password"
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
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div style={{ marginTop: 'var(--space-md)' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Updating Password...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
