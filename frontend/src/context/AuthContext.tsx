'use client';

import { supabase } from '@/lib/supabase/supabaseClient';
import { Profile } from '@/types';
import { User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    sendSignUpOtp: (email: string) => Promise<{ error: string | null }>;
    signUp: (userData: {
        email: string;
        password: string;
        fullName: string;
        studentId: string;
        college: string;
        course: string;
        year: string;
    }) => Promise<{ error: string | null }>;
    verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*, organization:organizations(*)')
            .eq('id', userId)
            .single();
        if (!error && data) setProfile(data as Profile);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? error.message : null };
    };

    const sendSignUpOtp = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false }
        });
        // shouldCreateUser: false means it only sends OTP, does NOT create an account
        // We ignore "user not found" errors since the user doesn't exist yet — that's expected
        if (error && !error.message.includes('not found') && !error.message.includes('No user')) {
            return { error: error.message };
        }
        return { error: null };
    };

    const signUp = async (userData: {
        email: string;
        password: string;
        fullName: string;
        studentId: string;
        college: string;
        course: string;
        year: string;
    }) => {
        const { error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.fullName,
                    role: 'student',
                    student_id_number: userData.studentId,
                    college: userData.college,
                    course: userData.course,
                    year_section: userData.year
                }
            }
        });
        return { error: error ? error.message : null };
    };

    const verifyOtp = async (email: string, token: string) => {
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
        return { error: error ? error.message : null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, sendSignUpOtp, signUp, verifyOtp, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
