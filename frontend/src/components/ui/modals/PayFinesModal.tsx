'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Fine } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

interface PayFinesModalProps {
    fines: Fine[];
    title: string;
    onClose: () => void;
    onApply: (selectedIds: string[], status: 'paid' | 'unpaid') => Promise<void>;
    showSearch?: boolean;
}

export default function PayFinesModal({ fines, title, onClose, onApply, showSearch = false }: PayFinesModalProps) {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [payStatus, setPayStatus] = useState<'paid' | 'unpaid'>('paid');
    const [applying, setApplying] = useState(false);

    const visibleFines = showSearch && search
        ? fines.filter(f => {
            const s = search.toLowerCase();
            return (
                f.description.toLowerCase().includes(s) ||
                (f.student as any)?.full_name?.toLowerCase().includes(s) ||
                (f.student as any)?.student_id_number?.toLowerCase().includes(s)
            );
        })
        : fines;

    function toggleSelection(id: string, checked: boolean) {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    }

    function toggleAll() {
        setSelectedIds(selectedIds.length === visibleFines.length ? [] : visibleFines.map(f => f.id));
    }

    async function handleApply() {
        if (selectedIds.length === 0) return;
        setApplying(true);
        await onApply(selectedIds, payStatus);
        setApplying(false);
    }

    return (
        <Modal
            title={title}
            subtitle="Select fines to mark as paid or unpaid."
            onClose={onClose}
            maxWidth={700}
            footer={
                <>
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleApply}
                        disabled={selectedIds.length === 0 || applying}
                    >
                        {applying ? 'Updating...' : `Apply to ${selectedIds.length} Fine(s)`}
                    </button>
                </>
            }
        >
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {showSearch && (
                    <div className="search-bar" style={{ marginBottom: 12 }}>
                        <FiSearch size={14} />
                        <input
                            type="text"
                            placeholder="Search fine description, student name, or ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                    </div>
                )}

                <div className="flex-between" style={{ marginBottom: 12 }}>
                    <div className="flex gap-sm">
                        <button
                            className={`btn btn-sm ${payStatus === 'paid' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setPayStatus('paid')}
                        >
                            Mark as Paid
                        </button>
                        <button
                            className={`btn btn-sm ${payStatus === 'unpaid' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setPayStatus('unpaid')}
                        >
                            Mark as Unpaid
                        </button>
                    </div>
                    <button className="btn btn-sm btn-ghost" onClick={toggleAll}>
                        {selectedIds.length === visibleFines.length && visibleFines.length > 0 ? 'Clear All' : 'Select All'}
                    </button>
                </div>

                {visibleFines.length === 0 ? (
                    <p className="text-center text-muted">No fines found.</p>
                ) : (
                    <div className="flex-col gap-sm">
                        {visibleFines.map(f => (
                            <label key={f.id} className="card flex-between" style={{ padding: 12, cursor: 'pointer' }}>
                                <div className="flex gap-sm align-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(f.id)}
                                        onChange={e => toggleSelection(f.id, e.target.checked)}
                                    />
                                    <div>
                                        <p style={{ fontWeight: 600 }}>{f.description}</p>
                                        <p className="text-xs text-muted">
                                            {(f.student as any)?.full_name} | {format(new Date(f.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 700 }}>{formatCurrency(f.amount)}</p>
                                    <span className={`badge badge-${f.status}`} style={{ fontSize: 10 }}>
                                        {f.status.toUpperCase()}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
