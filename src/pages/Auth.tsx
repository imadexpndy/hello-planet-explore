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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/8 via-primary/4 to-primary/12 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-primary-glow/10 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      
      {/* Logo at the top */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <img 
          src="/edjs-logo.png" 
          alt="L'École du Jeune Spectateur" 
          className="h-16 w-auto drop-shadow-lg"
        />
      </div>
      
      <div className={`w-full relative z-10 ${mode === 'register' ? 'max-w-none' : 'max-w-md'} ${mode === 'login' ? 'mt-20' : ''}`}>
        {mode === 'login' && (
          <Card className="backdrop-blur-xl bg-card/80 border-primary/20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/12 rounded-xl pointer-events-none" />
            
            <CardHeader className="text-center relative pb-8 pt-12">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center shadow-glow mb-4">
                  <LogIn className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-primary-glow bg-clip-text text-transparent">
                Connexion
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-3">
                Connectez-vous à votre espace personnel
              </CardDescription>
              <div className="w-16 h-1 bg-gradient-to-r from-primary to-primary-glow mx-auto rounded-full mt-4" />
            </CardHeader>
            
            <CardContent className="relative px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-background/60 border-2 border-muted focus:border-primary/50 focus:bg-background transition-all duration-300 rounded-lg"
                    placeholder="votre@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-background/60 border-2 border-muted focus:border-primary/50 focus:bg-background transition-all duration-300 rounded-lg"
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="glow"
                  size="xl"
                  className="w-full mt-8" 
                  disabled={loading}
                >
                  <LogIn className="mr-3 h-5 w-5" />
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card text-muted-foreground">Nouveau sur EDJS ?</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setMode('register')}
                  className="mt-6 w-full h-12 border-2 hover:border-primary/50 hover:bg-primary/5"
                >
                  <UserPlus className="mr-3 h-5 w-5" />
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