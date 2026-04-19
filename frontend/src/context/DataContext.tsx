'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Fine, Profile } from '@/types';
import { useAuth } from './AuthContext';

interface DataContextType {
    fines: Fine[];
    students: Profile[];
    totalStudents: number;
    descriptionOptions: string[];
    loading: boolean;
    refreshFines: () => Promise<void>;
    refreshStudents: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const DESCRIPTION_STORAGE_KEY = 'fine_description_templates';

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth();
    const [allFines, setAllFines] = useState<Fine[]>([]);
    const [students, setStudents] = useState<Profile[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [descriptionOptions, setDescriptionOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFines = useCallback(async () => {
        if (!profile) return;
        try {
            const { data } = await supabase
                .from('fines')
                .select('*, student:profiles!student_id(full_name, student_id_number, course, year_level), issuer:profiles!issued_by(full_name, id, role, organization_id)')
                .order('created_at', { ascending: false });

            const list = data || [];
            setAllFines(list);

            // Sync description options
            const descs = list.map(f => f.description).filter(Boolean);
            let combined = Array.from(new Set(descs));
            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem(DESCRIPTION_STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) combined = Array.from(new Set([...combined, ...parsed]));
                    } catch (e) { }
                }
            }
            setDescriptionOptions(combined);
        } catch (error) {
            console.error('Error fetching fines:', error);
        }
    }, [profile]);

    const fetchStudents = useCallback(async () => {
        if (!profile) return;
        try {
            const { data, count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .eq('role', 'student')
                .order('full_name');
            setStudents(data || []);
            setTotalStudents(count || (data?.length || 0));
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }, [profile]);

    const refreshFines = async () => { await fetchFines(); };
    const refreshStudents = async () => { await fetchStudents(); };

    useEffect(() => {
        if (profile) {
            setLoading(true);
            Promise.all([fetchFines(), fetchStudents()]).finally(() => setLoading(false));
        } else {
            setAllFines([]);
            setStudents([]);
            setLoading(false);
        }
    }, [profile, fetchFines, fetchStudents]);

    // Apply strict filtering based on user request
    const filteredFines = allFines.filter(f => {
        if (!profile) return false;
        if (profile.role === 'admin') return true;

        // If organization is set up, filter by it
        if (profile.organization_id && (f.issuer as any)?.organization_id) {
            return (f.issuer as any).organization_id === profile.organization_id;
        }

        // FALLBACK: If no organization info exists for the account, 
        // strictly show only fines issued by THIS specific account.
        // This prevents different orgs with null IDs from seeing each other's fines.
        return f.issued_by === profile.id;
    });

    return (
        <DataContext.Provider value={{
            fines: filteredFines,
            students,
            totalStudents,
            descriptionOptions,
            loading,
            refreshFines,
            refreshStudents
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
}
