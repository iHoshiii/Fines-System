'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { FiSearch, FiUsers, FiAlertCircle, FiPlus, FiX, FiSave, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';

const DESCRIPTION_STORAGE_KEY = 'fine_description_templates';
const LAST_DESCRIPTION_STORAGE_KEY = 'fine_last_selected_description';

interface StudentFine {
    id: string;
    description: string;
    amount: number;
    status: 'paid' | 'unpaid';
    created_at: string;
}

export default function StudentsPage() {
    const { profile } = useAuth();
    const [students, setStudents] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [finesCounts, setFinesCounts] = useState<Record<string, { total: number; unpaid: number }>>({});
    const [showAddFineModal, setShowAddFineModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
    const [fineDescription, setFineDescription] = useState('');
    const [fineAmount, setFineAmount] = useState(0);
    const [savingFine, setSavingFine] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showViewFinesModal, setShowViewFinesModal] = useState(false);
    const [viewingFinesLoading, setViewingFinesLoading] = useState(false);
    const [selectedStudentFines, setSelectedStudentFines] = useState<StudentFine[]>([]);
    const [descriptionOptions, setDescriptionOptions] = useState<string[]>([]);

    useEffect(() => {
        fetchStudents();
        loadDescriptionOptions();
    }, []);

    const loadDescriptionOptions = async () => {
        // Load from localStorage
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem(DESCRIPTION_STORAGE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setDescriptionOptions(parsed);
                    }
                } catch (e) { }
            }
        }

        // Fetch from database to ensure list is populated
        const { data } = await supabase
            .from('fines')
            .select('description')
            .order('created_at', { ascending: false })
            .limit(100);

        if (data) {
            const fromDb = data.map(f => f.description).filter(Boolean);
            setDescriptionOptions(prev => Array.from(new Set([...prev, ...fromDb])));
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        const { data: studentsData } = await supabase
            .from('profiles')
            .select('*, organization:organizations(name)')
            .eq('role', 'student')
            .order('full_name');

        const list = studentsData || [];
        setStudents(list);

        // Fetch fine counts per student, filtered by the current user's organization
        if (list.length > 0) {
            const ids = list.map(s => s.id);
            let query = supabase
                .from('fines')
                .select('student_id, status, issuer:profiles!issued_by(organization_id)')
                .in('student_id', ids);

            const { data: finesData } = await query;

            // Filter fines by organization (unless admin)
            const filteredFines = profile?.role === 'admin'
                ? (finesData || [])
                : (finesData || []).filter(f => (f.issuer as any)?.organization_id === profile?.organization_id);

            const counts: Record<string, { total: number; unpaid: number }> = {};
            filteredFines.forEach(f => {
                if (!counts[f.student_id]) counts[f.student_id] = { total: 0, unpaid: 0 };
                counts[f.student_id].total++;
                if (f.status === 'unpaid') counts[f.student_id].unpaid++;
            });
            setFinesCounts(counts);
        }
        setLoading(false);
    };

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
        if (!profile?.id) {
            setError('Unable to identify issuer. Please log in again.');
            return;
        }
        if (!selectedStudent) {
            setError('Please select a student.');
            return;
        }
        if (!fineDescription.trim()) {
            setError('Please enter a specific fine description.');
            return;
        }
        if (fineAmount <= 0) {
            setError('Please enter a valid fine amount.');
            return;
        }

        setSavingFine(true);
        setError(null);
        try {
            const { error: insertError } = await supabase
                .from('fines')
                .insert({
                    student_id: selectedStudent.id,
                    amount: fineAmount,
                    description: fineDescription.trim(),
                    status: 'unpaid',
                    issued_by: profile.id,
                });

            if (insertError) throw insertError;

            setSuccess(`Fine added for ${selectedStudent.full_name}.`);
            setShowAddFineModal(false);
            setSelectedStudent(null);
            await fetchStudents();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save fine.';
            setError(message);
        } finally {
            setSavingFine(false);
        }
    };

    const openViewFinesModal = async (student: Profile) => {
        setSelectedStudent(student);
        setSelectedStudentFines([]);
        setViewingFinesLoading(true);
        setError(null);
        setShowViewFinesModal(true);

        try {
            const { data, error: finesError } = await supabase
                .from('fines')
                .select('id, description, amount, status, created_at, issuer:profiles!issued_by(organization_id, full_name)')
                .eq('student_id', student.id)
                .order('created_at', { ascending: false });

            if (finesError) throw finesError;

            // Filter fines by organization (unless admin)
            const filteredFines = profile?.role === 'admin'
                ? (data || [])
                : (data || []).filter(f => (f.issuer as any)?.organization_id === profile?.organization_id);

            setSelectedStudentFines(filteredFines as any[]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load fines.';
            setError(message);
        } finally {
            setViewingFinesLoading(false);
        }
    };

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
                        id="student-search"
                        type="text"
                        placeholder="Search by name or ID number…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {success && (
                <div className="alert alert-success" style={{ marginBottom: 16 }}>
                    {success}
                </div>
            )}

            <div className="table-container">
                <div className="table-header">
                    <span className="table-title">Student List</span>
                    <span className="text-sm text-muted">{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <FiUsers />
                            <h4>No students found</h4>
                            <p>Try adjusting your search.</p>
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 34, height: 34, borderRadius: '50%',
                                                        background: 'var(--color-primary-100)',
                                                        color: 'var(--color-primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: 13, flexShrink: 0
                                                    }}>
                                                        {s.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{s.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted">{s.student_id_number || '—'}</td>
                                            <td>{counts.total}</td>
                                            <td>
                                                {counts.unpaid > 0 ? (
                                                    <span className="badge badge-unpaid">
                                                        <FiAlertCircle size={11} /> {counts.unpaid} unpaid
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-paid">✓ Clear</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-xs">
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => openViewFinesModal(s)}
                                                    >
                                                        <FiEye size={14} /> View
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => openAddFineModal(s)}
                                                    >
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

            {showAddFineModal && selectedStudent && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddFineModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add Fine for Student</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowAddFineModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

                            <div className="form-group">
                                <label className="form-label">Student Name</label>
                                <input
                                    className="form-control"
                                    value={selectedStudent.full_name}
                                    disabled
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">ID Number</label>
                                <input
                                    className="form-control"
                                    value={selectedStudent.student_id_number || 'No ID Number'}
                                    disabled
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fine Description *</label>
                                <select
                                    id="student-fine-description"
                                    className="form-control"
                                    value={fineDescription}
                                    onChange={e => {
                                        setFineDescription(e.target.value);
                                        if (e.target.value && typeof window !== 'undefined') {
                                            window.localStorage.setItem(LAST_DESCRIPTION_STORAGE_KEY, e.target.value);
                                        }
                                    }}
                                >
                                    <option value="">Select description…</option>
                                    {descriptionOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                                    Don't see the description? Add it in the <a href="/dashboard/fines" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Fines List</a>.
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Fine Amount (₱) *</label>
                                <input
                                    id="student-fine-amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    className="form-control"
                                    placeholder="0.00"
                                    value={fineAmount || ''}
                                    onChange={e => setFineAmount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddFineModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveFine} disabled={savingFine}>
                                <FiSave size={15} />
                                {savingFine ? 'Saving…' : 'Add Fine'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showViewFinesModal && selectedStudent && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowViewFinesModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Fine Status: {selectedStudent.full_name}</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowViewFinesModal(false)}>
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
                                ID Number: {selectedStudent.student_id_number || '—'}
                            </p>

                            {viewingFinesLoading ? (
                                <div style={{ textAlign: 'center', padding: 20 }}>Loading fines…</div>
                            ) : selectedStudentFines.length === 0 ? (
                                <div className="empty-state">
                                    <FiAlertCircle />
                                    <h4>No fines found</h4>
                                    <p>This student does not have any fines yet.</p>
                                </div>
                            ) : (
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStudentFines.map(fine => (
                                                <tr key={fine.id}>
                                                    <td>{fine.description}</td>
                                                    <td>₱{Number(fine.amount).toFixed(2)}</td>
                                                    <td>
                                                        <span className={`badge badge-${fine.status}`}>
                                                            {fine.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                                        </span>
                                                    </td>
                                                    <td className="text-sm text-muted">{format(new Date(fine.created_at), 'MMM d, yyyy')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowViewFinesModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
