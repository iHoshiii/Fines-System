'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import {
    FiHome, FiUsers, FiDollarSign, FiBarChart2,
    FiSettings, FiLogOut, FiGrid
} from 'react-icons/fi';

interface NavItem {
    href: string;
    icon: React.ReactNode;
    label: string;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    {
        href: '/dashboard',
        icon: <FiHome size={18} />,
        label: 'Dashboard',
        roles: ['admin', 'student', 'ncssc', 'college_org', 'sub_org'],
    },
    {
        href: '/dashboard/fines',
        icon: <span style={{ fontSize: 18, fontWeight: 'bold' }}></span>,
        label: 'My Fines',
        roles: ['student'],
    },
    {
        href: '/dashboard/fines',
        icon: <span style={{ fontSize: 18, fontWeight: 'bold' }}></span>,
        label: 'Manage Fines',
        roles: ['admin', 'ncssc', 'college_org', 'sub_org'],
    },
    {
        href: '/dashboard/students',
        icon: <FiUsers size={18} />,
        label: 'Students',
        roles: ['admin', 'ncssc', 'college_org', 'sub_org'],
    },
    {
        href: '/dashboard/organizations',
        icon: <FiGrid size={18} />,
        label: 'Organizations',
        roles: ['admin'],
    },
    {
        href: '/dashboard/reports',
        icon: <FiBarChart2 size={18} />,
        label: 'Reports',
        roles: ['admin', 'ncssc', 'college_org', 'sub_org'],
    },
    {
        href: '/dashboard/users',
        icon: <FiUsers size={18} />,
        label: 'User Management',
        roles: ['admin'],
    },
    {
        href: '/dashboard/settings',
        icon: <FiSettings size={18} />,
        label: 'Settings',
        roles: ['admin', 'student', 'ncssc', 'college_org', 'sub_org'],
    },
];

const roleLabel: Record<UserRole, string> = {
    admin: 'System Admin',
    student: 'Student',
    ncssc: 'NCSSC',
    college_org: 'College Org',
    sub_org: 'Sub-Organization',
};

export default function Sidebar() {
    const { profile, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const role = profile?.role;

    const allowedItems = useMemo(
        () => (role ? navItems.filter(item => item.roles.includes(role)) : []),
        [role]
    );
    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    useEffect(() => {
        if (pendingHref && pathname.startsWith(pendingHref)) {
            setPendingHref(null);
        }
    }, [pathname, pendingHref]);

    useEffect(() => {
        allowedItems.forEach(item => {
            router.prefetch(item.href);
        });
    }, [allowedItems, router]);

    if (!profile) return null;

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-brand-logo">N</div>
                <div className="sidebar-brand-text">
                    <h1>NVSU Fines</h1>
                    <span>Management System</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Navigation</div>
                {allowedItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const isNavigating = isPending && pendingHref === item.href;
                    return (
                        <Link
                            key={`${item.href}-${item.label}`}
                            href={item.href}
                            onClick={(e) => {
                                if (pathname === item.href) return;
                                e.preventDefault();
                                setPendingHref(item.href);
                                startTransition(() => {
                                    router.push(item.href);
                                });
                            }}
                            aria-busy={isNavigating}
                            className={`sidebar-link ${(isActive || isNavigating) ? 'active' : ''}`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <p>{profile.full_name}</p>
                        <span>{roleLabel[profile.role]}</span>
                    </div>
                    <button
                        className="sidebar-logout-btn"
                        onClick={signOut}
                        title="Sign Out"
                        id="sidebar-logout-btn"
                    >
                        <FiLogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
