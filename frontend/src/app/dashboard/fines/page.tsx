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
    const [issuerFilter, setIssuerFilter] = useState<string>('all');
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

    // Filter, pagination, sorting states
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // Add Fine Student Selection
    const [studentSearch, setStudentSearch] = useState('');

    // Pay Fines Modal
    const [showPayModal, setShowPayModal] = useState(false);
    const [payFineSearch, setPayFineSearch] = useState('');
    const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
    const [payStatus, setPayStatus] = useState<'paid' | 'unpaid'>('paid');
    const [updatingPayment, setUpdatingPayment] = useState(false);

    const LAST_DESCRIPTION_STORAGE_KEY = 'fine_last_selected_description';

    const fines = isStudent ? (allFines || []).filter(f => f.student_id === profile!.id) : (allFines || []);

    const [isCustomDesc, setIsCustomDesc] = useState(false);

    const openAddModal = () => {
        setEditingFine(null);
        setFormData({ student_id: '', amount: 0, description: '', status: 'unpaid' });
        setIsCustomDesc(false);
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
        setIsCustomDesc(!descriptionOptions.includes(fine.description));
        setError(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.student_id || !formData.description.trim() || formData.amount <= 0) {
            setError('Missing required fields');
            return;
        }

        // Auto-add custom description to templates
        if (isCustomDesc && formData.description.trim() && !descriptionOptions.includes(formData.description.trim())) {
            addDescriptionOption(formData.description.trim());
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

    const applyFineStatus = async () => {
        if (selectedFineIds.length === 0) return;
        setUpdatingPayment(true);
        try {
            const { error } = await supabase
                .from('fines')
                .update({ status: payStatus })
                .in('id', selectedFineIds);
            if (error) throw error;
            await refreshFines();
            setShowPayModal(false);
            setSuccess(`Updated ${selectedFineIds.length} fine(s) status`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUpdatingPayment(false);
        }
    };

    // First-In-Last-Out (FILO) = descending by created_at
    const sortedFines = [...fines].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const filteredFines = sortedFines.filter(f => {
        const matchStatus = statusFilter === 'all' || f.status === statusFilter;
        let matchIssuer = true;
        if (issuerFilter !== 'all') {
            const issuerRole = (f.issuer as any)?.role;
            matchIssuer = issuerRole === issuerFilter;
        }

        const s = search.toLowerCase();
        const matchSearch = search === '' ||
            f.description.toLowerCase().includes(s) ||
            (f.student as any)?.full_name?.toLowerCase().includes(s) ||
            (f.student as any)?.student_id_number?.toLowerCase().includes(s) ||
            (f.student as any)?.college?.toLowerCase().includes(s) ||
            (f.student as any)?.course?.toLowerCase().includes(s) ||
            (f.student as any)?.year_section?.toLowerCase().includes(s);
        return matchStatus && matchIssuer && matchSearch;
    });

    const totalPages = Math.ceil(filteredFines.length / ITEMS_PER_PAGE);
    const paginatedFines = filteredFines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Student sorting and filtering for Add Fines
    const sortedStudents = [...students].sort((a, b) => {
        const getSurname = (name: string) => name.split(' ').pop() || '';
        return getSurname(a.full_name).localeCompare(getSurname(b.full_name));
    });
    const filteredStudents = sortedStudents.filter(s => {
        const term = studentSearch.toLowerCase();
        return (
            (s.full_name || '').toLowerCase().includes(term) ||
            (s.student_id_number || '').toLowerCase().includes(term) ||
            (s.college || '').toLowerCase().includes(term) ||
            (s.course || '').toLowerCase().includes(term) ||
            (s.year_section || '').toLowerCase().includes(term)
        );
    });

    // Filtering for Pay Fines modal
    const payModalFines = sortedFines.filter(f => {
        const s = payFineSearch.toLowerCase();
        return (
            f.description.toLowerCase().includes(s) ||
            (f.student as any)?.full_name?.toLowerCase().includes(s) ||
            (f.student as any)?.student_id_number?.toLowerCase().includes(s)
        );
    });

    const renderTableSkeleton = (rows = 6) => (
        <table aria-hidden="true">
            <thead>
                <tr>
                    {!isStudent && <th>Student</th>}
                    <th>Description</th>
                    <th>Given by</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    {!isStudent && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`}>
                        {!isStudent && (
                            <td>
                                <div className="flex-col gap-xs">
                                    <div className="skeleton" style={{ width: 140, height: 12 }} />
                                    <div className="skeleton" style={{ width: 90, height: 10 }} />
                                </div>
                            </td>
                        )}
                        <td><div className="skeleton" style={{ width: '85%', height: 12 }} /></td>
                        <td><div className="skeleton" style={{ width: 90, height: 12 }} /></td>
                        <td><div className="skeleton" style={{ width: 70, height: 12 }} /></td>
                        <td><div className="skeleton" style={{ width: 80, height: 20, borderRadius: 999 }} /></td>
                        <td><div className="skeleton" style={{ width: 90, height: 12 }} /></td>
                        {!isStudent && (
                            <td>
                                <div className="flex gap-xs">
                                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)' }} />
                                    <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)' }} />
                                </div>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );

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
                        <button className="btn btn-primary" onClick={() => { setShowPayModal(true); setSelectedFineIds([]); }}>
                            Pay Fines
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
                    <select
                        className="form-control"
                        style={{ height: '32px', padding: '0 12px', fontSize: '14px', borderRadius: 'var(--radius-md)', width: 'auto' }}
                        value={issuerFilter}
                        onChange={e => setIssuerFilter(e.target.value)}
                    >
                        <option value="all">All Issuers</option>
                        <option value="ncssc">NCSSC</option>
                        <option value="college_org">College Org</option>
                        <option value="sub_org">Sub Org</option>
                        <option value="admin">Admin</option>
                    </select>

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
                        renderTableSkeleton()
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
                                    <th>Given by</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    {!isStudent && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedFines.map(f => {
                                    const issuerRole = (f.issuer as any)?.role;
                                    let roleDisplay = issuerRole;
                                    if (issuerRole === 'ncssc') roleDisplay = 'NCSSC';
                                    if (issuerRole === 'college_org') roleDisplay = 'College Org';
                                    if (issuerRole === 'sub_org') roleDisplay = 'Sub Org';
                                    if (issuerRole === 'admin') roleDisplay = 'Admin';

                                    return (
                                        <tr key={f.id}>
                                            {!isStudent && (
                                                <td>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{(f.student as any)?.full_name || '-'}</p>
                                                        <p className="text-xs text-muted">{(f.student as any)?.student_id_number || ''}</p>
                                                        <p className="text-xs text-muted">
                                                            {(f.student as any)?.college || '—'} • {(f.student as any)?.course || '—'}
                                                        </p>
                                                    </div>
                                                </td>
                                            )}
                                            <td>{f.description}</td>
                                            <td>
                                                <p style={{ fontWeight: 500 }}>{(f.issuer as any)?.full_name || 'System'}</p>
                                                {roleDisplay && <p className="text-xs text-muted mt-xs">{roleDisplay}</p>}
                                            </td>
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
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex-center mt-md gap-sm" style={{ justifyContent: 'center' }}>
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
                                <input
                                    type="text"
                                    className="form-control mb-xs"
                                    placeholder="Type to search students (Name, ID, College, Section)..."
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                />
                                <select
                                    className="form-control"
                                    value={formData.student_id}
                                    onChange={e => setFormData(p => ({ ...p, student_id: e.target.value }))}
                                >
                                    <option value="" disabled>Select Student ({filteredStudents.length} results)</option>
                                    {filteredStudents.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name} | {s.college || 'N/A'} - {s.course || 'N/A'} {s.year_section || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                {isCustomDesc ? (
                                    <div className="flex-col gap-xs">
                                        <input
                                            className="form-control"
                                            value={formData.description}
                                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Type custom description..."
                                            autoFocus
                                        />
                                        <button className="text-xs text-primary btn-link text-left" onClick={() => setIsCustomDesc(false)}>
                                            ← Back to template list
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        className="form-control"
                                        value={descriptionOptions.includes(formData.description) ? formData.description : ""}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === "MANUAL_ENTRY") {
                                                setIsCustomDesc(true);
                                                setFormData(p => ({ ...p, description: "" }));
                                            } else {
                                                setFormData(p => ({ ...p, description: val }));
                                            }
                                        }}
                                    >
                                        <option value="" disabled>Select Event</option>
                                        {descriptionOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="MANUAL_ENTRY">✍️ Type Custom Description...</option>
                                    </select>
                                )}
                                <p className="text-xs text-muted mt-xs">Select from templates or type a custom reason.</p>
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

            {/* Pay Fines Modal */}
            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <div className="modal-header">
                            <div>
                                <h3>Pay Fines</h3>
                                <p className="text-sm text-muted">Select fines to mark as paid or unpaid.</p>
                            </div>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowPayModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <div className="form-group">
                                <div className="search-bar" style={{ marginBottom: 12 }}>
                                    <FiSearch size={14} />
                                    <input
                                        type="text"
                                        placeholder="Search fine description, student name, or ID..."
                                        value={payFineSearch}
                                        onChange={e => setPayFineSearch(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div className="flex-between" style={{ marginBottom: 12 }}>
                                <div className="flex gap-sm">
                                    <button className={`btn btn-sm ${payStatus === 'paid' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPayStatus('paid')}>
                                        Mark as Paid
                                    </button>
                                    <button className={`btn btn-sm ${payStatus === 'unpaid' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPayStatus('unpaid')}>
                                        Mark as Unpaid
                                    </button>
                                </div>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => setSelectedFineIds(
                                        selectedFineIds.length === payModalFines.length
                                            ? []
                                            : payModalFines.map(f => f.id)
                                    )}
                                >
                                    {selectedFineIds.length === payModalFines.length && payModalFines.length > 0 ? 'Clear All' : 'Select All'}
                                </button>
                            </div>

                            {payModalFines.length === 0 ? (
                                <p className="text-center text-muted">No fines match your search.</p>
                            ) : (
                                <div className="flex-col gap-sm">
                                    {payModalFines.map(f => (
                                        <label key={f.id} className="card flex-between" style={{ padding: 12, cursor: 'pointer' }}>
                                            <div className="flex gap-sm align-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFineIds.includes(f.id)}
                                                    onChange={e => {
                                                        const checked = e.target.checked;
                                                        setSelectedFineIds(prev => checked ? [...prev, f.id] : prev.filter(id => id !== f.id));
                                                    }}
                                                />
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{f.description}</p>
                                                    <p className="text-xs text-muted">{(f.student as any)?.full_name} | {format(new Date(f.created_at), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 700 }}>₱{Number(f.amount).toFixed(2)}</p>
                                                <span className={`badge badge-${f.status}`} style={{ fontSize: 10 }}>{f.status.toUpperCase()}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowPayModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={applyFineStatus} disabled={selectedFineIds.length === 0 || updatingPayment}>
                                {updatingPayment ? 'Updating...' : `Apply to ${selectedFineIds.length} Fine(s)`}
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
