// Utility to cleanup Supabase auth state from localStorage and sessionStorage
// Prevents limbo states when switching accounts or after failed auth attempts
export const cleanupAuthState = () => {
  try {
    // Remove known Supabase auth keys
    try { localStorage.removeItem('supabase.auth.token'); } catch {}

    // Remove all Supabase keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        try { localStorage.removeItem(key); } catch {}
      }
    });

    // Remove all Supabase keys from sessionStorage as well
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          try { sessionStorage.removeItem(key); } catch {}
        }
      });
    } catch {}
  } catch (e) {
    // Swallow errors to avoid blocking auth flows
    console.warn('cleanupAuthState encountered an error:', e);
  }
};
