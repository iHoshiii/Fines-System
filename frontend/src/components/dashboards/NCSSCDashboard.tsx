'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Fine } from '@/types';
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiUsers, FiEye, FiX } from 'react-icons/fi';
import { format } from 'date-fns';

export default function NCSSCDashboard() {
    const { profile } = useAuth();
    const [fines, setFines] = useState<Fine[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!profile) return;
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch fines along with issuer organization info for filtering
            const { data } = await supabase
                .from('fines')
                .select('*, student:profiles!student_id(full_name, student_id_number), issuer:profiles!issued_by(full_name, organization_id)')
                .order('created_at', { ascending: false });

            // Filter fines so users only see fines issued within their own organization
            // Administrators can see all fines.
            const orgFines = profile?.role === 'admin'
                ? (data || [])
                : (data || []).filter(f => (f.issuer as any)?.organization_id === profile?.organization_id);

            setFines(orgFines);

            const { count } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'student');
            setTotalStudents(count || 0);
        } finally {
            setLoading(false);
        }
    };

    // Group fines by student for the summary table
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

        if (fine.status === 'unpaid') {
            acc[studentId].status = 'unpaid';
        }

        return acc;
    }, {} as Record<string, any>);

    const displayFines = Object.values(groupedFines);

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
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>{greetingTime()}, {profile?.full_name?.split(' ')[0] || 'NCSSC'} 👋</h2>
                    <p>Welcome to the NCSSC Dashboard. Oversee campus-wide student fines.</p>
                </div>
            </div>

            {/* Stats Cards */}
            {loading ? (
                <div className="stats-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card">
                            <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)' }} />
                            <div className="flex-col gap-xs" style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: 80, height: 12 }} />
                                <div className="skeleton" style={{ width: 60, height: 24 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon green"><span style={{ fontSize: 22, fontWeight: 'bold' }}></span></div>
                        <div className="stat-info">
                            <p>Total Fines</p>
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
                </div>
            )}

            {/* Student Fines Summary Table */}
            <div className="table-container" style={{ marginTop: 24 }}>
                <div className="table-header">
                    <span className="table-title">Student Fines Summary</span>
                    <span className="text-sm text-muted">Total sum per student</span>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 32, textAlign: 'center' }}>
                            <div className="animate-pulse" style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                                Loading fines…
                            </div>
                        </div>
                    ) : displayFines.length === 0 ? (
                        <div className="empty-state">
                            <span style={{ fontSize: 40, fontWeight: 'bold' }}></span>
                            <h4>No fines found</h4>
                            <p>No fines have been recorded yet.</p>
                        </div>
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
                                {displayFines.map((summary) => (
                                    <tr key={summary.id}>
                                        <td>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{(summary.student as any)?.full_name || '—'}</p>
                                                <p className="text-sm text-muted">{(summary.student as any)?.student_id_number || ''}</p>
                                            </div>
                                        </td>
                                        <td>{summary.description}</td>
                                        <td>{summary.count}</td>
                                        <td style={{ fontWeight: 700, color: summary.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{Number(summary.totalAmount).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${summary.status}`}>
                                                {summary.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                            </span>
                                        </td>
                                        <td className="text-sm text-muted">
                                            {format(new Date(summary.lastDate), 'MMM d, yyyy')}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => { setSelectedStudent(summary); setShowModal(true); }}
                                            >
                                                <FiEye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* View Fines Modal */}
                {showModal && selectedStudent && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                            <div className="modal-header">
                                <div>
                                    <h3>{selectedStudent.student?.full_name}'s Fines</h3>
                                    <p className="text-sm text-muted">{selectedStudent.student?.student_id_number}</p>
                                </div>
                                <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>
                                    <FiX size={18} />
                                </button>
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
                                                    <span className={`badge badge-${fine.status}`} style={{ fontSize: 10 }}>
                                                        {fine.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div className="modal-footer flex-between">
                                <div>
                                    <p className="text-xs text-muted">Total Balance</p>
                                    <h4 style={{ color: selectedStudent.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                        ₱{Number(selectedStudent.totalAmount).toFixed(2)}
                                    </h4>
                                </div>
                                <button className="btn btn-primary" onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
