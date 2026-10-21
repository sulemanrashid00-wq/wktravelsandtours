import { createClient } from '@/lib/supabase/client';

export async function signInWithEmail(email, password) {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase is not configured yet in environment variables.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmail(email, password, fullName, phone) {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase is not configured yet in environment variables.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOutUser() {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUserProfile() {
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile || { id: user.id, role: 'customer', full_name: user.email };
}

