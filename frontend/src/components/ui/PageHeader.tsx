'use client';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="page-header">
            <div className="page-header-left">
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="flex gap-sm">{actions}</div>}
        </div>
    );
}
