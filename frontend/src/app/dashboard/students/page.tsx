'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { FiPlus, FiX, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import { usePagination } from '@/hooks/usePagination';
import { useFlashMessage } from '@/hooks/useFlashMessage';
import { formatCurrency, getSurname, getInitials } from '@/utils/formatters';
import { filterProfiles } from '@/utils/profileSearch';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import DescriptionTemplateModal from '@/components/ui/modals/DescriptionTemplateModal';
import PayFinesModal from '@/components/ui/modals/PayFinesModal';

export default function StudentsPage() {
    const { profile } = useAuth();
    const { students, fines: allFines, loading, refreshFines, descriptionOptions, addDescriptionOption } = useData();

    const [search, setSearch] = useState('');
    const [showAddFineModal, setShowAddFineModal] = useState(false);
    const [showDescModal, setShowDescModal] = useState(false);
    const [showViewFinesModal, setShowViewFinesModal] = useState(false);
    const [showPayFinesModal, setShowPayFinesModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
    const [fineDescription, setFineDescription] = useState('');
    const [fineAmount, setFineAmount] = useState(0);
    const [isCustomDesc, setIsCustomDesc] = useState(false);
    const [savingFine, setSavingFine] = useState(false);

    const { success, error, setError, showSuccess, clearMessages } = useFlashMessage();

    const finesCounts = allFines.reduce((acc: Record<string, { total: number; unpaid: number }>, f: any) => {
        const sid = f.student_id;
        if (!acc[sid]) acc[sid] = { total: 0, unpaid: 0 };
        acc[sid].total++;
        if (f.status === 'unpaid') acc[sid].unpaid++;
        return acc;
    }, {});

    const sortedFiltered = filterProfiles(students, search)
        .sort((a, b) => getSurname(a.full_name).localeCompare(getSurname(b.full_name)));

    const { currentPage, setCurrentPage, totalPages, paginatedItems: paginatedStudents, resetPage } = usePagination(sortedFiltered);

    const studentFines = allFines.filter(f => f.student_id === selectedStudent?.id);

    async function handleSaveFine() {
        if (!profile?.id || !selectedStudent || !fineDescription.trim() || fineAmount <= 0) return;
        setSavingFine(true);
        clearMessages();
        try {
            const { error: insertError } = await supabase.from('fines').insert({
                student_id: selectedStudent.id,
                amount: fineAmount,
                description: fineDescription.trim(),
                status: 'unpaid',
                issued_by: profile.id,
            });
            if (insertError) throw insertError;
            if (isCustomDesc && fineDescription.trim() && !descriptionOptions.includes(fineDescription.trim())) {
                addDescriptionOption(fineDescription.trim());
            }
            showSuccess(`Fine added for ${selectedStudent.full_name}.`);
            setShowAddFineModal(false);
            refreshFines();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSavingFine(false);
        }
    }

    async function handleApplyPayment(selectedIds: string[], status: 'paid' | 'unpaid') {
        const { error: updateError } = await supabase.from('fines').update({ status }).in('id', selectedIds);
        if (updateError) throw updateError;
        await refreshFines();
        setShowPayFinesModal(false);
        showSuccess(`Updated ${selectedIds.length} fine(s) to ${status}.`);
    }

    function openAddFineModal(student: Profile) {
        setSelectedStudent(student);
        setFineDescription('');
        setFineAmount(0);
        setIsCustomDesc(false);
        clearMessages();
        setShowAddFineModal(true);
    }

    return (
        <div>
            <PageHeader
                title="Students"
                description="View all enrolled students and their fine status."
                actions={
                    <button className="btn btn-ghost" onClick={() => setShowDescModal(true)}>
                        <FiPlus size={16} /> Add Description
                    </button>
                }
            />

            <div style={{ marginBottom: 16 }}>
                <SearchBar
                    value={search}
                    onChange={val => { setSearch(val); resetPage(); }}
                    placeholder="Search by name, ID, college, course, year..."
                />
            </div>

            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            <div className="table-container">
                <div className="table-wrapper">
                    {loading && students.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
                    ) : sortedFiltered.length === 0 ? (
                        <div className="empty-state"><h4>No students found</h4></div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th><th>College</th><th>Course</th><th>Fines Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStudents.map(s => {
                                    const counts = finesCounts[s.id] || { total: 0, unpaid: 0 };
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                <div className="flex align-center gap-sm">
                                                    <div className="avatar-sm initials">{getInitials(s.full_name)}</div>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{s.full_name}</p>
                                                        <p className="text-sm text-muted">{s.student_id_number || 'No ID'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{s.college || '—'}</td>
                                            <td>
                                                <p className="text-sm" style={{ fontWeight: 600 }}>{s.course || '—'}</p>
                                                <p className="text-xs text-muted">{s.year_section || '—'}</p>
                                            </td>
                                            <td>
                                                {counts.total === 0 ? (
                                                    <span className="text-sm text-muted">No fines</span>
                                                ) : (
                                                    <span className={`badge ${counts.unpaid > 0 ? 'badge-unpaid' : 'badge-paid'}`} style={{ width: 'fit-content' }}>
                                                        {counts.unpaid} Unpaid / {counts.total} Total
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-xs">
                                                    <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedStudent(s); setShowViewFinesModal(true); }}>
                                                        <FiEye size={14} /> View
                                                    </button>
                                                    {profile?.role !== 'student' && (
                                                        <>
                                                            <button className="btn btn-sm btn-primary" onClick={() => openAddFineModal(s)}>
                                                                <FiPlus size={14} /> Fine
                                                            </button>
                                                            <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedStudent(s); setShowPayFinesModal(true); }}>
                                                                Pay Fines
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {showViewFinesModal && selectedStudent && (
                <Modal
                    title={`${selectedStudent.full_name}'s Fines`}
                    subtitle={selectedStudent.student_id_number ?? undefined}
                    onClose={() => setShowViewFinesModal(false)}
                    maxWidth={600}
                    footer={<button className="btn btn-primary" onClick={() => setShowViewFinesModal(false)}>Close</button>}
                >
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {studentFines.length === 0 ? (
                            <p className="text-center p-md text-muted">No fines issued.</p>
                        ) : (
                            <div className="flex-col gap-sm">
                                {studentFines.map(f => (
                                    <div key={f.id} className="flex-between p-sm card" style={{ background: 'var(--color-bg-alt)' }}>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{f.description}</p>
                                            <p className="text-xs text-muted">{format(new Date(f.created_at), 'MMM d, yyyy')}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 700, color: f.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                                {formatCurrency(f.amount)}
                                            </p>
                                            <span className={`badge badge-${f.status}`} style={{ fontSize: 10 }}>{f.status.toUpperCase()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {showPayFinesModal && selectedStudent && (
                <PayFinesModal
                    title={`Pay Fines: ${selectedStudent.full_name}`}
                    fines={studentFines}
                    onClose={() => setShowPayFinesModal(false)}
                    onApply={handleApplyPayment}
                />
            )}

            {showAddFineModal && selectedStudent && (
                <Modal
                    title={`Issue Fine: ${selectedStudent.full_name}`}
                    onClose={() => setShowAddFineModal(false)}
                    footer={
                        <>
                            <button className="btn btn-ghost" onClick={() => setShowAddFineModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveFine} disabled={savingFine}>
                                {savingFine ? 'Saving...' : 'Add Fine'}
                            </button>
                        </>
                    }
                >
                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        {isCustomDesc ? (
                            <div className="flex-col gap-xs">
                                <input className="form-control" value={fineDescription} onChange={e => setFineDescription(e.target.value)} placeholder="Type custom description..." autoFocus />
                                <button className="text-xs text-primary btn-link text-left" onClick={() => setIsCustomDesc(false)}>← Back to templates</button>
                            </div>
                        ) : (
                            <select
                                className="form-control"
                                value={descriptionOptions.includes(fineDescription) ? fineDescription : ''}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === 'MANUAL_ENTRY') { setIsCustomDesc(true); setFineDescription(''); }
                                    else { setFineDescription(val); }
                                }}
                            >
                                <option value="" disabled>Select Event</option>
                                {descriptionOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                <option value="MANUAL_ENTRY">✍️ Type Custom...</option>
                            </select>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Amount (₱)</label>
                        <input type="number" className="form-control" value={fineAmount || ''} onChange={e => setFineAmount(parseFloat(e.target.value) || 0)} />
                    </div>
                </Modal>
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
