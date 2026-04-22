'use client';

import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import { useEffect, useState } from 'react';
import { FiCheck, FiClock, FiSearch, FiUsers, FiX } from 'react-icons/fi';

interface LogEntry {
    id: string;
    userName: string;
    action: 'approved' | 'rejected';
    field: string;
    oldValue: string;
    newValue: string;
    timestamp: Date;
}

export default function UserProfilePage() {
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showLogsModal, setShowLogsModal] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .or('pending_full_name.not.is.null,pending_student_id.not.is.null')
            .order('full_name');
        setPendingUsers(data || []);
        setLoading(false);
    };

    const filtered = pendingUsers.filter(u =>
        search === '' ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.student_id_number?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedUsers = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleApproval = async (user: Profile, approve: boolean) => {
        setLoading(true);
        setError(null);
        try {
            const updatePayload: {
                pending_full_name: null;
                pending_student_id: null;
                full_name?: string;
                student_id_number?: string;
            } = { pending_full_name: null, pending_student_id: null };
            if (approve) {
                if (user.pending_full_name) updatePayload.full_name = user.pending_full_name;
                if (user.pending_student_id) updatePayload.student_id_number = user.pending_student_id;
            }
            const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);
            if (error) throw error;
            setSuccess(approve ? `Approved changes for ${user.full_name}` : `Rejected changes for ${user.full_name}`);
            
            // Create notification for the student
            const notificationData = {
                user_id: user.id,
                type: approve ? 'profile_approved' : 'profile_rejected',
                title: approve ? 'Profile Changes Approved' : 'Profile Changes Rejected',
                message: approve 
                    ? `Your profile changes have been approved and updated.`
                    : `Your profile changes have been rejected. Please contact an administrator for more information.`,
                read: false
            };
            
            await supabase.from('notifications').insert(notificationData);
            
            // Add log entries
            const newLogs: LogEntry[] = [];
            if (user.pending_full_name) {
                newLogs.push({
                    id: `${user.id}-name-${Date.now()}`,
                    userName: user.full_name,
                    action: approve ? 'approved' : 'rejected',
                    field: 'Full Name',
                    oldValue: user.full_name,
                    newValue: user.pending_full_name,
                    timestamp: new Date()
                });
            }
            if (user.pending_student_id) {
                newLogs.push({
                    id: `${user.id}-id-${Date.now()}`,
                    userName: user.full_name,
                    action: approve ? 'approved' : 'rejected',
                    field: 'Student ID',
                    oldValue: user.student_id_number || 'None',
                    newValue: user.pending_student_id,
                    timestamp: new Date()
                });
            }
            setLogs(prev => [...newLogs, ...prev].slice(0, 100)); // Keep last 100 entries
            
            fetchPendingUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: unknown) {
            const error = e as Error;
            setError(error.message || 'An error occurred while processing the request.');
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>User Profile Management</h2>
                    <p>Review and approve pending profile update requests.</p>
                </div>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowLogsModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <FiClock size={16} />
                    Logs ({logs.length})
                </button>
            </div>

            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{ marginBottom: 16 }}>
                <div className="search-bar">
                    <FiSearch size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or student ID…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            </div>

            <div className="card">
                <div className="table-header">
                    <span className="table-title">Pending Profile Approvals</span>
                    <span className="text-sm text-muted">{filtered.length} pending request{filtered.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <FiUsers />
                            <h4>No pending approvals</h4>
                            <p>All profile update requests have been processed.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Current Info</th>
                                    <th>Requested Changes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 34, height: 34, borderRadius: '50%',
                                                    background: 'var(--color-primary-100)',
                                                    color: 'var(--color-primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: 13, flexShrink: 0
                                                }}>
                                                    {u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-muted">
                                            <div>Name: {u.full_name}</div>
                                            <div>ID: {u.student_id_number || '—'}</div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {u.pending_full_name && (
                                                    <div style={{ marginBottom: 4 }}>
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>{u.full_name}</span>
                                                        {' → '}
                                                        <strong style={{ color: 'var(--color-text)' }}>{u.pending_full_name}</strong>
                                                    </div>
                                                )}
                                                {u.pending_student_id && (
                                                    <div>
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)' }}>
                                                            {u.student_id_number || 'None'}
                                                        </span>
                                                        {' → '}
                                                        <strong style={{ color: 'var(--color-text)' }}>{u.pending_student_id}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    style={{ color: 'var(--color-danger)' }}
                                                    onClick={() => handleApproval(u, false)}
                                                    disabled={loading}
                                                >
                                                    <FiX size={14} /> Reject
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleApproval(u, true)}
                                                    disabled={loading}
                                                >
                                                    <FiCheck size={14} /> Approve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex-center mt-md gap-sm" style={{ justifyContent: 'center', marginTop: '16px' }}>
                    <button
                        className="btn btn-ghost"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <button
                        className="btn btn-ghost"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

            {showLogsModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLogsModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Approval History</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowLogsModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {logs.length === 0 ? (
                                <div className="empty-state">
                                    <FiClock />
                                    <h4>No approval history</h4>
                                    <p>Actions will appear here as you approve or reject profile changes.</p>
                                </div>
                            ) : (
                                <div className="flex-col gap-md">
                                    {logs.map(log => (
                                        <div key={log.id} className="flex-between p-sm" style={{ 
                                            background: 'var(--color-bg)', 
                                            borderRadius: 'var(--radius-md)', 
                                            border: '1px solid var(--color-border)' 
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                                    {log.userName}
                                                </div>
                                                <div className="text-sm text-muted">
                                                    {log.field}: <span style={{ textDecoration: 'line-through' }}>{log.oldValue}</span> → {log.newValue}
                                                </div>
                                                <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                                                    {log.timestamp.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className={`badge ${log.action === 'approved' ? 'badge-paid' : 'badge-unpaid'}`}>
                                                {log.action === 'approved' ? <FiCheck size={12} /> : <FiX size={12} />}
                                                {log.action}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}