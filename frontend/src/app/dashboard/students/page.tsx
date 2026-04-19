'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { FiSearch, FiUsers, FiAlertCircle, FiPlus, FiX, FiSave, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';

export default function StudentsPage() {
    const { profile } = useAuth();
    const { students, fines: allFines, loading, refreshFines, descriptionOptions } = useData();

    const [search, setSearch] = useState('');
    const [showAddFineModal, setShowAddFineModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
    const [fineDescription, setFineDescription] = useState('');
    const [fineAmount, setFineAmount] = useState(0);
    const [savingFine, setSavingFine] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showViewFinesModal, setShowViewFinesModal] = useState(false);

    const LAST_DESCRIPTION_STORAGE_KEY = 'fine_last_selected_description';

    const finesCounts = (allFines || []).reduce((acc: Record<string, { total: number; unpaid: number }>, f: any) => {
        const sid = f.student_id;
        if (!acc[sid]) acc[sid] = { total: 0, unpaid: 0 };
        acc[sid].total++;
        if (f.status === 'unpaid') acc[sid].unpaid++;
        return acc;
    }, {});

    const filtered = (students || []).filter(s =>
        search === '' ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id_number?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSaveFine = async () => {
        if (!profile?.id || !selectedStudent || !fineDescription.trim() || fineAmount <= 0) return;
        setSavingFine(true);
        setError(null);
        try {
            const { error: insertError } = await supabase.from('fines').insert({
                student_id: selectedStudent.id,
                amount: fineAmount,
                description: fineDescription.trim(),
                status: 'unpaid',
                issued_by: profile.id,
            });
            if (insertError) throw insertError;
            setSuccess(`Fine added for ${selectedStudent.full_name}.`);
            setShowAddFineModal(false);
            refreshFines();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSavingFine(false);
        }
    };

    const studentFines = (allFines || []).filter(f => f.student_id === selectedStudent?.id);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Students</h2>
                    <p>View all enrolled students and their fine status.</p>
                </div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div className="search-bar">
                    <FiSearch size={16} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            <div className="table-container">
                <div className="table-wrapper">
                    {loading && students.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state"><h4>No students found</h4></div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Course/Year</th>
                                    <th>Fines Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => {
                                    const counts = finesCounts[s.id] || { total: 0, unpaid: 0 };
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                <div className="flex align-center gap-sm">
                                                    <div className="avatar-sm initials">
                                                        {s.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{s.full_name}</p>
                                                        <p className="text-sm text-muted">{s.student_id_number || 'No ID'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><p className="text-sm">{s.course || 'N/A'}</p><p className="text-xs text-muted">Year {s.year_level || '-'}</p></td>
                                            <td>
                                                {counts.total === 0 ? (
                                                    <span className="text-sm text-muted">No fines</span>
                                                ) : (
                                                    <div className="flex-col gap-xs">
                                                        <span className={`badge ${counts.unpaid > 0 ? 'badge-unpaid' : 'badge-paid'}`} style={{ width: 'fit-content' }}>
                                                            {counts.unpaid} Unpaid / {counts.total} Total
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-xs">
                                                    <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedStudent(s); setShowViewFinesModal(true); }}>
                                                        <FiEye size={14} /> View
                                                    </button>
                                                    {profile?.role !== 'student' && (
                                                        <button className="btn btn-sm btn-primary" onClick={() => {
                                                            setSelectedStudent(s);
                                                            const last = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_DESCRIPTION_STORAGE_KEY) || '' : '';
                                                            setFineDescription(last);
                                                            setFineAmount(0);
                                                            setShowAddFineModal(true);
                                                        }}>
                                                            <FiPlus size={14} /> Fine
                                                        </button>
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

            {/* View Fines Modal */}
            {showViewFinesModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowViewFinesModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div><h3>{selectedStudent.full_name}'s Fines</h3><p className="text-sm text-muted">{selectedStudent.student_id_number}</p></div>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowViewFinesModal(false)}><FiX size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {studentFines.length === 0 ? (
                                <p className="text-center p-md text-muted">No fines issued by your organization (or system-wide).</p>
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
                                                    ₱{Number(f.amount).toFixed(2)}
                                                </p>
                                                <span className={`badge badge-${f.status}`} style={{ fontSize: 10 }}>{f.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer"><button className="btn btn-primary" onClick={() => setShowViewFinesModal(false)}>Close</button></div>
                    </div>
                </div>
            )}

            {/* Add Fine Modal */}
            {showAddFineModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowAddFineModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Issue Fine: {selectedStudent.full_name}</h3><button className="btn btn-icon btn-ghost" onClick={() => setShowAddFineModal(false)}><FiX size={18} /></button></div>
                        <div className="modal-body">
                            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                            <div className="form-group"><label className="form-label">Description</label>
                                <select className="form-control" value={fineDescription} onChange={e => {
                                    setFineDescription(e.target.value);
                                    if (e.target.value) window.localStorage.setItem(LAST_DESCRIPTION_STORAGE_KEY, e.target.value);
                                }}>
                                    <option value="">Select description...</option>
                                    {descriptionOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Amount (₱)</label>
                                <input type="number" className="form-control" value={fineAmount || ''} onChange={e => setFineAmount(parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowAddFineModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSaveFine} disabled={savingFine}>{savingFine ? 'Saving...' : 'Add Fine'}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
