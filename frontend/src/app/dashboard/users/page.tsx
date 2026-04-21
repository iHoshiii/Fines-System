'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile, UserRole } from '@/types';
import { FiPlus, FiEdit2, FiSearch, FiX, FiSave, FiAlertCircle, FiUsers } from 'react-icons/fi';

const roleLabel: Record<UserRole, string> = {
    admin: 'Admin',
    student: 'Student',
    ncssc: 'NCSSC',
    college_org: 'College Org',
    sub_org: 'Sub-Org',
};
const roleBadge: Record<UserRole, string> = {
    admin: 'badge-role-admin',
    student: 'badge-role-student',
    ncssc: 'badge-role-ncssc',
    college_org: 'badge-role-college_org',
    sub_org: 'badge-role-sub_org',
};

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Profile | null>(null);
    const [form, setForm] = useState({ full_name: '', email: '', role: 'student' as UserRole, student_id_number: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => { fetchUsers(); fetchOrgs(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data } = await supabase.from('profiles').select('*, organization:organizations(name)').order('full_name');
        setUsers(data || []);
        setLoading(false);
    };

    const fetchOrgs = async () => {
        const { data } = await supabase.from('organizations').select('id, name').order('name');
        setOrgs(data || []);
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

    const filtered = users.filter(u =>
        search === '' ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.student_id_number?.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    const pendingApprovals = users.filter(u => u.pending_full_name || u.pending_student_id);

    const handleApproval = async (user: Profile, approve: boolean) => {
        setLoading(true);
        try {
            const updatePayload: any = { pending_full_name: null, pending_student_id: null };
            if (approve) {
                if (user.pending_full_name) updatePayload.full_name = user.pending_full_name;
                if (user.pending_student_id) updatePayload.student_id_number = user.pending_student_id;
            }
            await supabase.from('profiles').update(updatePayload).eq('id', user.id);
            setSuccess(approve ? `Approved changes for ${user.full_name}` : `Rejected changes for ${user.full_name}`);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>User Management</h2>
                    <p>Create and manage system user accounts.</p>
                </div>
                <button id="add-user-btn" className="btn btn-primary" onClick={openAdd}>
                    <FiPlus size={16} /> Add User
                </button>
            </div>

            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            <div style={{ marginBottom: 16 }}>
                <div className="search-bar">
                    <FiSearch size={16} />
                    <input id="user-search" type="text" placeholder="Search by name, ID, or role…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {pendingApprovals.length > 0 && (
                <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--color-accent)' }}>
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                        <h4 style={{ color: 'var(--color-primary-dark)' }}>Pending Profile Approvals</h4>
                        <span className="badge badge-unpaid">{pendingApprovals.length} Request(s)</span>
                    </div>
                    <div className="flex-col gap-sm">
                        {pendingApprovals.map(p => (
                            <div key={p.id} className="flex-between p-sm" style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <div>
                                    <p style={{ fontWeight: 600 }}>{p.full_name}</p>
                                    <div className="text-sm text-muted mt-xs flex-col gap-xs">
                                        {p.pending_full_name && <div><span style={{ textDecoration: 'line-through' }}>{p.full_name}</span> → <strong style={{ color: 'var(--color-text)' }}>{p.pending_full_name}</strong></div>}
                                        {p.pending_student_id && <div><span style={{ textDecoration: 'line-through' }}>{p.student_id_number || 'None'}</span> → <strong style={{ color: 'var(--color-text)' }}>{p.pending_student_id}</strong></div>}
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleApproval(p, false)}>Reject</button>
                                    <button className="btn btn-sm btn-primary" onClick={() => handleApproval(p, true)}>Approve</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                                {filtered.map(u => (
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
                                        <td><span className={`badge ${roleBadge[u.role]}`}>{roleLabel[u.role]}</span></td>
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
    );
}
