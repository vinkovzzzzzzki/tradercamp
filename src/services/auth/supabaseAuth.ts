// Supabase authentication service - exact reproduction of original auth logic
import { createClient } from '@supabase/supabase-js';

// Supabase configuration with multiple env fallbacks (matches your Vercel setup)
function pickEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const val = (process.env as any)[key];
    if (val && typeof val === 'string' && val.trim().length > 0) return val;
  }
  return undefined;
}

const supabaseUrl =
  pickEnv(
    'EXPO_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_invest_SUPABASE_URL',
    'invest_SUPABASE_URL'
  ) || 'https://your-project.supabase.co';

const supabaseAnonKey =
  pickEnv(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_invest_SUPABASE_ANON_KEY',
    'invest_SUPABASE_ANON_KEY'
  ) || 'your-anon-key';

const isSupabaseEnvConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey !== 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupaAuth {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface User {
  id: string;
  nickname: string;
  bio: string;
  avatar: string;
  friends: string[];
}

// Sign up with email and password
export async function signUp(email: string, password: string, nickname?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseEnvConfigured) {
      return { success: false, error: 'Supabase env vars are not configured' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // No email confirmation flow enforced here; project-level setting controls this
      } as any,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email,
            nickname: nickname || email.split('@')[0],
            bio: '',
            avatar: '',
            friends: [],
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        console.warn('Profile creation failed:', profileError.message);
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string; auth?: SupaAuth }> {
  try {
    if (!isSupabaseEnvConfigured) {
      return { success: false, error: 'Supabase env vars are not configured' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user && data.session) {
      const auth: SupaAuth = {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || '',
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        },
      };

      return { success: true, auth };
    }

    return { success: false, error: 'No user data received' };
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Sign out
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get current session
export async function getCurrentSession(): Promise<{ success: boolean; auth?: SupaAuth; error?: string }> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (data.session && data.session.user) {
      const auth: SupaAuth = {
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          created_at: data.session.user.created_at || '',
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        },
      };

      return { success: true, auth };
    }

    return { success: true }; // No session is not an error
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get user profile
export async function getUserProfile(userId: string): Promise<{ success: boolean; profile?: User; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (data) {
      const profile: User = {
        id: data.id,
        nickname: data.nickname || '',
        bio: data.bio || '',
        avatar: data.avatar || '',
        friends: data.friends || [],
      };

      return { success: true, profile };
    }

    return { success: false, error: 'Profile not found' };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Update user profile
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Reset password
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const redirectTo = typeof window !== 'undefined' && (window as any).location?.origin
      ? `${(window as any).location.origin}/reset-password`
      : undefined;

    const options = redirectTo ? { redirectTo } : {};

    const { error } = await supabase.auth.resetPasswordForEmail(email, options as any);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Check if email is available
export async function isEmailAvailable(email: string): Promise<{ success: boolean; available?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows returned means email is available
      return { success: true, available: true };
    }

    if (error) {
      return { success: false, error: error.message };
    }

    if (data) {
      // If we get data, email is taken
      return { success: true, available: false };
    }
    return { success: true, available: true };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (auth: SupaAuth | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      const auth: SupaAuth = {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || '',
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
        },
      };
      callback(auth);
    } else {
      callback(null);
    }
  });
}

// Connectivity check: verifies that Supabase is reachable and schema is applied
export async function checkSupabaseConnectivity(): Promise<{ ok: boolean; error?: string }>{
  try {
    // Selecting from profiles is safe with RLS; empty result is fine
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error' };
  }
}
