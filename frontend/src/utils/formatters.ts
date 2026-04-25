import { UserRole } from '@/types';

export function getInitials(fullName: string): string {
    return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function formatCurrency(amount: number): string {
    return `₱${Number(amount).toFixed(2)}`;
}

export function getSurname(fullName: string): string {
    return fullName.split(' ').pop() || '';
}

export function formatIssuerRole(role: string): string {
    const map: Record<string, string> = {
        ncssc: 'NCSSC',
        college_org: 'College Org',
        sub_org: 'Sub Org',
        admin: 'Admin',
        student: 'Student',
    };
    return map[role] ?? role;
}

export const ROLE_LABEL: Record<UserRole, string> = {
    admin: 'System Admin',
    student: 'Student',
    ncssc: 'NCSSC',
    college_org: 'College Org',
    sub_org: 'Sub-Organization',
};

export const ROLE_BADGE: Record<UserRole, string> = {
    admin: 'badge-role-admin',
    student: 'badge-role-student',
    ncssc: 'badge-role-ncssc',
    college_org: 'badge-role-college_org',
    sub_org: 'badge-role-sub_org',
};
