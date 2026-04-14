'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Fine } from '@/types';
import { FiBarChart2, FiDownload } from 'react-icons/fi';
import { format } from 'date-fns';

interface ReportRow {
    student: string;
    studentId: string;
    totalFines: number;
    paid: number;
    unpaid: number;
    totalAmount: number;
    unpaidAmount: number;
}

export default function ReportsPage() {
    const [fines, setFines] = useState<Fine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchFines(); }, []);

    const fetchFines = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('fines')
            .select('*, student:profiles!student_id(full_name, student_id_number)')
            .order('created_at', { ascending: false });
        setFines(data || []);
        setLoading(false);
    };

    // Aggregate by student
    const reportData = Object.values(
        (fines || []).reduce((acc: Record<string, ReportRow>, fine) => {
            const sid = fine.student_id;
            if (!acc[sid]) {
                acc[sid] = {
                    student: (fine.student as any)?.full_name || '—',
                    studentId: (fine.student as any)?.student_id_number || '—',
                    totalFines: 0, paid: 0, unpaid: 0,
                    totalAmount: 0, unpaidAmount: 0,
                };
            }
            acc[sid].totalFines++;
            acc[sid].totalAmount += Number(fine.amount);
            if (fine.status === 'paid') { acc[sid].paid++; }
            else { acc[sid].unpaid++; acc[sid].unpaidAmount += Number(fine.amount); }
            return acc;
        }, {})
    ).sort((a, b) => b.unpaid - a.unpaid);

    const totalFines = fines.length;
    const totalUnpaid = fines.filter(f => f.status === 'unpaid').length;
    const totalPaid = fines.filter(f => f.status === 'paid').length;
    const totalAmount = fines.reduce((s, f) => s + Number(f.amount), 0);
    const unpaidAmount = fines.filter(f => f.status === 'unpaid').reduce((s, f) => s + Number(f.amount), 0);

    const downloadCSV = () => {
        const headers = ['Student Name', 'ID Number', 'Total Fines', 'Paid', 'Unpaid', 'Total Amount (₱)', 'Outstanding (₱)'];
        const rows = reportData.map(r => [
            r.student, r.studentId, r.totalFines, r.paid, r.unpaid,
            r.totalAmount.toFixed(2), r.unpaidAmount.toFixed(2)
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nvsu-fines-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Reports</h2>
                    <p>Overview of student fines across all organizations.</p>
                </div>
                <button id="download-report-btn" className="btn btn-secondary" onClick={downloadCSV}>
                    <FiDownload size={16} /> Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Fines', value: totalFines, color: 'var(--color-primary)' },
                    { label: 'Paid', value: totalPaid, color: 'var(--color-success)' },
                    { label: 'Unpaid', value: totalUnpaid, color: 'var(--color-danger)' },
                    { label: 'Total Amount', value: `₱${totalAmount.toFixed(2)}`, color: 'var(--color-primary)' },
                    { label: 'Outstanding', value: `₱${unpaidAmount.toFixed(2)}`, color: 'var(--color-danger)' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div>
                            <p className="text-sm text-muted" style={{ marginBottom: 2 }}>{s.label}</p>
                            <h3 style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Student Summary Table */}
            <div className="table-container">
                <div className="table-header">
                    <span className="table-title">Student Fine Summary</span>
                    <span className="text-sm text-muted">{reportData.length} students</span>
                </div>
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Generating report…</div>
                    ) : reportData.length === 0 ? (
                        <div className="empty-state">
                            <FiBarChart2 />
                            <h4>No data yet</h4>
                            <p>No fines have been recorded.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>ID Number</th>
                                    <th>Total Fines</th>
                                    <th>Paid</th>
                                    <th>Unpaid</th>
                                    <th>Total Amount</th>
                                    <th>Outstanding</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((r, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{r.student}</td>
                                        <td className="text-muted">{r.studentId}</td>
                                        <td>{r.totalFines}</td>
                                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{r.paid}</td>
                                        <td>
                                            {r.unpaid > 0
                                                ? <span className="badge badge-unpaid">{r.unpaid}</span>
                                                : <span className="badge badge-paid">0</span>}
                                        </td>
                                        <td>₱{r.totalAmount.toFixed(2)}</td>
                                        <td style={{ fontWeight: 700, color: r.unpaidAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            ₱{r.unpaidAmount.toFixed(2)}
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
