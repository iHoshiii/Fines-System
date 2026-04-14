'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Fine } from '@/types';
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';

export default function AdminDashboard() {
    const { profile } = useAuth();
    const [fines, setFines] = useState<Fine[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('fines')
                .select('*, student:profiles!student_id(full_name, student_id_number), issuer:profiles!issued_by(full_name)')
                .order('created_at', { ascending: false })
                .limit(10);
            setFines(data || []);

            const { count } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'student');
            setTotalStudents(count || 0);
        } finally {
            setLoading(false);
        }
    };

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
                    <h2>{greetingTime()}, {profile?.full_name?.split(' ')[0] || 'Admin'} 👋</h2>
                    <p>Welcome to the System Admin Dashboard. Here is an overview of the system.</p>
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
                        <div className="stat-icon green"><FiDollarSign size={22} /></div>
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

            {/* Recent Fines Table */}
            <div className="table-container" style={{ marginTop: 24 }}>
                <div className="table-header">
                    <span className="table-title">Recent System Fines</span>
                    <span className="text-sm text-muted">Showing latest 10</span>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 32, textAlign: 'center' }}>
                            <div className="animate-pulse" style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                                Loading fines…
                            </div>
                        </div>
                    ) : fines.length === 0 ? (
                        <div className="empty-state">
                            <FiDollarSign />
                            <h4>No fines found</h4>
                            <p>No fines have been recorded yet.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Issued By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fines.map((fine) => (
                                    <tr key={fine.id}>
                                        <td>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{(fine.student as any)?.full_name || '—'}</p>
                                                <p className="text-sm text-muted">{(fine.student as any)?.student_id_number || ''}</p>
                                            </div>
                                        </td>
                                        <td>{fine.description}</td>
                                        <td style={{ fontWeight: 700, color: fine.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{Number(fine.amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${fine.status}`}>
                                                {fine.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                            </span>
                                        </td>
                                        <td className="text-sm text-muted">{(fine.issuer as any)?.full_name || '—'}</td>
                                        <td className="text-sm text-muted">
                                            {format(new Date(fine.created_at), 'MMM d, yyyy')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
