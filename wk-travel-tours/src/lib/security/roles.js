export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

const ADMIN_EMAILS = ['wktravelandtour@gmail.com', 'admin@wktravel.pk'];

/**
 * Verifies if user or session has verified admin privileges on the server side
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} [userId]
 * @param {any} [cookiesStore] Optional cookies store
 * @returns {Promise<boolean>}
 */
export async function verifyServerAdmin(supabase, userId, cookiesStore) {
  // 1. Check HTTP-only session cookie if cookiesStore provided
  if (cookiesStore) {
    try {
      const sessionRaw = typeof cookiesStore.get === 'function' ? cookiesStore.get('wk_auth_session')?.value : null;
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session.role === ROLES.ADMIN && ADMIN_EMAILS.includes(session.email?.toLowerCase())) {
          return true;
        }
      }
    } catch {
      // Fall through to database check
    }
  }

  // 2. Check Supabase profiles table
  if (!supabase || !userId) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.role === ROLES.ADMIN;
}

/**
 * Unified server-side authorization check for API routes and Server Actions.
 * Validates both Supabase authenticated user sessions and HTTP-only 4-digit Email OTP sessions.
 * Dynamically resolves cookies() at runtime to remain fully compatible with standalone test runners.
 * @param {import('@supabase/supabase-js').SupabaseClient} [supabase]
 * @param {any} [explicitCookieStore]
 * @returns {Promise<boolean>}
 */
export async function isAuthorizedAdmin(supabase, explicitCookieStore) {
  let cookieStore = explicitCookieStore;

  if (!cookieStore) {
    try {
      const nextHeaders = await import('next/headers');
      if (typeof nextHeaders.cookies === 'function') {
        cookieStore = await nextHeaders.cookies();
      }
    } catch {
      // Non-Next context (e.g. standalone Node.js test runner)
    }
  }

  if (cookieStore) {
    try {
      const sessionRaw = typeof cookieStore.get === 'function' ? cookieStore.get('wk_auth_session')?.value : null;
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session.role === ROLES.ADMIN && ADMIN_EMAILS.includes(session.email?.toLowerCase())) {
          return true;
        }
      }
    } catch {
      // Fall through to Supabase auth check
    }
  }

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return await verifyServerAdmin(supabase, user.id);
      }
    } catch {
      return false;
    }
  }

  return false;
}
