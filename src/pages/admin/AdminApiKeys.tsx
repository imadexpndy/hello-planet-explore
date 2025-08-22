import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
}

export default function AdminApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les clés API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      if (!newKeyName.trim()) {
        toast({
          title: "Erreur",
          description: "Le nom de la clé est requis",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-api-key', {
        body: {
          name: newKeyName.trim(),
          expires_at: newKeyExpiry || null
        }
      });

      if (error) throw error;

      setGeneratedKey(data.api_key);
      setShowGeneratedKey(true);
      setNewKeyName('');
      setNewKeyExpiry('');
      setShowCreateDialog(false);
      
      toast({
        title: "Clé API générée",
        description: "Copiez la clé maintenant, elle ne sera plus visible",
      });

      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer la clé API",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Clé API copiée dans le presse-papiers",
    });
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: "Clé supprimée",
        description: "La clé API a été supprimée avec succès",
      });

      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la clé API",
        variant: "destructive"
      });
    }
  };

  const getKeyStatus = (key: ApiKey) => {
    if (!key.is_active) return { label: 'Désactivée', variant: 'secondary' as const };
    if (key.expires_at && new Date(key.expires_at) < new Date()) return { label: 'Expirée', variant: 'destructive' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <DashboardLayout 
      title="Gestion des clés API"
      subtitle="Générez et gérez les clés API pour l'accès mobile et l'intégration"
    >
      <div className="space-y-6">
        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">À propos des clés API</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Les clés API permettent aux applications mobiles et externes d'accéder à votre plateforme</p>
              <p>• Chaque clé a un accès complet aux données (spectacles, sessions, réservations, utilisateurs)</p>
              <p>• Les clés ne sont affichées qu'une seule fois lors de la génération</p>
              <p>• URL de base pour les appels API: <code className="bg-primary/10 px-1 rounded">https://aioldzmwwhukzabrizkt.supabase.co/functions/v1/api-proxy/</code></p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Clés API actives</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Générer une nouvelle clé
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Générer une nouvelle clé API</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Nom de la clé</Label>
                  <Input
                    id="keyName"
                    placeholder="Ex: Application Mobile, Intégration Partenaire"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyExpiry">Date d'expiration (optionnel)</Label>
                  <Input
                    id="keyExpiry"
                    type="datetime-local"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={generateApiKey}>
                  Générer la clé
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Generated Key Display */}
        {generatedKey && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Nouvelle clé API générée
              </CardTitle>
              <CardDescription className="text-green-700">
                Copiez cette clé maintenant. Elle ne sera plus jamais affichée.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-white rounded border">
                <code className="flex-1 font-mono text-sm break-all">
                  {showGeneratedKey ? generatedKey : '•'.repeat(50)}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowGeneratedKey(!showGeneratedKey)}
                >
                  {showGeneratedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(generatedKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => setGeneratedKey(null)}
              >
                J'ai copié la clé
              </Button>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : apiKeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune clé API</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Générez votre première clé API pour commencer à intégrer avec des applications externes.
                </p>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((key) => {
              const status = getKeyStatus(key);
              return (
                <Card key={key.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{key.name}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Préfixe: <code className="bg-muted px-1 rounded">{key.key_prefix}_***</code></p>
                          <p>Créée le {format(new Date(key.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                          {key.expires_at && (
                            <p>Expire le {format(new Date(key.expires_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                          )}
                          {key.last_used_at && (
                            <p>Dernière utilisation: {format(new Date(key.last_used_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteApiKey(key.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation de l'API</CardTitle>
            <CardDescription>
              Comment utiliser les clés API pour accéder aux données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">URL de base</h4>
              <code className="bg-muted p-2 rounded block text-sm">
                https://aioldzmwwhukzabrizkt.supabase.co/functions/v1/api-proxy/
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">En-têtes requis</h4>
              <code className="bg-muted p-2 rounded block text-sm">
                x-api-key: votre_clé_api_ici<br/>
                Content-Type: application/json
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Endpoints disponibles</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-medium text-green-600 mb-1">📱 Endpoints Mobile App (GET - Recevoir des données)</h5>
                  <div className="space-y-1 ml-4">
                    <p><code>GET /spectacles</code> - Liste des spectacles disponibles</p>
                    <p><code>GET /spectacles/{`{id}`}</code> - Détails d'un spectacle</p>
                    <p><code>GET /sessions</code> - Sessions disponibles</p>
                    <p><code>GET /sessions/{`{id}`}</code> - Détails d'une session</p>
                    <p><code>GET /users/{`{userId}`}</code> - Profil utilisateur</p>
                    <p><code>GET /bookings</code> - Réservations utilisateur</p>
                    <p><code>GET /bookings/{`{id}`}</code> - Détails d'une réservation</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-blue-600 mb-1">📱 Endpoints Mobile App (POST - Envoyer des données)</h5>
                  <div className="space-y-1 ml-4">
                    <p><code>POST /bookings</code> - Créer une réservation</p>
                    <p><code>POST /users</code> - Inscription/mise à jour profil</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-orange-600 mb-1">🖥️ Endpoints Platform Admin (POST - Contrôle total)</h5>
                  <div className="space-y-1 ml-4">
                    <p><code>POST /spectacles</code> - Créer des spectacles</p>
                    <p><code>POST /sessions</code> - Créer des sessions</p>
                    <p><code>POST /notifications</code> - Envoyer des notifications</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}