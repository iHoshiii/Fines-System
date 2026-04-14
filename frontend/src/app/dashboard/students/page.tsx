'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import { FiSearch, FiUsers, FiAlertCircle } from 'react-icons/fi';

export default function StudentsPage() {
    const [students, setStudents] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [finesCounts, setFinesCounts] = useState<Record<string, { total: number; unpaid: number }>>({});

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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
