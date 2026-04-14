'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '100vh', gap: 12 }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)' }} />
                <div className="flex-col gap-xs">
                    <div className="skeleton" style={{ width: 120, height: 14 }} />
                    <div className="skeleton" style={{ width: 80, height: 12 }} />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
