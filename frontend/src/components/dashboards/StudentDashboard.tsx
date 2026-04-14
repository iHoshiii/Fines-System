'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Fine } from '@/types';
import { FiDollarSign, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';

export default function StudentDashboard() {
    const { profile } = useAuth();
    const [fines, setFines] = useState<Fine[]>([]);
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
                .select('*, issuer:profiles!issued_by(full_name, role)')
                .eq('student_id', profile!.id)
                .order('created_at', { ascending: false })
                .limit(10);
            setFines(data || []);
        } finally {
            setLoading(false);
        }
    };

    const unpaidFines = fines.filter(f => f.status === 'unpaid');
    const paidFines = fines.filter(f => f.status === 'paid');
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
                    <h2>{greetingTime()}, {profile?.full_name?.split(' ')[0] || 'Student'} 👋</h2>
                    <p>Here is a summary of your fine account status.</p>
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

                    <div className="stat-card">
                        <div className="stat-icon gold"><span style={{ fontSize: 22, fontWeight: 'bold' }}></span></div>
                        <div className="stat-info">
                            <p>Outstanding</p>
                            <h3>₱{unpaidAmount.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Student status banner */}
            {!loading && (
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
                    <span className="table-title">My Fines</span>
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
                            <span style={{ fontSize: 40, fontWeight: 'bold' }}></span>
                            <h4>No fines found</h4>
                            <p>You have no recorded fines.</p>
                        </div>
                    ) : (
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
                                {fines.map((fine) => (
                                    <tr key={fine.id}>
                                        <td>{fine.description}</td>
                                        <td style={{ fontWeight: 700, color: fine.status === 'unpaid' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{Number(fine.amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${fine.status}`}>
                                                {fine.status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                                            </span>
                                        </td>
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
