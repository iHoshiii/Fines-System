'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { supabase } from '@/lib/supabaseClient';
import { Fine, FineFormData } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';

export default function FinesPage() {
    const { profile } = useAuth();
    const { fines: allFines, students, loading, refreshFines, descriptionOptions, addDescriptionOption } = useData();
    const isStudent = profile?.role === 'student';

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [showModal, setShowModal] = useState(false);
    const [showDescModal, setShowDescModal] = useState(false);
    const [newDesc, setNewDesc] = useState('');
    const [editingFine, setEditingFine] = useState<Fine | null>(null);
    const [formData, setFormData] = useState<FineFormData>({
        student_id: '',
        amount: 0,
        description: '',
        status: 'unpaid'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const LAST_DESCRIPTION_STORAGE_KEY = 'fine_last_selected_description';

    const fines = isStudent ? (allFines || []).filter(f => f.student_id === profile!.id) : (allFines || []);

    const openAddModal = () => {
        const last = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_DESCRIPTION_STORAGE_KEY) || '' : '';
        setEditingFine(null);
        setFormData({ student_id: '', amount: 0, description: last, status: 'unpaid' });
        setError(null);
        setShowModal(true);
    };

    const handleAddDescription = () => {
        if (!newDesc.trim()) return;
        addDescriptionOption(newDesc.trim());
        setNewDesc('');
        setShowDescModal(false);
        setSuccess('Template added successfully');
        setTimeout(() => setSuccess(null), 3000);
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
        if (!formData.student_id || !formData.description.trim() || formData.amount <= 0) {
            setError('Missing required fields');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const payload = {
                student_id: formData.student_id,
                amount: formData.amount,
                description: formData.description.trim(),
                status: formData.status,
            };

            let queryError;
            if (editingFine) {
                const { error } = await supabase.from('fines').update(payload).eq('id', editingFine.id);
                queryError = error;
            } else {
                const { error } = await supabase.from('fines').insert({ ...payload, issued_by: profile!.id });
                queryError = error;
            }

            if (queryError) throw queryError;

            setShowModal(false);
            refreshFines();
            setSuccess(editingFine ? 'Fine updated successfully' : 'Fine added successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this fine?')) return;
        const { error } = await supabase.from('fines').delete().eq('id', id);
        if (!error) {
            refreshFines();
            setSuccess('Fine deleted');
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const filteredFines = fines.filter(f => {
        const matchStatus = statusFilter === 'all' || f.status === statusFilter;
        const s = search.toLowerCase();
        const matchSearch = search === '' ||
            f.description.toLowerCase().includes(s) ||
            (f.student as any)?.full_name?.toLowerCase().includes(s);
        return matchStatus && matchSearch;
    });

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>{isStudent ? 'My Fines' : 'Manage Fines'}</h2>
                    <p>{isStudent ? 'View your account fine status.' : 'Issue and track student fines.'}</p>
                </div>
                {!isStudent && (
                    <div className="flex gap-sm">
                        <button className="btn btn-ghost" onClick={() => { setShowDescModal(true); setError(null); }}>
                            <FiPlus size={16} /> Add Description
                        </button>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <FiPlus size={16} /> Add Fine
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-between gap-sm mb-md flex-wrap">
                <div className="search-bar">
                    <FiSearch size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-xs">
                    {(['all', 'unpaid', 'paid'] as const).map(s => (
                        <button
                            key={s}
                            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                    <FiCheckCircle size={16} /> {success}
                </div>
            )}

            <div className="table-container">
                <div className="table-wrapper">
                    {loading && fines.length === 0 ? (
                        <div className="p-xl text-center">Loading...</div>
                    ) : filteredFines.length === 0 ? (
                        <div className="empty-state">
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
                                    {!isStudent && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFines.map(f => (
                                    <tr key={f.id}>
                                        {!isStudent && (
                                            <td>
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{(f.student as any)?.full_name || '-'}</p>
                                                    <p className="text-xs text-muted">{(f.student as any)?.student_id_number || ''}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td>{f.description}</td>
                                        <td style={{ fontWeight: 700, color: f.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{Number(f.amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${f.status}`}>
                                                {f.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                            </span>
                                        </td>
                                        <td className="text-sm text-muted">
                                            {format(new Date(f.created_at), 'MMM d, yyyy')}
                                        </td>
                                        {!isStudent && (
                                            <td>
                                                {(profile?.role === 'admin' || f.issued_by === profile?.id) ? (
                                                    <div className="flex gap-xs">
                                                        <button className="btn btn-icon btn-ghost" onClick={() => openEditModal(f)}>
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(f.id)}>
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted">View Only</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Fine Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingFine ? 'Edit Fine' : 'Add Fine'}</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                                    <FiAlertCircle size={16} /> {error}
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Student</label>
                                <select
                                    className="form-control"
                                    value={formData.student_id}
                                    onChange={e => setFormData(p => ({ ...p, student_id: e.target.value }))}
                                >
                                    <option value="">Select a student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input
                                    className="form-control"
                                    list="description-list"
                                    value={formData.description}
                                    onChange={e => {
                                        setFormData(p => ({ ...p, description: e.target.value }));
                                        if (e.target.value) window.localStorage.setItem(LAST_DESCRIPTION_STORAGE_KEY, e.target.value);
                                    }}
                                    placeholder="Type or select a description..."
                                />
                                <datalist id="description-list">
                                    {descriptionOptions.map(opt => (
                                        <option key={opt} value={opt} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-muted mt-xs">You can type a custom description or pick from the list.</p>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Amount (₱)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={formData.amount || ''}
                                        onChange={e => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-control"
                                        value={formData.status}
                                        onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <FiSave size={15} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Description Template Modal */}
            {showDescModal && (
                <div className="modal-overlay" onClick={() => setShowDescModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3>Add Description Template</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowDescModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-sm text-muted mb-md">
                                Add a common event or fine reason (e.g., "Meeting Absence"). This will appear as a suggestion when adding fines.
                            </p>
                            <div className="form-group">
                                <label className="form-label">Description Text</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="e.g. Foundation Day Absence"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowDescModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddDescription}>
                                <FiPlus size={15} /> Add Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
