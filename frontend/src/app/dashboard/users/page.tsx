'use client';

import { supabase } from '@/lib/supabase/supabaseClient';
import { Profile, UserRole } from '@/types';
import { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheck, FiClock, FiEdit2, FiPlus, FiSave, FiSearch, FiUsers, FiX } from 'react-icons/fi';
import { ROLE_LABEL, ROLE_BADGE } from '@/utils/formatters';
import Pagination from '@/components/ui/Pagination';
import PageHeader from '@/components/ui/PageHeader';

interface LogEntry {
    id: string;
    userName: string;
    action: 'approved' | 'rejected';
    field: string;
    oldValue: string;
    newValue: string;
    timestamp: Date;
}

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Profile | null>(null);
    const [form, setForm] = useState({ full_name: '', email: '', role: 'student' as UserRole, student_id_number: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'profiles'>('users');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showLogsModal, setShowLogsModal] = useState(false);

    useEffect(() => { 
        fetchUsers(); 
        fetchPendingUsers();
        loadLogsFromStorage();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase.from('profiles').select('*, organization:organizations(name)').order('full_name');
        setUsers(data || []);
        setLoading(false);
    };

    const fetchPendingUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .or('pending_full_name.not.is.null,pending_student_id.not.is.null')
            .order('full_name');
        setPendingUsers(data || []);
    };

    const fetchOrgs = async () => {
        const { data } = await supabase.from('organizations').select('id, name').order('name');
        setOrgs(data || []);
    };

    const loadLogsFromStorage = () => {
        const savedLogs = localStorage.getItem('admin_logs');
        if (savedLogs) {
            try {
                const parsedLogs = JSON.parse(savedLogs).map((log: any) => ({
                    ...log,
                    timestamp: new Date(log.timestamp)
                }));
                
                // Filter out logs older than 1 month
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                const recentLogs = parsedLogs.filter((log: LogEntry) => log.timestamp > oneMonthAgo);
                
                setLogs(recentLogs);
                
                // Save cleaned logs back to storage
                if (recentLogs.length !== parsedLogs.length) {
                    saveLogsToStorage(recentLogs);
                }
            } catch (error) {
                console.error('Error loading logs from storage:', error);
            }
        }
    };

    const saveLogsToStorage = (newLogs: LogEntry[]) => {
        localStorage.setItem('admin_logs', JSON.stringify(newLogs));
    };

    const openAdd = () => {
        setEditing(null);
        setForm({ full_name: '', email: '', role: 'student', student_id_number: '', password: '' });
        setError(null);
        setShowModal(true);
    };

    const openEdit = (u: Profile) => {
        setEditing(u);
        setForm({ full_name: u.full_name, email: u.email || '', role: u.role, student_id_number: u.student_id_number || '', password: '' });
        setError(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.full_name.trim()) { setError('Full name is required.'); return; }
        setSaving(true);
        setError(null);

        try {
            if (editing) {
                const updatePayload: any = {
                    full_name: form.full_name,
                    role: form.role,
                    student_id_number: form.role === 'student' ? form.student_id_number : null,
                };

                // Keep existing email if the admin accidentally deletes it from the input
                if (form.email.trim() !== '') {
                    updatePayload.email = form.email.trim();
                } else if (editing.email) {
                    updatePayload.email = editing.email;
                }

                // Update profile only (email/password changes via Supabase Auth Admin API in production)
                const { error } = await supabase.from('profiles').update(updatePayload).eq('id', editing.id);
                if (error) throw error;
                setSuccess('User updated successfully.');
            } else {
                if (!form.email || !form.password) { setError('Email and password are required for new users.'); setSaving(false); return; }
                // Create Supabase auth user via Edge Function or Admin API in production
                // For now, insert profile directly (assumes user was created via Supabase dashboard or invite)
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: { data: { full_name: form.full_name } }
                });
                if (authError) throw authError;
                if (authData.user) {
                    await supabase.from('profiles').upsert({
                        id: authData.user.id,
                        full_name: form.full_name,
                        email: form.email,
                        role: form.role,
                        student_id_number: form.role === 'student' ? form.student_id_number : null,
                    });
                }
                setSuccess('User created. They may need to verify their email.');
            }
            setShowModal(false);
            fetchUsers();
            setTimeout(() => setSuccess(null), 4000);
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setSaving(false);
        }
    };

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
            const updatedLogs = [...newLogs, ...logs].slice(0, 100); // Keep last 100 entries
            setLogs(updatedLogs);
            saveLogsToStorage(updatedLogs);
            
            fetchPendingUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: unknown) {
            const error = e as Error;
            setError(error.message || 'An error occurred while processing the request.');
        }
        setLoading(false);
    };

    const handleDeleteLog = (logId: string) => {
        const updatedLogs = logs.filter(log => log.id !== logId);
        setLogs(updatedLogs);
        saveLogsToStorage(updatedLogs);
    };

    // Filter and pagination logic
    const filtered = activeTab === 'users' 
        ? users.filter(u => 
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (u.student_id_number && u.student_id_number.toLowerCase().includes(search.toLowerCase())) ||
            u.role.toLowerCase().includes(search.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
        )
        : pendingUsers.filter(u => 
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (u.student_id_number && u.student_id_number.toLowerCase().includes(search.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
        );

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedUsers = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>User Management</h2>
                    <p>Create and manage system user accounts and profile approvals.</p>
                </div>
                {activeTab === 'users' && (
                    <button id="add-user-btn" className="btn btn-primary" onClick={openAdd}>
                        <FiPlus size={16} /> Add User
                    </button>
                )}
                {activeTab === 'profiles' && (
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setShowLogsModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <FiClock size={16} />
                        Logs ({logs.length})
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation" style={{ marginBottom: 24 }}>
                <button 
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <FiUsers size={16} style={{ marginRight: 8 }} />
                    Users
                </button>
                <button 
                    className={`tab-button ${activeTab === 'profiles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profiles')}
                    style={{ position: 'relative' }}
                >
                    <FiCheck size={16} style={{ marginRight: 8 }} />
                    Profile Approvals
                    {pendingUsers.length > 0 && (
                        <span className="notification-badge" style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--color-danger)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '600'
                        }}>
                            {pendingUsers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'users' ? (
                <div>
                    {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

                    <div style={{ marginBottom: 16 }}>
                        <div className="search-bar">
                            <FiSearch size={16} />
                            <input id="user-search" type="text" placeholder="Search by name, ID, or role…" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
                        </div>
                    </div>

            <div className="table-container">
                <div className="table-header">
                    <span className="table-title">All Users</span>
                    <span className="text-sm text-muted">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <FiUsers />
                            <h4>No users found</h4>
                            <p>Add a user to get started.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Student ID</th>
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
                                                <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                                        <td className="text-muted">{u.student_id_number || '—'}</td>
                                        <td>
                                            <button className="btn btn-icon btn-ghost" onClick={() => openEdit(u)} title="Edit">
                                                <FiEdit2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editing ? 'Edit User' : 'Create New User'}</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><FiX size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-error"><FiAlertCircle size={16} /> {error}</div>}
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input id="user-fullname" type="text" className="form-control" placeholder="Juan Dela Cruz" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input id="user-email" type="email" className="form-control" placeholder="user@nvsu.edu.ph" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            {!editing && (
                                <div className="form-group">
                                    <label className="form-label">Temporary Password *</label>
                                    <input id="user-password" type="password" className="form-control" placeholder="Min 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                                </div>
                            )}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <select id="user-role" className="form-control" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}>
                                        <option value="student">Student</option>
                                        <option value="ncssc">NCSSC</option>
                                        <option value="college_org">College Org</option>
                                        <option value="sub_org">Sub-Org</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                {form.role === 'student' && (
                                    <div className="form-group">
                                        <label className="form-label">Student ID Number</label>
                                        <input id="user-student-id" type="text" className="form-control" placeholder="2021-XXXXX" value={form.student_id_number} onChange={e => setForm(p => ({ ...p, student_id_number: e.target.value }))} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button id="user-save-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <FiSave size={15} /> {saving ? 'Saving…' : editing ? 'Update' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
                </div>
            ) : (
                /* Profile Approvals Tab */
                <div>
                    {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}
                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

                    <div style={{ marginBottom: 16 }}>
                        <div className="search-bar">
                            <FiSearch size={16} />
                            <input 
                                type="text" 
                                placeholder="Search pending profiles…" 
                                value={search} 
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <div className="table-header">
                            <span className="table-title">Pending Profile Changes</span>
                            <span className="text-sm text-muted">{filtered.length} pending</span>
                        </div>
                        <div className="table-wrapper">
                            {loading ? (
                                <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
                            ) : filtered.length === 0 ? (
                                <div className="empty-state">
                                    <FiCheck />
                                    <h4>No pending approvals</h4>
                                    <p>All profile changes have been processed.</p>
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
                                        {paginatedUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <strong>{user.full_name}</strong>
                                                        <small style={{ color: 'var(--color-text-muted)' }}>
                                                            {user.student_id_number || user.email}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px' }}>
                                                        <div><strong>Name:</strong> {user.full_name}</div>
                                                        <div><strong>ID:</strong> {user.student_id_number || 'None'}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px' }}>
                                                        {user.pending_full_name && (
                                                            <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                                                Name: {user.pending_full_name}
                                                            </div>
                                                        )}
                                                        {user.pending_student_id && (
                                                            <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                                                ID: {user.pending_student_id}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button 
                                                            className="btn btn-success btn-sm" 
                                                            onClick={() => handleApproval(user, true)}
                                                            disabled={loading}
                                                        >
                                                            <FiCheck size={14} /> Approve
                                                        </button>
                                                        <button 
                                                            className="btn btn-danger btn-sm" 
                                                            onClick={() => handleApproval(user, false)}
                                                            disabled={loading}
                                                        >
                                                            <FiX size={14} /> Reject
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
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    )}

                    {/* Logs Modal */}
                    {showLogsModal && (
                        <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
                            <div className="modal" style={{ maxWidth: '800px' }}>
                                <div className="modal-header">
                                    <h3>Approval Logs</h3>
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
                                        <div className="logs-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {logs.map((log) => (
                                                <div key={log.id} className="log-entry" style={{ 
                                                    padding: '12px', 
                                                    border: '1px solid var(--color-border)', 
                                                    borderRadius: 'var(--radius-md)',
                                                    marginBottom: '8px',
                                                    background: log.action === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                        <div>
                                                            <strong>{log.userName}</strong> - {log.field} {log.action}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <small style={{ color: 'var(--color-text-muted)' }}>
                                                                {log.timestamp.toLocaleString()}
                                                            </small>
                                                            <button 
                                                                className="btn btn-ghost btn-icon" 
                                                                onClick={() => handleDeleteLog(log.id)}
                                                                style={{ color: 'var(--color-danger)', padding: '4px' }}
                                                                title="Delete log entry"
                                                            >
                                                                <FiX size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                                        <div>From: <strong>{log.oldValue}</strong></div>
                                                        <div>To: <strong>{log.newValue}</strong></div>
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
            )}
        </div>
    );
}
