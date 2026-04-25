'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseClient';
import { Profile } from '@/types';
import { FiGrid, FiShield } from 'react-icons/fi';
import SearchBar from '@/components/ui/SearchBar';
import PageHeader from '@/components/ui/PageHeader';

export default function OrganizationsPage() {
    const [orgAccounts, setOrgAccounts] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchOrgAccounts(); }, []);

    const fetchOrgAccounts = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['ncssc', 'college_org', 'sub_org'])
            .order('full_name');
        setOrgAccounts(data || []);
        setLoading(false);
    };

    const typeLabel: Record<string, string> = { ncssc: 'NCSSC', college_org: 'College Org', sub_org: 'Sub-Org' };
    const typeBadge: Record<string, string> = { ncssc: 'badge-role-ncssc', college_org: 'badge-role-college_org', sub_org: 'badge-role-sub_org' };

    const filtered = orgAccounts.filter(o => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
            (o.full_name || '').toLowerCase().includes(term) ||
            (o.email || '').toLowerCase().includes(term) ||
            (o.college || '').toLowerCase().includes(term) ||
            (typeLabel[o.role] || '').toLowerCase().includes(term)
        );
    });

    return (
        <div>
            <PageHeader title="Organizations" description="View NCSSC, College Orgs, and Sub-Organization Accounts." />

            <div style={{ marginBottom: 16 }}>
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, college, or type..." />
            </div>

            <div className="table-container">
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state">
                            <FiGrid />
                            <h4>No organization accounts yet</h4>
                            <p>Accounts managed in User Management will appear here.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>College Name</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(o => (
                                    <tr key={o.id}>
                                        <td>
                                            <p style={{ fontWeight: 600 }}>{o.full_name}</p>
                                            <p className="text-xs text-muted">{o.email || 'No email set'}</p>
                                        </td>
                                        <td>{o.college || '—'}</td>
                                        <td><span className={`badge ${typeBadge[o.role] || 'badge-role-student'}`}>{typeLabel[o.role] || o.role}</span></td>
                                        <td>
                                            <span className="text-xs text-muted flex gap-xs align-center">
                                                <FiShield size={12} /> Managed by Admin
                                            </span>
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
