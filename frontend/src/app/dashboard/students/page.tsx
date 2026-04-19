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

    // Build counts from global fines
    const finesCounts = (allFines || []).reduce((acc: Record<string, { total: number; unpaid: number }>, f) => {
        // Filter by org unless admin
        const issuerOrg = (f.issuer as any)?.organization_id;
        if (profile?.role !== 'admin' && issuerOrg !== profile?.organization_id) {
            return acc;
        }

        const sid = f.student_id;
        if (!acc[sid]) acc[sid] = { total: 0, unpaid: 0 };
        acc[sid].total++;
        if (f.status === 'unpaid') acc[sid].unpaid++;
        return acc;
    }, {});

    const filtered = students.filter(s =>
        search === '' ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id_number?.toLowerCase().includes(search.toLowerCase())
    );

    const openAddFineModal = (student: Profile) => {
        const lastDesc = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_DESCRIPTION_STORAGE_KEY) || '' : '';
        setSelectedStudent(student);
        setFineDescription(lastDesc);
        setFineAmount(0);
        setError(null);
        setShowAddFineModal(true);
    };

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

    const studentFines = (allFines || []).filter(f => {
        const matchesStudent = f.student_id === selectedStudent?.id;
        const matchesOrg = profile?.role === 'admin' || (f.issuer as any)?.organization_id === profile?.organization_id;
        return matchesStudent && matchesOrg;
    });

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
                        placeholder="Search by name or ID number…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

            <div className="table-container">
                <div className="table-wrapper">
                    {loading && students.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <FiUsers />
                            <h4>No students found</h4>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>ID Number</th>
                                    <th>Total Fines</th>
                                    <th>Status</th>
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
                                                        {s.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{s.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted">{s.student_id_number || '—'}</td>
                                            <td>{counts.total}</td>
                                            <td>
                                                {counts.unpaid > 0 ? (
                                                    <span className="badge badge-unpaid"><FiAlertCircle size={11} /> {counts.unpaid} unpaid</span>
                                                ) : <span className="badge badge-paid">✓ Clear</span>}
                                            </td>
                                            <td>
                                                <div className="flex gap-xs">
                                                    <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedStudent(s); setShowViewFinesModal(true); }}>
                                                        <FiEye size={14} /> View
                                                    </button>
                                                    <button className="btn btn-sm btn-primary" onClick={() => openAddFineModal(s)}>
                                                        <FiPlus size={14} /> Add Fine
                                                    </button>
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

            {/* Modals */}
            {showAddFineModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowAddFineModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Fine: {selectedStudent.full_name}</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowAddFineModal(false)}><FiX size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-error">{error}</div>}
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <select className="form-control" value={fineDescription} onChange={e => {
                                    setFineDescription(e.target.value);
                                    if (e.target.value) window.localStorage.setItem(LAST_DESCRIPTION_STORAGE_KEY, e.target.value);
                                }}>
                                    <option value="">Select description…</option>
                                    {descriptionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (₱)</label>
                                <input type="number" className="form-control" value={fineAmount || ''} onChange={e => setFineAmount(parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddFineModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveFine} disabled={savingFine}>{savingFine ? 'Saving…' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showViewFinesModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowViewFinesModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Fines for {selectedStudent.full_name}</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowViewFinesModal(false)}><FiX size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {studentFines.length === 0 ? <p>No fines found.</p> : (
                                <div className="table-wrapper">
                                    <table>
                                        <thead><tr><th>Description</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                        <tbody>
                                            {studentFines.map(f => (
                                                <tr key={f.id}>
                                                    <td>{f.description}</td>
                                                    <td>₱{Number(f.amount).toFixed(2)}</td>
                                                    <td><span className={`badge badge-${f.status}`}>{f.status}</span></td>
                                                    <td>{format(new Date(f.created_at), 'MMM d, yyyy')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowViewFinesModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
