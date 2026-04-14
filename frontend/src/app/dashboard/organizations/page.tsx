'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Organization } from '@/types';
import { FiGrid, FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiAlertCircle } from 'react-icons/fi';

export default function OrganizationsPage() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Organization | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<'ncssc' | 'college' | 'sub'>('college');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { fetchOrgs(); }, []);

    const fetchOrgs = async () => {
        setLoading(true);
        const { data } = await supabase.from('organizations').select('*').order('name');
        setOrgs(data || []);
        setLoading(false);
    };

    const openAdd = () => { setEditing(null); setName(''); setType('college'); setError(null); setShowModal(true); };
    const openEdit = (o: Organization) => { setEditing(o); setName(o.name); setType(o.type); setError(null); setShowModal(true); };

    const handleSave = async () => {
        if (!name.trim()) { setError('Organization name is required.'); return; }
        setSaving(true);
        setError(null);
        if (editing) {
            await supabase.from('organizations').update({ name: name.trim(), type }).eq('id', editing.id);
        } else {
            await supabase.from('organizations').insert({ name: name.trim(), type });
        }
        setSaving(false);
        setShowModal(false);
        fetchOrgs();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this organization?')) return;
        await supabase.from('organizations').delete().eq('id', id);
        fetchOrgs();
    };

    const typeLabel: Record<string, string> = { ncssc: 'NCSSC', college: 'College Org', sub: 'Sub-Org' };
    const typeBadge: Record<string, string> = { ncssc: 'badge-role-ncssc', college: 'badge-role-college_org', sub: 'badge-role-sub_org' };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h2>Organizations</h2>
                    <p>Manage NCSSC, College Orgs, and Sub-Organizations.</p>
                </div>
                <button id="add-org-btn" className="btn btn-primary" onClick={openAdd}>
                    <FiPlus size={16} /> Add Organization
                </button>
            </div>

            <div className="table-container">
                <div className="table-wrapper">
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>
                    ) : orgs.length === 0 ? (
                        <div className="empty-state">
                            <FiGrid />
                            <h4>No organizations yet</h4>
                            <p>Add your first organization to get started.</p>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orgs.map(o => (
                                    <tr key={o.id}>
                                        <td style={{ fontWeight: 600 }}>{o.name}</td>
                                        <td><span className={`badge ${typeBadge[o.type]}`}>{typeLabel[o.type]}</span></td>
                                        <td>
                                            <div className="flex gap-xs">
                                                <button className="btn btn-icon btn-ghost" onClick={() => openEdit(o)} title="Edit">
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button className="btn btn-icon btn-danger" onClick={() => handleDelete(o.id)} title="Delete">
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Organization' : 'Add Organization'}</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><FiX size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-error"><FiAlertCircle size={16} /> {error}</div>}
                            <div className="form-group">
                                <label className="form-label">Organization Name *</label>
                                <input id="org-name" type="text" className="form-control" placeholder="e.g. CICS Student Council" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type *</label>
                                <select id="org-type" className="form-control" value={type} onChange={e => setType(e.target.value as any)}>
                                    <option value="ncssc">NCSSC</option>
                                    <option value="college">College Org</option>
                                    <option value="sub">Sub-Org</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button id="org-save-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                <FiSave size={15} /> {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
