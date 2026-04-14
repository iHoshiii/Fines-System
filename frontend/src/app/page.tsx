'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)' }} />
    </div>
  );
}
