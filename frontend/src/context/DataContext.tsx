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
    lastUpdated: number | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const DESCRIPTION_STORAGE_KEY = 'fine_description_templates';

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth();
    const [fines, setFines] = useState<Fine[]>([]);
    const [students, setStudents] = useState<Profile[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [descriptionOptions, setDescriptionOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);

    const fetchFines = useCallback(async () => {
        if (!profile) return;

        const now = Date.now();
        if (lastUpdated && now - lastUpdated < 60000 && fines.length > 0) {
            return;
        }

        try {
            let query = supabase
                .from('fines')
                .select('*, student:profiles!student_id(full_name, student_id_number), issuer:profiles!issued_by(full_name, organization_id)')
                .order('created_at', { ascending: false });

            if (profile.role === 'student') {
                query = query.eq('student_id', profile.id);
            } else if (profile.role !== 'admin') {
                query = query.eq('issued_by', profile.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const list = data || [];
            setFines(list);
            setLastUpdated(Date.now());

            // Build description options
            const descs = list.map(f => f.description).filter(Boolean);
            let combined = Array.from(new Set(descs));

            if (typeof window !== 'undefined') {
                const stored = window.localStorage.getItem(DESCRIPTION_STORAGE_KEY);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            combined = Array.from(new Set([...combined, ...parsed]));
                        }
                    } catch (e) { }
                }
            }
            setDescriptionOptions(combined);
        } catch (error) {
            console.error('Error fetching fines:', error);
        }
    }, [profile, lastUpdated, fines.length]);

    const fetchStudents = useCallback(async () => {
        if (!profile) return;
        if (students.length > 0) return; // Basic cache for students

        try {
            const { data, count } = await supabase
                .from('profiles')
                .select('*, organization:organizations(name)', { count: 'exact' })
                .eq('role', 'student')
                .order('full_name');
            setStudents(data || []);
            setTotalStudents(count || (data?.length || 0));
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }, [profile, students.length]);

    const refreshFines = async () => {
        setLastUpdated(null); // Force refresh
        await fetchFines();
    };

    const refreshStudents = async () => {
        setStudents([]); // Force refresh
        await fetchStudents();
    };

    useEffect(() => {
        if (profile) {
            setLoading(true);
            setFines([]); // Clear existing data on profile change
            setLastUpdated(null); // Reset cache timer
            Promise.all([fetchFines(), fetchStudents()]).finally(() => {
                setLoading(false);
            });
        } else {
            setFines([]);
            setStudents([]);
            setTotalStudents(0);
            setLoading(false);
        }
    }, [profile, fetchFines, fetchStudents]);

    return (
        <DataContext.Provider value={{
            fines,
            students,
            totalStudents,
            descriptionOptions,
            loading,
            refreshFines,
            refreshStudents,
            lastUpdated
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
