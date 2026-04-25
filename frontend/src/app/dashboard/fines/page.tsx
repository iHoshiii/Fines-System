'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Fine, FineFormData } from '@/types';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { usePagination } from '@/hooks/usePagination';
import { useFlashMessage } from '@/hooks/useFlashMessage';
import { formatCurrency, formatIssuerRole, getSurname } from '@/utils/formatters';
import { filterProfiles } from '@/utils/profileSearch';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import DescriptionTemplateModal from '@/components/ui/modals/DescriptionTemplateModal';
import PayFinesModal from '@/components/ui/modals/PayFinesModal';

export default function FinesPage() {
    const { profile } = useAuth();
    const { fines: allFines, students, loading, refreshFines, descriptionOptions, addDescriptionOption } = useData();
    const isStudent = profile?.role === 'student';

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [issuerFilter, setIssuerFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [showDescModal, setShowDescModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [editingFine, setEditingFine] = useState<Fine | null>(null);
    const [formData, setFormData] = useState<FineFormData>({ student_id: '', amount: 0, description: '', status: 'unpaid' });
    const [isCustomDesc, setIsCustomDesc] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [saving, setSaving] = useState(false);

    const { success, error, setError, showSuccess, clearMessages } = useFlashMessage();

    const fines = isStudent ? allFines.filter(f => f.student_id === profile!.id) : allFines;

    const sortedFines = [...fines].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const filteredFines = sortedFines.filter(f => {
        const matchStatus = statusFilter === 'all' || f.status === statusFilter;
        const matchIssuer = issuerFilter === 'all' || (f.issuer as any)?.role === issuerFilter;
        const s = search.toLowerCase();
        const matchSearch = !search ||
            f.description.toLowerCase().includes(s) ||
            (f.student as any)?.full_name?.toLowerCase().includes(s) ||
            (f.student as any)?.student_id_number?.toLowerCase().includes(s) ||
            (f.student as any)?.college?.toLowerCase().includes(s) ||
            (f.student as any)?.course?.toLowerCase().includes(s) ||
            (f.student as any)?.year_section?.toLowerCase().includes(s);
        return matchStatus && matchIssuer && matchSearch;
    });

    const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedFines } = usePagination(filteredFines);

    const sortedStudents = [...students].sort((a, b) => getSurname(a.full_name).localeCompare(getSurname(b.full_name)));
    const filteredStudents = filterProfiles(sortedStudents, studentSearch);

    function openAddModal() {
        setEditingFine(null);
        setFormData({ student_id: '', amount: 0, description: '', status: 'unpaid' });
        setIsCustomDesc(false);
        clearMessages();
        setShowModal(true);
    }

    function openEditModal(fine: Fine) {
        setEditingFine(fine);
        setFormData({ student_id: fine.student_id, amount: fine.amount, description: fine.description, status: fine.status });
        setIsCustomDesc(!descriptionOptions.includes(fine.description));
        clearMessages();
        setShowModal(true);
    }

    async function handleSave() {
        if (!formData.student_id || !formData.description.trim() || formData.amount <= 0) {
            setError('Missing required fields');
            return;
        }
        if (isCustomDesc && formData.description.trim() && !descriptionOptions.includes(formData.description.trim())) {
            addDescriptionOption(formData.description.trim());
        }
        setSaving(true);
        clearMessages();
        try {
            const payload = {
                student_id: formData.student_id,
                amount: formData.amount,
                description: formData.description.trim(),
                status: formData.status,
            };
            const { error: queryError } = editingFine
                ? await supabase.from('fines').update(payload).eq('id', editingFine.id)
                : await supabase.from('fines').insert({ ...payload, issued_by: profile!.id });

            if (queryError) throw queryError;
            setShowModal(false);
            refreshFines();
            showSuccess(editingFine ? 'Fine updated successfully' : 'Fine added successfully');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this fine?')) return;
        const { error } = await supabase.from('fines').delete().eq('id', id);
        if (!error) {
            refreshFines();
            showSuccess('Fine deleted');
        }
    }

    async function handleApplyPayment(selectedIds: string[], status: 'paid' | 'unpaid') {
        const { error } = await supabase.from('fines').update({ status }).in('id', selectedIds);
        if (error) throw error;
        await refreshFines();
        setShowPayModal(false);
        showSuccess(`Updated ${selectedIds.length} fine(s) status`);
    }

    const renderTableSkeleton = (rows = 6) => (
        <table aria-hidden="true">
            <thead>
                <tr>
                    {!isStudent && <th>Student</th>}
                    <th>Description</th><th>Given by</th><th>Amount</th><th>Status</th><th>Date</th>
                    {!isStudent && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`}>
                        {!isStudent && <td><div className="flex-col gap-xs"><div className="skeleton" style={{ width: 140, height: 12 }} /><div className="skeleton" style={{ width: 90, height: 10 }} /></div></td>}
                        <td><div className="skeleton" style={{ width: '85%', height: 12 }} /></td>
                        <td><div className="skeleton" style={{ width: 90, height: 12 }} /></td>
                        <td><div className="skeleton" style={{ width: 70, height: 12 }} /></td>
                        <td><div className="skeleton" style={{ width: 80, height: 20, borderRadius: 999 }} /></td>
                        <td><div className="skeleton" style={{ width: 90, height: 12 }} /></td>
                        {!isStudent && <td><div className="flex gap-xs"><div className="skeleton" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)' }} /><div className="skeleton" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)' }} /></div></td>}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div>
            <PageHeader
                title={isStudent ? 'My Fines' : 'Manage Fines'}
                description={isStudent ? 'View your account fine status.' : 'Issue and track student fines.'}
                actions={!isStudent ? (
                    <>
                        <button className="btn btn-ghost" onClick={() => { setShowDescModal(true); clearMessages(); }}>
                            <FiPlus size={16} /> Add Description
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>
                            Pay Fines
                        </button>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <FiPlus size={16} /> Add Fine
                        </button>
                    </>
                ) : undefined}
            />

            <div className="flex-between gap-sm mb-md flex-wrap">
                <div className="search-bar">
                    <FiSearch size={16} />
                    <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
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

            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><FiCheckCircle size={16} /> {success}</div>}

            <div className="table-container">
                <div className="table-wrapper">
                    {loading && fines.length === 0 ? renderTableSkeleton() : filteredFines.length === 0 ? (
                        <div className="empty-state"><h4>No fines found</h4><p>Try adjusting your search or filters.</p></div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    {!isStudent && <th>Student</th>}
                                    <th>Description</th><th>Given by</th><th>Amount</th><th>Status</th><th>Date</th>
                                    {!isStudent && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedFines.map(f => {
                                    const issuerRole = (f.issuer as any)?.role;
                                    return (
                                        <tr key={f.id}>
                                            {!isStudent && (
                                                <td>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{(f.student as any)?.full_name || '-'}</p>
                                                        <p className="text-xs text-muted">{(f.student as any)?.student_id_number || ''}</p>
                                                        <p className="text-xs text-muted">{(f.student as any)?.college || '—'} • {(f.student as any)?.course || '—'}</p>
                                                    </div>
                                                </td>
                                            )}
                                            <td>{f.description}</td>
                                            <td>
                                                <p style={{ fontWeight: 500 }}>{(f.issuer as any)?.full_name || 'System'}</p>
                                                {issuerRole && <p className="text-xs text-muted mt-xs">{formatIssuerRole(issuerRole)}</p>}
                                            </td>
                                            <td style={{ fontWeight: 700, color: f.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                                {formatCurrency(f.amount)}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${f.status}`}>
                                                    {f.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                                </span>
                                            </td>
                                            <td className="text-sm text-muted">{format(new Date(f.created_at), 'MMM d, yyyy')}</td>
                                            {!isStudent && (
                                                <td>
                                                    {(profile?.role === 'admin' || f.issued_by === profile?.id) ? (
                                                        <div className="flex gap-xs">
                                                            <button className="btn btn-icon btn-ghost" onClick={() => openEditModal(f)}><FiEdit2 size={14} /></button>
                                                            <button className="btn btn-icon btn-danger" onClick={() => handleDelete(f.id)}><FiTrash2 size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted">View Only</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {showModal && (
                <Modal
                    title={editingFine ? 'Edit Fine' : 'Add Fine'}
                    onClose={() => setShowModal(false)}
                    footer={
                        <>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <FiSave size={15} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    }
                >
                    {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><FiAlertCircle size={16} /> {error}</div>}
                    <div className="form-group">
                        <label className="form-label">Student</label>
                        <input
                            type="text"
                            className="form-control mb-xs"
                            placeholder="Type to search students (Name, ID, College, Section)..."
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                        />
                        <select className="form-control" value={formData.student_id} onChange={e => setFormData(p => ({ ...p, student_id: e.target.value }))}>
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
                                <input className="form-control" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Type custom description..." autoFocus />
                                <button className="text-xs text-primary btn-link text-left" onClick={() => setIsCustomDesc(false)}>← Back to template list</button>
                            </div>
                        ) : (
                            <select
                                className="form-control"
                                value={descriptionOptions.includes(formData.description) ? formData.description : ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === 'MANUAL_ENTRY') { setIsCustomDesc(true); setFormData(p => ({ ...p, description: '' })); }
                                    else { setFormData(p => ({ ...p, description: val })); }
                                }}
                            >
                                <option value="" disabled>Select Event</option>
                                {descriptionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                <option value="MANUAL_ENTRY">✍️ Type Custom Description...</option>
                            </select>
                        )}
                        <p className="text-xs text-muted mt-xs">Select from templates or type a custom reason.</p>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Amount (₱)</label>
                            <input type="number" className="form-control" value={formData.amount || ''} onChange={e => setFormData(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-control" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}>
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                    </div>
                </Modal>
            )}

            {showPayModal && (
                <PayFinesModal
                    title="Pay Fines"
                    fines={sortedFines}
                    onClose={() => setShowPayModal(false)}
                    onApply={handleApplyPayment}
                    showSearch
                />
            )}

            {showDescModal && (
                <DescriptionTemplateModal
                    onClose={() => setShowDescModal(false)}
                    onAdd={addDescriptionOption}
                />
            )}
        </div>
    );
}
