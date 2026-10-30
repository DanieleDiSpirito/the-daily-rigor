import { useEffect, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { attachCloud } from './cloud';

/**
 * Sign-in with Google or GitHub through Supabase Auth (PKCE flow, so the hash router is untouched).
 * The database function `am_i_allowed()` decides who may enter: by default any verified email, or
 * only the `allowed_emails` list if the owner chose invite-only mode (see supabase/schema.sql).
 * Visitors may also continue as guests: everything except the C++ judge works, and progress stays
 * in this browser's localStorage. Without VITE_SUPABASE_* the app runs locally with no login at all.
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
  | { status: 'guest' }
  | { status: 'in'; user: User };

const GUEST_KEY = 'daily-rigor/guest/v1';
const readGuest = () => {
  try { return localStorage.getItem(GUEST_KEY) === '1'; } catch { return false; }
};
/** True while the visitor is browsing as a guest (no account, no cloud sync, no C++ judge). */
export const guestMode = () => authEnabled && readGuest();

export function continueAsGuest() {
  try { localStorage.setItem(GUEST_KEY, '1'); } catch { /* storage unavailable: the choice lasts until reload */ }
  window.location.reload();
}

/** Leaves guest mode and shows the sign-in page (progress made as a guest stays in the browser and is adopted by the account). */
export function leaveGuest() {
  try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
  window.location.reload();
}

export async function signIn(provider: Provider) {
  try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
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
      if (!user) { current = null; setState(readGuest() ? { status: 'guest' } : { status: 'out' }); return; }
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
