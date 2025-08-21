import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RegistrationForm } from '@/components/RegistrationForm';
import { ConsentForm } from '@/components/ConsentForm';
import { LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'consent'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkUserConsent();
    }
  }, [user]);

  const checkUserConsent = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('privacy_accepted, terms_accepted')
      .eq('user_id', user.id)
      .single();

    if (profile && (!profile.privacy_accepted || !profile.terms_accepted)) {
      setNeedsConsent(true);
      setMode('consent');
    } else {
      redirectUser();
    }
  };

  const redirectUser = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, verification_status')
      .eq('user_id', user!.id)
      .single();

    if (profile) {
      if (profile.verification_status === 'pending') {
        toast({
          title: "Compte en attente",
          description: "Votre compte est en cours de vérification",
        });
        return;
      }

      switch (profile.role) {
        case 'admin':
        case 'super_admin':
          navigate('/admin');
          break;
        case 'teacher_private':
        case 'teacher_public':
          navigate('/teacher');
          break;
        case 'association':
          navigate('/association');
          break;
        case 'partner':
          navigate('/partner');
          break;
        case 'b2c_user':
          navigate('/b2c');
          break;
        default:
          navigate('/');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect",
            variant: "destructive"
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email non confirmé",
            description: "Veuillez vérifier votre email et cliquer sur le lien de confirmation",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erreur de connexion",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue !",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentComplete = () => {
    setNeedsConsent(false);
    redirectUser();
  };

  if (needsConsent && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <ConsentForm onConsentComplete={handleConsentComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className={`w-full ${mode === 'register' ? 'max-w-none' : 'max-w-md'}`}>
        {mode === 'login' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <CardDescription>
                Connectez-vous à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Pas encore de compte ?
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setMode('register')}
                  className="mt-2"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer un compte
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'register' && (
          <RegistrationForm onBack={() => setMode('login')} />
        )}
      </div>
    </div>
  );
};

export default Auth;