import { useEffect, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { attachCloud } from './cloud';

/**
 * Sign-in with Google or GitHub through Supabase Auth (PKCE flow, so the hash router is untouched).
 * Access is invite-only: the database function `am_i_allowed()` checks the user's verified email
 * against the `allowed_emails` table. Without VITE_SUPABASE_* the app runs locally with no login.
 */
const url = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const authEnabled = !!(url && key);
export const supabase: SupabaseClient | null = authEnabled
  ? createClient(url!, key!, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export type Provider = 'google' | 'github';
export type AuthState =
  | { status: 'loading' }
  | { status: 'out'; error?: string }
  | { status: 'denied'; email?: string }
  | { status: 'in'; user: User };

export async function signIn(provider: Provider) {
  await supabase?.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + window.location.pathname } });
}

export async function signOut() {
  await supabase?.auth.signOut();
  window.location.reload(); // drop the previous user's data from memory
}

/** Bearer token for the judge server; null when auth is off. */
export async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(authEnabled ? { status: 'loading' } : { status: 'out' });

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    let current: string | null = null;

    const check = async (user: User | null) => {
      if (!alive) return;
      if (!user) { current = null; setState({ status: 'out' }); return; }
      if (current === user.id) return; // token refresh for the same user
      const { data, error } = await supabase!.rpc('am_i_allowed');
      if (!alive) return;
      if (error) { setState({ status: 'out', error: 'Could not verify your invitation. Try again in a moment.' }); return; }
      if (data !== true) { setState({ status: 'denied', email: user.email }); return; }
      await attachCloud(supabase!, user.id);
      current = user.id;
      if (alive) setState({ status: 'in', user });
    };

    supabase.auth.getSession().then(({ data }) => check(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer: calling Supabase from inside this callback can deadlock.
      setTimeout(() => check(event === 'SIGNED_OUT' ? null : session?.user ?? null), 0);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
