'use client';

import { FiX } from 'react-icons/fi';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: number | string;
    subtitle?: string;
}

export default function Modal({ title, subtitle, onClose, children, footer, maxWidth = 540 }: ModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>{title}</h3>
                        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
                        <FiX size={18} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
