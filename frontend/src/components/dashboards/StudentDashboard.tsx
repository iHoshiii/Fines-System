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
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

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
                .order('created_at', { ascending: false });
            setFines(data || []);
        } finally {
            setLoading(false);
        }
    };

    const unpaidFines = fines.filter(f => f.status === 'unpaid');
    const paidFines = fines.filter(f => f.status === 'paid');
    const totalAmount = fines.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount = paidFines.reduce((sum, f) => sum + f.amount, 0);
    const unpaidAmount = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

    const greetingTime = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const groupedFines = fines.reduce((acc, fine) => {
        if (!acc[fine.description]) {
            acc[fine.description] = {
                description: fine.description,
                totalAmount: 0,
                paid: 0,
                unpaid: 0,
            };
        }
        acc[fine.description].totalAmount += Number(fine.amount);
        if (fine.status === 'paid') acc[fine.description].paid += Number(fine.amount);
        if (fine.status === 'unpaid') acc[fine.description].unpaid += Number(fine.amount);
        return acc;
    }, {} as Record<string, { description: string; totalAmount: number; paid: number; unpaid: number }>);

    const summaryData = Object.values(groupedFines);

    const totalPages = Math.ceil(summaryData.length / ITEMS_PER_PAGE);
    const paginatedSummary = summaryData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-left">
                    <h2>{greetingTime()}, {profile?.full_name?.split(' ')[0] || 'Student'}!</h2>
                    <p>Here is a summary of your fine account status.</p>
                </div>
            </div>

            {/* Stats Cards */}
            {loading ? (
                <div className="stats-grid">
                    {[1, 2, 3, 4, 5].map(i => (
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
                        <div className="stat-icon blue"><FiAlertCircle size={22} /></div>
                        <div className="stat-info">
                            <p>Total Fines</p>
                            <h3>{fines.length}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon gold"><span style={{ fontSize: 22, fontWeight: 'bold' }}>₱</span></div>
                        <div className="stat-info">
                            <p>Total Amount</p>
                            <h3>₱{totalAmount.toFixed(2)}</h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green"><FiCheckCircle size={22} /></div>
                        <div className="stat-info">
                            <p>Paid</p>
                            <h3 style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                {paidFines.length}
                                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>(₱{paidAmount.toFixed(2)})</span>
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon red"><FiAlertCircle size={22} /></div>
                        <div className="stat-info">
                            <p>Unpaid</p>
                            <h3 style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                {unpaidFines.length}
                                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>(₱{unpaidAmount.toFixed(2)})</span>
                            </h3>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon gold"><span style={{ fontSize: 22, fontWeight: 'bold' }}>₱</span></div>
                        <div className="stat-info">
                            <p>Balance</p>
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
                                    Total balance: <strong>₱{unpaidAmount.toFixed(2)}</strong>.
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

            {/* Fines Summary Table */}
            <div className="table-container">
                <div className="table-header">
                    <span className="table-title">Fines Summary</span>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 32, textAlign: 'center' }}>
                            <div className="animate-pulse" style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                                Loading fines summary…
                            </div>
                        </div>
                    ) : summaryData.length === 0 ? (
                        <div className="empty-state">
                            <h4>No fines found</h4>
                            <p>You have no recorded fines.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Total Amount</th>
                                    <th>Paid</th>
                                    <th>Unpaid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedSummary.map((s, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 600 }}>{s.description}</td>
                                        <td style={{ fontWeight: 700 }}>
                                            ₱{s.totalAmount.toFixed(2)}
                                        </td>
                                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                                            ₱{s.paid.toFixed(2)}
                                        </td>
                                        <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                                            ₱{s.unpaid.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex-center mt-md gap-sm" style={{ justifyContent: 'center', marginTop: '16px' }}>
                    <button className="btn btn-ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <button className="btn btn-ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </div>
            )}
        </div>
    );
}
