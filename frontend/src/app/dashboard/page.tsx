'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Fine } from '@/types';
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';

export default function DashboardPage() {
    const { profile } = useAuth();
    const [fines, setFines] = useState<Fine[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(true);

    const isManager = profile?.role !== 'student';

    useEffect(() => {
        if (!profile) return;
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (profile!.role === 'student') {
                // Student: only their own fines
                const { data } = await supabase
                    .from('fines')
                    .select('*, issuer:profiles!issued_by(full_name, role)')
                    .eq('student_id', profile!.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                setFines(data || []);
            } else {
                // Admin/Org: all fines (optionally scoped)
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
            }
        } finally {
            setLoading(false);
        }
    };

    const unpaidFines = fines.filter(f => f.status === 'unpaid');
    const paidFines = fines.filter(f => f.status === 'paid');
    const totalAmount = fines.reduce((sum, f) => sum + f.amount, 0);
    const unpaidAmount = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

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
                    <h2>{greetingTime()}, {profile?.full_name?.split(' ')[0] || 'User'} 👋</h2>
                    <p>
                        {profile?.role === 'student'
                            ? 'Here is a summary of your fine account status.'
                            : 'Here is an overview of the fines system today.'}
                    </p>
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
                            <p>{profile?.role === 'student' ? 'Total Fines' : 'Total Fines'}</p>
                            <h3>{fines.length}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon red"><FiAlertCircle size={22} /></div>
                        <div className="stat-info">
                            <p>Unpaid</p>
                            <h3>{unpaidFines.length}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green"><FiCheckCircle size={22} /></div>
                        <div className="stat-info">
                            <p>Paid</p>
                            <h3>{paidFines.length}</h3>
                        </div>
                    </div>

                    {isManager ? (
                        <div className="stat-card">
                            <div className="stat-icon blue"><FiUsers size={22} /></div>
                            <div className="stat-info">
                                <p>Total Students</p>
                                <h3>{totalStudents}</h3>
                            </div>
                        </div>
                    ) : (
                        <div className="stat-card">
                            <div className="stat-icon gold"><FiDollarSign size={22} /></div>
                            <div className="stat-info">
                                <p>Outstanding</p>
                                <h3>₱{unpaidAmount.toFixed(2)}</h3>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Student status banner */}
            {profile?.role === 'student' && !loading && (
                <div
                    className={`alert ${unpaidFines.length > 0 ? 'alert-error' : 'alert-success'}`}
                    style={{ marginBottom: 24, padding: 20, borderRadius: 'var(--radius-lg)' }}
                >
                    {unpaidFines.length > 0 ? (
                        <>
                            <FiAlertCircle size={20} style={{ flexShrink: 0 }} />
                            <div>
                                <strong>You have {unpaidFines.length} unpaid fine{unpaidFines.length > 1 ? 's' : ''}.</strong>
                                <p style={{ marginTop: 2, fontSize: 13, opacity: 0.85 }}>
                                    Total outstanding balance: <strong>₱{unpaidAmount.toFixed(2)}</strong>.
                                    Please settle your fines at the respective office.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <FiCheckCircle size={20} style={{ flexShrink: 0 }} />
                            <div>
                                <strong>Your account is clear!</strong>
                                <p style={{ marginTop: 2, fontSize: 13, opacity: 0.85 }}>
                                    You have no outstanding fines. Keep it up!
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Recent Fines Table */}
            <div className="table-container">
                <div className="table-header">
                    <span className="table-title">
                        {profile?.role === 'student' ? 'My Fines' : 'Recent Fines'}
                    </span>
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
                            <p>{profile?.role === 'student' ? 'You have no recorded fines.' : 'No fines have been recorded yet.'}</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    {isManager && <th>Student</th>}
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    {isManager && <th>Issued By</th>}
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fines.map((fine) => (
                                    <tr key={fine.id}>
                                        {isManager && (
                                            <td>
                                                <div>
                                                    <p style={{ fontWeight: 600 }}>{(fine.student as any)?.full_name || '—'}</p>
                                                    <p className="text-sm text-muted">{(fine.student as any)?.student_id_number || ''}</p>
                                                </div>
                                            </td>
                                        )}
                                        <td>{fine.description}</td>
                                        <td style={{ fontWeight: 700, color: fine.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{Number(fine.amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${fine.status}`}>
                                                {fine.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                            </span>
                                        </td>
                                        {isManager && (
                                            <td className="text-sm text-muted">{(fine.issuer as any)?.full_name || '—'}</td>
                                        )}
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
