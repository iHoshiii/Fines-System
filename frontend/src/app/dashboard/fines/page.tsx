'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Fine, Profile, FineFormData } from '@/types';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch,
    FiX, FiSave, FiDollarSign, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function FinesPage() {
    const { profile } = useAuth();
    const isStudent = profile?.role === 'student';

    const [fines, setFines] = useState<Fine[]>([]);
    const [students, setStudents] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingFine, setEditingFine] = useState<Fine | null>(null);
    const [formData, setFormData] = useState<FineFormData>({
        student_id: '',
        amount: 0,
        description: '',
        status: 'unpaid',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            fetchFines();
            if (!isStudent) fetchStudents();
        }
    }, [profile]);

    const fetchFines = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('fines')
                .select('*, student:profiles!student_id(id, full_name, student_id_number), issuer:profiles!issued_by(full_name)')
                .order('created_at', { ascending: false });

            if (isStudent) query = query.eq('student_id', profile!.id);

            const { data, error } = await query;
            if (error) throw error;
            setFines(data || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, student_id_number')
            .eq('role', 'student')
            .order('full_name');
        setStudents(data || []);
    };

    const openAddModal = () => {
        setEditingFine(null);
        setFormData({ student_id: '', amount: 0, description: '', status: 'unpaid' });
        setError(null);
        setShowModal(true);
    };

    const openEditModal = (fine: Fine) => {
        setEditingFine(fine);
        setFormData({
            student_id: fine.student_id,
            amount: fine.amount,
            description: fine.description,
            status: fine.status,
        });
        setError(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.student_id || !formData.description || formData.amount <= 0) {
            setError('Please fill in all required fields with valid values.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            if (editingFine) {
                const { error } = await supabase
                    .from('fines')
                    .update({
                        student_id: formData.student_id,
                        amount: formData.amount,
                        description: formData.description,
                        status: formData.status,
                    })
                    .eq('id', editingFine.id);
                if (error) throw error;
                setSuccess('Fine updated successfully.');
            } else {
                const { error } = await supabase
                    .from('fines')
                    .insert({
                        student_id: formData.student_id,
                        amount: formData.amount,
                        description: formData.description,
                        status: formData.status,
                        issued_by: profile!.id,
                    });
                if (error) throw error;
                setSuccess('Fine added successfully.');
            }
            setShowModal(false);
            fetchFines();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this fine? This cannot be undone.')) return;
        const { error } = await supabase.from('fines').delete().eq('id', id);
        if (!error) {
            fetchFines();
            setSuccess('Fine deleted.');
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const filteredFines = fines.filter(f => {
        const matchStatus = statusFilter === 'all' || f.status === statusFilter;
        const matchSearch = search === '' ||
            f.description.toLowerCase().includes(search.toLowerCase()) ||
            (f.student as any)?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            (f.student as any)?.student_id_number?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>{isStudent ? 'My Fines' : 'Manage Fines'}</h2>
                    <p>{isStudent ? 'View your fine account status.' : 'Add, edit, or update student fines.'}</p>
                </div>
                {!isStudent && (
                    <button id="add-fine-btn" className="btn btn-primary" onClick={openAddModal}>
                        <FiPlus size={16} /> Add Fine
                    </button>
                )}
            </div>

            {/* Success Alert */}
            {success && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                    <FiCheckCircle size={16} /> {success}
                </div>
            )}

            {/* Filters */}
            <div className="flex-between" style={{ marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
                <div className="search-bar">
                    <FiSearch size={16} />
                    <input
                        id="fines-search"
                        type="text"
                        placeholder={isStudent ? 'Search fines…' : 'Search by student or description…'}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-sm">
                    {(['all', 'unpaid', 'paid'] as const).map(s => (
                        <button
                            key={s}
                            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter(s)}
                            id={`filter-${s}`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Loading…
                        </div>
                    ) : filteredFines.length === 0 ? (
                        <div className="empty-state">
                            <span style={{ fontSize: 40, fontWeight: 'bold' }}></span>
                            <h4>No fines found</h4>
                            <p>Try adjusting your search or filters.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    {!isStudent && <th>Student</th>}
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    {!isStudent && <th>Issued By</th>}
                                    {!isStudent && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFines.map(fine => (
                                    <tr key={fine.id}>
                                        {!isStudent && (
                                            <td>
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{(fine.student as any)?.full_name || '—'}</p>
                                                    <p className="text-sm text-muted">{(fine.student as any)?.student_id_number}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td>{fine.description}</td>
                                        <td style={{ fontWeight: 700, color: fine.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{Number(fine.amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${fine.status}`}>
                                                {fine.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                            </span>
                                        </td>
                                        <td className="text-sm text-muted">
                                            {format(new Date(fine.created_at), 'MMM d, yyyy')}
                                        </td>
                                        {!isStudent && (
                                            <td className="text-sm text-muted">{(fine.issuer as any)?.full_name || '—'}</td>
                                        )}
                                        {!isStudent && (
                                            <td>
                                                <div className="flex gap-xs">
                                                    <button
                                                        className="btn btn-icon btn-ghost"
                                                        onClick={() => openEditModal(fine)}
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button
                                                        className="btn btn-icon btn-danger"
                                                        onClick={() => handleDelete(fine.id)}
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingFine ? 'Edit Fine' : 'Add New Fine'}</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-error">
                                    <FiAlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Student *</label>
                                <select
                                    id="fine-student-select"
                                    className="form-control"
                                    value={formData.student_id}
                                    onChange={e => setFormData(p => ({ ...p, student_id: e.target.value }))}
                                >
                                    <option value="">Select a student…</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name} {s.student_id_number ? `(${s.student_id_number})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <input
                                    id="fine-description"
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Late submission, Uniform violation"
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Amount (₱) *</label>
                                    <input
                                        id="fine-amount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="0.00"
                                        value={formData.amount || ''}
                                        onChange={e => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        id="fine-status"
                                        className="form-control"
                                        value={formData.status}
                                        onChange={e => setFormData(p => ({ ...p, status: e.target.value as 'paid' | 'unpaid' }))}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                id="fine-save-btn"
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <FiSave size={15} />
                                {saving ? 'Saving…' : editingFine ? 'Update Fine' : 'Add Fine'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
