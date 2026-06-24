import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';
import { resolveLoginEmail } from '@/lib/auth';

interface Profile {
  name: string;
  phone: string;
  address: string;
  loyalty_points: number;
  total_purchases: number;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  isEmployee: boolean;
  employeePermissions: string[];
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; phone: string; address: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ADMIN_PERMISSIONS = ['orders', 'categories', 'customers', 'chat', 'notifications', 'content', 'loyalty', 'employees', 'settings'];

const mapProfile = (data: Tables<'profiles'>): Profile => ({
  name: data.name,
  phone: data.phone,
  address: data.address,
  loyalty_points: data.loyalty_points,
  total_purchases: Number(data.total_purchases),
});

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoggedIn: false,
  isEmployee: false,
  employeePermissions: [],
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [employeePermissions, setEmployeePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const syncProfileEmail = useCallback(async (currentUser: SupabaseUser, existingProfile: Tables<'profiles'> | null) => {
    const currentEmail = currentUser.email?.trim().toLowerCase() ?? '';
    const storedEmail = (existingProfile as { email?: string } | null)?.email?.trim().toLowerCase() ?? '';

    if (!currentEmail || currentEmail === storedEmail) {
      return existingProfile;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ email: currentEmail } as never)
      .eq('id', currentUser.id)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to sync profile email', error);
      return existingProfile;
    }

    if (data) {
      setProfile(mapProfile(data));
      return data;
    }

    return existingProfile;
  }, []);

  const ensureProfile = useCallback(async (currentUser: SupabaseUser) => {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch profile', fetchError);
      setProfile(null);
      return null;
    }

    if (existingProfile) {
      const syncedProfile = await syncProfileEmail(currentUser, existingProfile);
      if (syncedProfile) {
        setProfile(mapProfile(syncedProfile));
      }
      return syncedProfile;
    }

    const profilePayload: Record<string, unknown> = {
      id: currentUser.id,
      name: currentUser.user_metadata?.name ?? currentUser.email?.split('@')[0] ?? '',
      phone: currentUser.user_metadata?.phone ?? '',
      address: currentUser.user_metadata?.address ?? '',
      email: currentUser.email?.trim().toLowerCase() ?? '',
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profilePayload as never)
      .select('*')
      .single();

    if (createError) {
      console.error('Failed to create profile', createError);
      setProfile(null);
      return null;
    }

    setProfile(mapProfile(createdProfile));
    return createdProfile;
  }, [syncProfileEmail]);

  const checkAdminRole = useCallback(async (userId: string) => {
    const { error: bootstrapError } = await supabase.rpc('bootstrap_first_admin');

    if (bootstrapError) {
      console.error('Failed to bootstrap admin role', bootstrapError);
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch roles', error);
      setIsEmployee(false);
      setEmployeePermissions([]);
      return;
    }

    const isAdmin = data?.some((record) => record.role === 'admin') ?? false;
    setIsEmployee(isAdmin);
    setEmployeePermissions(isAdmin ? ADMIN_PERMISSIONS : []);
  }, []);

  const loadUserState = useCallback(async (currentUser: SupabaseUser | null) => {
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setIsEmployee(false);
      setEmployeePermissions([]);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    await ensureProfile(currentUser);
    await checkAdminRole(currentUser.id);
    setLoading(false);
  }, [checkAdminRole, ensureProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      void loadUserState(session?.user ?? null);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void loadUserState(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [loadUserState]);

  const signup = useCallback(async (data: { name: string; email: string; phone: string; address: string; password: string }) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          address: data.address,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      const email = await resolveLoginEmail(identifier);

      if (!email) {
        return { success: false, error: 'Account not found' };
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await ensureProfile(user);
  }, [ensureProfile, user]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoggedIn: !!user,
      isEmployee,
      employeePermissions,
      loading,
      login,
      signup,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
