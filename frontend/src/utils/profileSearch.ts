import { Profile } from '@/types';

export function filterProfiles(profiles: Profile[], term: string): Profile[] {
    if (!term.trim()) return profiles;
    const lower = term.toLowerCase();
    return profiles.filter(p =>
        (p.full_name || '').toLowerCase().includes(lower) ||
        (p.student_id_number || '').toLowerCase().includes(lower) ||
        (p.college || '').toLowerCase().includes(lower) ||
        (p.course || '').toLowerCase().includes(lower) ||
        (p.year_section || '').toLowerCase().includes(lower) ||
        (p.email || '').toLowerCase().includes(lower)
    );
}
