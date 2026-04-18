'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { FiSearch, FiUsers, FiAlertCircle, FiPlus, FiX, FiSave } from 'react-icons/fi';

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

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*, organization:organizations(name)')
            .eq('role', 'student')
            .order('full_name');
        const list = data || [];
        setStudents(list);

        // Fetch fine counts per student
        if (list.length > 0) {
            const ids = list.map(s => s.id);
            const { data: finesData } = await supabase
                .from('fines')
                .select('student_id, status')
                .in('student_id', ids);

            const counts: Record<string, { total: number; unpaid: number }> = {};
            (finesData || []).forEach(f => {
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
        setSelectedStudent(student);
        setFineDescription('');
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
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => openAddFineModal(s)}
                                                >
                                                    <FiPlus size={14} /> Add Fine
                                                </button>
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
                                <input
                                    id="student-fine-description"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter specific fine description"
                                    value={fineDescription}
                                    onChange={e => setFineDescription(e.target.value)}
                                />
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
        </div>
    );
}
