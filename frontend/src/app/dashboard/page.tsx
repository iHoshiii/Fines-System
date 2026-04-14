'use client';

import { useAuth } from '@/context/AuthContext';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import CollegeOrgDashboard from '@/components/dashboards/CollegeOrgDashboard';
import NCSSCDashboard from '@/components/dashboards/NCSSCDashboard';
import SubOrgDashboard from '@/components/dashboards/SubOrgDashboard';

export default function DashboardPage() {
    const { profile } = useAuth();

    if (!profile) return null;

    switch (profile.role) {
        case 'student':
            return <StudentDashboard />;
        case 'admin':
            return <AdminDashboard />;
        case 'college_org':
            return <CollegeOrgDashboard />;
        case 'ncssc':
            return <NCSSCDashboard />;
        case 'sub_org':
            return <SubOrgDashboard />;
        default:
            return <div>Invalid Role</div>;
    }
}
