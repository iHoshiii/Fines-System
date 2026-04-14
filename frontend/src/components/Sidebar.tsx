'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
        icon: <FiDollarSign size={18} />,
        label: 'My Fines',
        roles: ['student'],
    },
    {
        href: '/dashboard/fines',
        icon: <FiDollarSign size={18} />,
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
        icon: <FiSettings size={18} />,
        label: 'User Management',
        roles: ['admin'],
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

    if (!profile) return null;

    const allowedItems = navItems.filter(item => item.roles.includes(profile.role));
    const initials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

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
                    return (
                        <Link
                            key={`${item.href}-${item.label}`}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
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
