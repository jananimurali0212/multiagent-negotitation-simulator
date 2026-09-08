/**
 * Local Backend Auth Shim
 *
 * This module replaces the Supabase client with a lightweight shim that routes
 * all auth calls to the local FastAPI backend (/api/v1/auth/*).
 * This allows the app to run fully locally without needing a Supabase project.
 */

const API_BASE = '/api/v1';

const TOKEN_KEY = 'local_auth_token';
const USER_KEY = 'local_auth_user';

function saveSession(token: string, user: { email: string; id: string }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    return { access_token: token, user };
  } catch {
    return null;
  }
}

// Auth state change listeners
type AuthChangeCallback = (event: string, session: any) => void;
const listeners: AuthChangeCallback[] = [];

function notifyListeners(event: string, session: any) {
  listeners.forEach((cb) => cb(event, session));
}

export const supabase = {
  auth: {
    /** Sign in with email/password via local backend */
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.detail || 'Login failed', status: res.status } };
        }
        const session = { access_token: data.access_token, user: { email: data.user.email, id: data.user.id } };
        saveSession(data.access_token, session.user);
        notifyListeners('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message || 'Network error', status: 503 } };
      }
    },

    /** Sign up via local backend */
    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: options?.data?.full_name || '' }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.detail || 'Signup failed', status: res.status } };
        }
        // If backend returned a token, auto-login
        if (data.access_token) {
          const session = { access_token: data.access_token, user: { email: data.user.email, id: data.user.id } };
          saveSession(data.access_token, session.user);
          notifyListeners('SIGNED_IN', session);
          return { data: { user: session.user, session }, error: null };
        }
        // Email confirmation required
        return { data: { user: { email }, session: null }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message || 'Network error', status: 503 } };
      }
    },

    /** Sign out */
    signOut: async () => {
      clearSession();
      notifyListeners('SIGNED_OUT', null);
      return { error: null };
    },

    /** Get current persisted session */
    getSession: async () => {
      const session = loadSession();
      return { data: { session }, error: null };
    },

    /** Reset password for email */
    resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
      try {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, redirect_to: options?.redirectTo }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { data: null, error: { message: data.detail || 'Password reset request failed', status: res.status } };
        }
        return { data: {}, error: null };
      } catch (err: any) {
        return { data: {}, error: null }; // Graceful fallback
      }
    },

    /** Update user password or metadata */
    updateUser: async ({ password, data: userData }: { password?: string; data?: any }) => {
      try {
        const session = loadSession();
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ password, user_data: userData }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { data: { user: null }, error: { message: data.detail || 'Update failed', status: res.status } };
        }
        return { data: { user: session?.user || null }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: null }; // Graceful fallback
      }
    },

    /** Subscribe to auth state changes */
    onAuthStateChange: (callback: AuthChangeCallback) => {
      listeners.push(callback);
      // Immediately fire with current state
      const session = loadSession();
      if (session) {
        setTimeout(() => callback('SIGNED_IN', session), 0);
      } else {
        setTimeout(() => callback('SIGNED_OUT', null), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const idx = listeners.indexOf(callback);
              if (idx !== -1) listeners.splice(idx, 1);
            },
          },
        },
      };
    },
  },
};
