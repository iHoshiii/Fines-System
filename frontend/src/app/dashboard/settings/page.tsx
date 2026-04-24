'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/supabaseClient';
import { useState } from 'react';
import {
    FiAlertCircle,
    FiArrowRight,
    FiCheckCircle,
    FiGrid,
    FiHash,
    FiLock, FiMail,
    FiShield,
    FiUser
} from 'react-icons/fi';


export default function SettingsPage() {
    const { profile, user, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingSecurity, setSavingSecurity] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form States
    const [fullName, setFullName] = useState(profile?.pending_full_name || profile?.full_name || '');
    const [studentId, setStudentId] = useState(profile?.pending_student_id || profile?.student_id_number || '');
    const [college, setCollege] = useState(profile?.college || '');
    const [course, setCourse] = useState(profile?.course || '');
    const [yearSection, setYearSection] = useState(profile?.year_section || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setMessage(null);
        try {
            const updateData: Record<string, string> = {};
            if (profile?.role === 'student') {
                if (fullName.trim() !== profile.full_name) updateData.pending_full_name = fullName.trim();
                else updateData.pending_full_name; // Clear if reverted

                if (studentId.trim() !== profile.student_id_number) updateData.pending_student_id = studentId.trim();
                else updateData.pending_student_id; // Clear if reverted

                updateData.college = college;
                updateData.course = course;
                updateData.year_section = yearSection;
            } else {
                updateData.full_name = fullName;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profile!.id);

            if (error) throw error;

            // Send notification to student if they requested changes
            if (profile?.role === 'student' && (updateData.pending_full_name || updateData.pending_student_id)) {
                const changes: string[] = [];
                if (updateData.pending_full_name) changes.push(`name to "${updateData.pending_full_name}"`);
                if (updateData.pending_student_id) changes.push(`student ID to "${updateData.pending_student_id}"`);

                const notificationData = {
                    user_id: profile.id,
                    type: 'profile_change_requested',
                    title: 'Profile Change Requested',
                    message: `You requested to change your ${changes.join(' and ')}. Your request is pending admin approval.`,
                    read: false
                };

                await supabase.from('notifications').insert(notificationData);

                // Send notification to all admins
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'admin');

                if (admins && admins.length > 0) {
                    const adminNotifications = admins.map(admin => ({
                        user_id: admin.id,
                        type: 'profile_change_pending',
                        title: 'Profile Change Request',
                        message: `${profile.full_name} (${profile.student_id_number || profile.email}) requested to change their ${changes.join(' and ')}.`,
                        read: false
                    }));

                    await supabase.from('notifications').insert(adminNotifications);
                }
            }

            await refreshProfile();
            setMessage({ type: 'success', text: 'Profile changes saved successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setSavingSecurity(true);
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
            setSavingSecurity(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!user?.email) return;
        setSavingSecurity(true);
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
            setSavingSecurity(false);
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

            {/* Tabs Header */}
            <div className="flex gap-sm" style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)' }}>
                <button
                    className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => { setActiveTab('profile'); setMessage(null); }}
                    style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
                >
                    <FiUser size={16} /> Profile
                </button>
                <button
                    className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => { setActiveTab('security'); setMessage(null); }}
                    style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
                >
                    <FiShield size={16} /> Security
                </button>
            </div>

            {/* 2. Content Container */}
            <div>
                {/* Profile Section */}
                {activeTab === 'profile' && (
                    <div className="card shadow-md" style={{ borderTop: '4px solid var(--color-primary)', animation: 'fadeIn 0.3s' }}>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: 12, marginBottom: 'var(--space-lg)' }}>
                            <div className="stat-icon green" style={{ width: 40, height: 40 }}><FiUser size={20} /></div>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Profile Information</h3>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="flex-col gap-md">
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>
                                    Full Legal Name
                                    {profile.pending_full_name && <span className="text-xs" style={{ color: 'var(--color-accent)', marginLeft: 8 }}>(Pending Approval)</span>}
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    placeholder="Enter your full name"
                                />
                                {profile.role === 'student' && <p className="text-xs text-muted mt-xs">Changes require Admin approval.</p>}
                            </div>

                            {profile.role === 'student' && (
                                <div className="form-col gap-md">
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>
                                            Student ID Number
                                            {profile.pending_student_id && <span className="text-xs" style={{ color: 'var(--color-accent)', marginLeft: 8 }}>(Pending Approval)</span>}
                                        </label>
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
                                        <p className="text-xs text-muted mt-xs">Changes require Admin approval.</p>
                                    </div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>College</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. CITE"
                                                value={college}
                                                onChange={(e) => setCollege(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Course</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. BSCS"
                                                value={course}
                                                onChange={(e) => setCourse(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Year and Section</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. 3A"
                                            value={yearSection}
                                            onChange={(e) => setYearSection(e.target.value)}
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
                                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={savingProfile}>
                                    {savingProfile ? 'Saving Changes...' : 'Update Profile'}
                                    <FiArrowRight style={{ marginLeft: 8 }} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Security Section */}
                {activeTab === 'security' && (
                    <div className="card shadow-md" style={{ borderTop: '4px solid var(--color-accent)', animation: 'fadeIn 0.3s' }}>
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
                                    disabled={savingSecurity}
                                >
                                    I forgot my current password
                                </button>
                            </div>

                            <div style={{ marginTop: 'var(--space-md)' }}>
                                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', background: 'var(--color-primary-dark)' }} disabled={savingSecurity}>
                                    {savingSecurity ? 'Processing...' : 'Change Secure Password'}
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
                                {profile.role === 'student' && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Contact Admin to change your official email address.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
