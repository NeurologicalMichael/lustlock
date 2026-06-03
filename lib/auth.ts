import { supabase } from './supabase';
import { identifyUser } from './purchases';

export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;

  // Profile row is created by the handle_new_user trigger.
  // Update it with the username from onboarding:
  if (data.user) {
    await supabase.from('profiles').update({ username }).eq('id', data.user.id);
    await identifyUser(data.user.id);
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user) await identifyUser(data.user.id);
  return data;
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function deleteCurrentAccount() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return { deleted: false, reason: 'no-session' as const };

  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;

  await supabase.auth.signOut();
  return { deleted: true as const };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updateProfile(userId: string, updates: {
  username?: string;
  tagline?: string;
  covenant_scripture?: string;
  fighting_for?: string[];
  quiz_answers?: Record<string, number>;
  is_pro?: boolean;
}) {
  return supabase.from('profiles').update(updates).eq('id', userId);
}

export async function syncStreak(userId: string, battlefieldKey: string, data: {
  streak_start: string | null;
  streak_days: number;
  longest_streak: number;
  paused: boolean;
}) {
  return supabase.from('streaks').upsert(
    { user_id: userId, battlefield_key: battlefieldKey, ...data },
    { onConflict: 'user_id,battlefield_key' }
  );
}

export async function logRelapseToDb(userId: string, battlefieldKey: string, hour: number, triggers: string[]) {
  return supabase.from('relapses').insert({
    user_id: userId,
    battlefield_key: battlefieldKey,
    hour_of_day: hour,
    triggers,
  });
}
