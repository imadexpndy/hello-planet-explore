import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminSetup: React.FC = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@theatreapp.com');
  const [password, setPassword] = useState('Admin123!');
  const [fullName, setFullName] = useState('Administrateur');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: { email, password, full_name: fullName },
        headers: { 'x-admin-setup-token': token }
      });
      if (error) throw error;
      toast({ title: 'Admin créé', description: 'Utilisateur admin créé avec succès. Vous pouvez vous connecter.' });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || 'Impossible de créer l\'admin', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    document.title = 'Admin Setup | EDJS';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Créer un administrateur</CardTitle>
          <CardDescription>Entrez les identifiants souhaités et le token de configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="token">Token de configuration</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Saisir le token fourni" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Création...' : 'Créer l\'admin'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
