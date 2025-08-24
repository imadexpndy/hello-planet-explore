import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logUserLogin, logUserLogout } from '@/lib/audit';
import { cleanupAuthState } from '@/lib/authCleanup';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  role: 'admin_spectacles' | 'admin_schools' | 'admin_partners' | 'admin_support' | 'admin_notifications' | 'admin_editor' | 'admin_full' | 'super_admin' | 'teacher_private' | 'teacher_public' | 'association' | 'partner' | 'b2c_user';
  organization_id: string | null;
  is_verified: boolean;
  verification_status: string | null;
  professional_email: string | null;
  address: string | null;
  city: string | null;
  school_id: string | null;
  association_id: string | null;
  contact_person: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isTeacher: boolean;
  isAssociation: boolean;
  isPartner: boolean;
  isB2C: boolean;
  hasSpectaclePermission: boolean;
  hasSchoolPermission: boolean;
  hasPartnerPermission: boolean;
  hasSupportPermission: boolean;
  hasNotificationPermission: boolean;
  hasEditorPermission: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      // Ensure role exists, fallback to b2c_user if missing
      const profile = data ? {
        ...data,
        role: (data.admin_role || 'b2c_user') as Profile['role']
      } : null;
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then((profileData) => {
          setProfile(profileData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inscription réussie",
          description: "Vérifiez votre email pour confirmer votre compte.",
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

const signIn = async (email: string, password: string) => {
  try {
    // Clean up any stale auth state to prevent limbo
    cleanupAuthState();
    try {
      await supabase.auth.signOut({ scope: 'global' } as any);
    } catch {}

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      // Log successful login
      setTimeout(() => {
        logUserLogin(data.user!.id);
      }, 0);
    }

    return { error };
  } catch (error: any) {
    toast({
      title: "Erreur de connexion",
      description: error.message,
      variant: "destructive",
    });
    return { error };
  }
};

const signOut = async () => {
  try {
    // Log logout before signing out
    if (user) {
      await logUserLogout(user.id);
    }

    // Clean up local/session storage and attempt global sign out
    cleanupAuthState();
    try {
      await supabase.auth.signOut({ scope: 'global' } as any);
    } catch {}

    setUser(null);
    setSession(null);
    setProfile(null);

    // Force full reload to the auth page for a clean state
    window.location.href = '/auth';
  } catch (error: any) {
    toast({
      title: "Erreur de déconnexion",
      description: error.message,
      variant: "destructive",
    });
  }
};

  const isAdmin = profile?.role ? ['admin_full', 'super_admin', 'admin_spectacles', 'admin_schools', 'admin_partners', 'admin_support', 'admin_notifications', 'admin_editor'].includes(profile.role) : false;
  const isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'admin_full';
  const isTeacher = profile?.role === 'teacher_private' || profile?.role === 'teacher_public';
  const isAssociation = profile?.role === 'association';
  const isPartner = profile?.role === 'partner';
  const isB2C = profile?.role === 'b2c_user';
  
  const hasSpectaclePermission = profile?.role === 'super_admin' || profile?.role === 'admin_full' || profile?.role === 'admin_spectacles';
  const hasSchoolPermission = profile?.role === 'super_admin' || profile?.role === 'admin_full' || profile?.role === 'admin_schools';
  const hasPartnerPermission = profile?.role === 'super_admin' || profile?.role === 'admin_full' || profile?.role === 'admin_partners';
  const hasSupportPermission = profile?.role === 'super_admin' || profile?.role === 'admin_full' || profile?.role === 'admin_support';
  const hasNotificationPermission = profile?.role === 'super_admin' || profile?.role === 'admin_full' || profile?.role === 'admin_notifications';
  const hasEditorPermission = profile?.role === 'super_admin' || profile?.role === 'admin_full' || profile?.role === 'admin_editor';

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isSuperAdmin,
    isTeacher,
    isAssociation,
    isPartner,
    isB2C,
    hasSpectaclePermission,
    hasSchoolPermission,
    hasPartnerPermission,
    hasSupportPermission,
    hasNotificationPermission,
    hasEditorPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};