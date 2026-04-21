'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
    addDescriptionOption: (option: string) => void;
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

    const cacheRef = useRef<{ lastFinesUpdate: number; lastStudentsUpdate: number; userId: string | null }>({
        lastFinesUpdate: 0,
        lastStudentsUpdate: 0,
        userId: null
    });

    const fetchFines = useCallback(async () => {
        if (!profile) return;

        const now = Date.now();
        const isNewUser = cacheRef.current.userId !== profile.id;

        if (!isNewUser && now - cacheRef.current.lastFinesUpdate < 60000 && fines.length > 0) {
            return;
        }

        try {
            let query = supabase
                .from('fines')
                .select('*, student:profiles!student_id(full_name, student_id_number, college, course, year_section), issuer:profiles!issued_by(full_name, organization_id)')
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

            cacheRef.current.lastFinesUpdate = Date.now();
            cacheRef.current.userId = profile.id;

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
    }, [profile, fines.length]); // Keep fines.length to allow initial load check, but it's okay now because we don't clear in useEffect

    const fetchStudents = useCallback(async () => {
        if (!profile) return;
        const now = Date.now();
        const isNewUser = cacheRef.current.userId !== profile.id;

        if (!isNewUser && students.length > 0 && now - cacheRef.current.lastStudentsUpdate < 300000) return;

        try {
            const { data, count } = await supabase
                .from('profiles')
                .select('*, organization:organizations(name)', { count: 'exact' })
                .eq('role', 'student')
                .order('full_name');
            setStudents(data || []);
            setTotalStudents(count || (data?.length || 0));
            cacheRef.current.lastStudentsUpdate = Date.now();
            cacheRef.current.userId = profile.id;
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }, [profile, students.length]);

    const refreshFines = async () => {
        cacheRef.current.lastFinesUpdate = 0; // Force refresh
        await fetchFines();
    };

    const refreshStudents = async () => {
        setStudents([]);
        cacheRef.current.lastStudentsUpdate = 0; // Force refresh
        await fetchStudents();
    };

    const addDescriptionOption = (option: string) => {
        if (!option.trim()) return;
        if (typeof window === 'undefined') return;

        const stored = window.localStorage.getItem(DESCRIPTION_STORAGE_KEY);
        let current: string[] = [];
        if (stored) {
            try { current = JSON.parse(stored); } catch (e) { }
        }
        if (!current.includes(option.trim())) {
            const updated = [...current, option.trim()];
            window.localStorage.setItem(DESCRIPTION_STORAGE_KEY, JSON.stringify(updated));
            setDescriptionOptions(prev => Array.from(new Set([...prev, option.trim()])));
        }
    };

    useEffect(() => {
        if (profile) {
            const isNewUser = cacheRef.current.userId !== profile.id;
            if (isNewUser) {
                setFines([]);
                setStudents([]);
                setLoading(true);
            }

            Promise.all([fetchFines(), fetchStudents()]).finally(() => {
                setLoading(false);
            });
        } else {
            setFines([]);
            setStudents([]);
            setTotalStudents(0);
            setLoading(false);
            cacheRef.current.userId = null;
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
            lastUpdated,
            addDescriptionOption
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
