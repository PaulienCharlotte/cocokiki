
import React, {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, fetchProfile, type Profile } from '../services/supabase';

interface AuthContextType {
  user:           User | null;
  profile:        Profile | null;
  loading:        boolean;
  signIn:         (email: string, password: string) => Promise<string | null>;
  signUp:         (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut:        () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const p = await fetchProfile(userId);
    setProfile(p);
  };

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<string | null> => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    // Update display name after signup (profile is auto-created by trigger)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', data.user.id);
    }
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
