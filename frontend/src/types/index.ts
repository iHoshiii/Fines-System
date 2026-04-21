export type UserRole = 'admin' | 'student' | 'ncssc' | 'college_org' | 'sub_org';

export type FineStatus = 'unpaid' | 'paid';

export interface Organization {
    id: string;
    name: string;
    type: 'ncssc' | 'college' | 'sub';
}

export interface Profile {
    id: string;
    full_name: string;
    role: UserRole;
    student_id_number?: string;
    organization_id?: string;
    organization?: Organization;
    email?: string;
    college?: string;
    course?: string;
    year_section?: string;
}

export interface Fine {
    id: string;
    student_id: string;
    student?: Profile;
    amount: number;
    description: string;
    status: FineStatus;
    issued_by: string;
    issuer?: Profile;
    created_at: string;
    updated_at?: string;
}

export interface FineFormData {
    student_id: string;
    amount: number;
    description: string;
    status: FineStatus;
}
