'use client';

import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';

interface DescriptionTemplateModalProps {
    onClose: () => void;
    onAdd: (description: string) => void;
}

export default function DescriptionTemplateModal({ onClose, onAdd }: DescriptionTemplateModalProps) {
    const [value, setValue] = useState('');

    function handleSubmit() {
        if (!value.trim()) return;
        onAdd(value.trim());
        onClose();
    }

    return (
        <Modal
            title="Add Description Template"
            onClose={onClose}
            maxWidth={450}
            footer={
                <>
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>
                        <FiPlus size={15} /> Add Template
                    </button>
                </>
            }
        >
            <p className="text-sm text-muted mb-md">
                Add a common event or fine reason (e.g., &quot;Meeting Absence&quot;). This will appear as a suggestion when adding fines.
            </p>
            <div className="form-group">
                <label className="form-label">Description Text</label>
                <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="e.g. Foundation Day Absence"
                    autoFocus
                />
            </div>
        </Modal>
    );
}
