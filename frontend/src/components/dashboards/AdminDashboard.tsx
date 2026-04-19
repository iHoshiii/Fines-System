'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { supabase } from '@/lib/supabaseClient';
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiUsers, FiEye, FiX, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';

export default function AdminDashboard() {
    const { profile } = useAuth();
    const { fines, totalStudents, loading, refreshFines, descriptionOptions } = useData();
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [fineDescription, setFineDescription] = useState('');
    const [fineAmount, setFineAmount] = useState(0);
    const [saving, setSaving] = useState(false);

    const LAST_DESCRIPTION_STORAGE_KEY = 'fine_last_selected_description';

    const handleSaveFine = async () => {
        if (!selectedStudent || !fineDescription.trim() || fineAmount <= 0) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('fines').insert({
                student_id: selectedStudent.id,
                amount: fineAmount,
                description: fineDescription.trim(),
                status: 'unpaid',
                issued_by: profile!.id
            });
            if (error) throw error;
            setShowAddModal(false);
            refreshFines();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const groupedFines = fines.reduce((acc, fine) => {
        const studentId = fine.student_id;
        if (!acc[studentId]) {
            acc[studentId] = {
                id: studentId,
                student: fine.student,
                totalAmount: 0,
                count: 0,
                status: 'paid' as 'paid' | 'unpaid',
                lastDate: fine.created_at,
                description: fine.description
            };
        }
        acc[studentId].totalAmount += Number(fine.amount);
        acc[studentId].count += 1;
        if (fine.status === 'unpaid') acc[studentId].status = 'unpaid';
        return acc;
    }, {} as Record<string, any>);

    const displayFines.length === 0 ? [] : Object.values(groupedFines);

    const unpaidFines = fines.filter(f => f.status === 'unpaid');
    const paidFines = fines.filter(f => f.status === 'paid');

    const greetingTime = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>{greetingTime()}, {profile?.full_name?.split(' ')[0] || 'Admin'} 👋</h2>
                    <p>Welcome to the System Admin Dashboard. Overview of all system-wide fines.</p>
                </div>
            </div>

            <div className="stats-grid">
                {loading && fines.length === 0 ? (
                    [1, 2, 3, 4].map(i => <div key={i} className="stat-card skeleton" style={{ height: 100 }} />)
                ) : (
                    <>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiDollarSign size={22} /></div>
                            <div className="stat-info">
                                <p>Total System Fines</p>
                                <h3>{fines.length}</h3>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon red"><FiAlertCircle size={22} /></div>
                            <div className="stat-info">
                                <p>Unpaid Fines</p>
                                <h3>{unpaidFines.length}</h3>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green"><FiCheckCircle size={22} /></div>
                            <div className="stat-info">
                                <p>Paid Fines</p>
                                <h3>{paidFines.length}</h3>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiUsers size={22} /></div>
                            <div className="stat-info">
                                <p>Total Students</p>
                                <h3>{totalStudents}</h3>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="table-container" style={{ marginTop: 24 }}>
                <div className="table-header">
                    <span className="table-title">Student Fines Summary</span>
                    <span className="text-sm text-muted">Total sum per student (System-wide)</span>
                </div>
                <div className="table-wrapper">
                    {loading && displayFines.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
                    ) : displayFines.length === 0 ? (
                        <div className="empty-state"><h4>No fines found</h4></div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Latest Fine</th>
                                    <th>Count</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Latest Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(groupedFines).map((summary: any) => (
                                    <tr key={summary.id}>
                                        <td>
                                            <div className="flex align-center gap-sm">
                                                <div className="avatar-sm initials">
                                                    {(summary.student as any)?.full_name?.split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{(summary.student as any)?.full_name || '—'}</p>
                                                    <p className="text-sm text-muted">{(summary.student as any)?.student_id_number || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{summary.description}</td>
                                        <td>{summary.count}</td>
                                        <td style={{ fontWeight: 700, color: summary.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{Number(summary.totalAmount).toFixed(2)}
                                        </td>
                                        <td><span className={`badge badge-${summary.status}`}>{summary.status}</span></td>
                                        <td className="text-sm text-muted">{format(new Date(summary.lastDate), 'MMM d, yyyy')}</td>
                                        <td>
                                            <div className="flex gap-xs">
                                                <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedStudent(summary); setShowModal(true); }}>
                                                    <FiEye size={14} /> View
                                                </button>
                                                <button className="btn btn-sm btn-primary" onClick={() => {
                                                    setSelectedStudent(summary);
                                                    const last = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_DESCRIPTION_STORAGE_KEY) || '' : '';
                                                    setFineDescription(last); setFineAmount(0); setShowAddModal(true);
                                                }}>
                                                    <FiPlus size={14} /> Fine
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

            {/* View Modal */}
            {showModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div><h3>{selectedStudent.student?.full_name}'s Fines</h3><p className="text-sm text-muted">{selectedStudent.student?.student_id_number}</p></div>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><FiX size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <div className="flex-col gap-sm">
                                {fines
                                    .filter(f => f.student_id === selectedStudent.id)
                                    .map(fine => (
                                        <div key={fine.id} className="flex-between p-sm card" style={{ background: 'var(--color-bg-alt)' }}>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{fine.description}</p>
                                                <p className="text-xs text-muted">
                                                    {format(new Date(fine.created_at), 'MMM d, yyyy')} • Issued by {(fine.issuer as any)?.full_name || '—'}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 700, color: fine.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                                    ₱{Number(fine.amount).toFixed(2)}
                                                </p>
                                                <span className={`badge badge-${fine.status}`} style={{ fontSize: 10 }}>{fine.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-primary" onClick={() => setShowModal(false)}>Close</button></div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Add Fine: {selectedStudent.student?.full_name}</h3><button className="btn btn-icon btn-ghost" onClick={() => setShowAddModal(false)}><FiX size={18} /></button></div>
                        <div className="modal-body">
                            <div className="form-group"><label className="form-label">Description</label>
                                <select className="form-control" value={fineDescription} onChange={e => {
                                    setFineDescription(e.target.value);
                                    if (e.target.value) window.localStorage.setItem(LAST_DESCRIPTION_STORAGE_KEY, e.target.value);
                                }}>
                                    <option value="">Select description...</option>{descriptionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Amount (₱)</label>
                                <input type="number" className="form-control" value={fineAmount || ''} onChange={e => setFineAmount(parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSaveFine} disabled={saving}>{saving ? 'Saving...' : 'Add Fine'}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
