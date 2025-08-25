import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Users, UserPlus, Shield, Mail, Activity } from 'lucide-react';

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'admin_spectacles',
    invitedByName: ''
  });
  const [healthCheck, setHealthCheck] = useState(null);

  const roleLabels = {
    'admin_spectacles': 'Gestionnaire de Spectacles',
    'admin_schools': 'Gestionnaire d\'Écoles', 
    'admin_partners': 'Gestionnaire de Partenaires',
    'admin_support': 'Support',
    'admin_notifications': 'Gestionnaire de Notifications',
    'admin_editor': 'Éditeur',
    'admin_full': 'Administrateur Complet',
    'super_admin': 'Super Administrateur',
    'b2c_user': 'Utilisateur B2C',
    'teacher_private': 'Enseignant Privé',
    'teacher_public': 'Enseignant Public',
    'association': 'Association',
    'partner': 'Partenaire'
  };

  useEffect(() => {
    document.title = "Gestion des Utilisateurs | EDJS";
    fetchUsers();
    fetchInvitations();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-admin-invitation', {
        body: inviteForm
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(`Erreur: ${data.error}`);
        return;
      }

      if (data?.recoveryLink) {
        await navigator.clipboard.writeText(data.recoveryLink);
        toast.success("Utilisateur existant: lien de connexion copié dans le presse-papiers");
      } else {
        if (data?.inviteLink) {
          await navigator.clipboard.writeText(data.inviteLink);
          toast.success("Lien d'invitation copié dans le presse-papiers");
        } else {
          toast.success('Invitation envoyée avec succès!');
        }
      }

      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'admin_spectacles', invitedByName: '' });
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      const errorMessage = error?.message || 'Erreur lors de l\'envoi de l\'invitation';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-invitation', {
        body: { health: true }
      });

      if (error) throw error;

      setHealthCheck(data);
      const supaMode = data?.using === 'supabase-auth';
      const status = supaMode
        ? (data.canInvite ? 'success' : 'error')
        : (data.hasApiKey && data.fromLooksValid ? 'success' : 'error');
      const message = supaMode
        ? (data.canInvite ? 'Configuration email (Supabase) OK ✓' : 'Problème config: Supabase service role manquant')
        : (data.hasApiKey && data.fromLooksValid 
          ? 'Configuration email OK ✓' 
          : `Problème config: ${!data.hasApiKey ? 'API Key manquante' : ''} ${!data.fromLooksValid ? 'RESEND_FROM invalide' : ''}`);
      
      toast[status](message);
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Échec vérification configuration');
    }
  };

  const resendInvitation = async (email: string, role: string, name: string, token?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-admin-invitation', {
        body: {
          email,
          role,
          invitedByName: name || 'Admin',
          invitationToken: token
        }
      });

      if (data?.error) {
        toast.error(`Erreur: ${data.error}`);
      } else if (data?.recoveryLink) {
        await navigator.clipboard.writeText(data.recoveryLink);
        toast.success("Utilisateur existant: lien de connexion copié dans le presse-papiers");
      } else {
        toast.success('Invitation renvoyée avec succès!');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Erreur lors du renvoi de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const getBadgeVariant = (role: string) => {
    if (!role) return 'outline';
    if (role === 'super_admin') return 'destructive';
    if (role === 'admin_full') return 'default';
    if (role.startsWith('admin_')) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const headerActions = isSuperAdmin ? (
    <div className="flex gap-2">
      <Button variant="outline" onClick={runHealthCheck}>
        <Activity className="h-4 w-4 mr-2" />
        Vérifier Config Email
      </Button>
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inviter un Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un nouvel administrateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin_spectacles">Gestionnaire de Spectacles</SelectItem>
                        <SelectItem value="admin_schools">Gestionnaire d'Écoles</SelectItem>
                        <SelectItem value="admin_partners">Gestionnaire de Partenaires</SelectItem>
                        <SelectItem value="admin_support">Support</SelectItem>
                        <SelectItem value="admin_notifications">Gestionnaire de Notifications</SelectItem>
                        <SelectItem value="admin_editor">Éditeur</SelectItem>
                        <SelectItem value="admin_full">Administrateur Complet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="invitedByName">Votre nom (pour l'email)</Label>
                    <Input
                      id="invitedByName"
                      value={inviteForm.invitedByName}
                      onChange={(e) => setInviteForm({...inviteForm, invitedByName: e.target.value})}
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <Button onClick={handleSendInvitation} className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer l'invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
        </div>
  ) : null;

  return (
    <DashboardLayout 
      title="Gestion des Utilisateurs"
      subtitle="Gérez les utilisateurs et les administrateurs de la plateforme"
      headerActions={headerActions}
    >
      {/* Health Check Results */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Configuration Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthCheck?.using === 'supabase-auth' ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={healthCheck.canInvite ? 'default' : 'destructive'}>
                    {healthCheck.canInvite ? '✓' : '✗'} Supabase Auth actif
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={healthCheck.hasServiceRole ? 'default' : 'destructive'}>
                    {healthCheck.hasServiceRole ? '✓' : '✗'} Service Role
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={healthCheck.hasUrl ? 'default' : 'destructive'}>
                    {healthCheck.hasUrl ? '✓' : '✗'} Project URL
                  </Badge>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={healthCheck.hasApiKey ? 'default' : 'destructive'}>
                      {healthCheck.hasApiKey ? '✓' : '✗'} API Key
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={healthCheck.hasFrom ? 'default' : 'destructive'}>
                      {healthCheck.hasFrom ? '✓' : '✗'} RESEND_FROM
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={healthCheck.fromLooksValid ? 'default' : 'destructive'}>
                      {healthCheck.fromLooksValid ? '✓' : '✗'} Format Valide
                    </Badge>
                  </div>
                </div>
                {healthCheck.sanitizedFromPreview && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Adresse détectée: {healthCheck.sanitizedFromPreview}
                  </p>
                )}
                {healthCheck.notes && healthCheck.notes.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">Détails de validation</summary>
                    <ul className="text-xs text-muted-foreground mt-1 ml-4">
                      {healthCheck.notes.map((note, i) => (
                        <li key={i}>• {note}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}

          </CardContent>
        </Card>
      )}

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs Actifs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Créé le</TableHead>
                {isSuperAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || user.first_name + ' ' + user.last_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(user.admin_role)}>
                      {roleLabels[user.admin_role] || user.admin_role || 'Aucun rôle'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('fr-FR')}</TableCell>
                   {isSuperAdmin && (
                     <TableCell>
                       <Select 
                         value={user.admin_role || ''} 
                         onValueChange={(value) => updateUserRole(user.user_id, value)}
                       >
                         <SelectTrigger className="w-40">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {Object.entries(roleLabels).map(([value, label]) => (
                             <SelectItem key={value} value={value}>{label}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </TableCell>
                   )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Invitations en attente ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Envoyée le</TableHead>
                  <TableHead>Expire le</TableHead>
                  {isSuperAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation: any) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabels[invitation.role] || invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(invitation.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{new Date(invitation.expires_at).toLocaleDateString('fr-FR')}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvitation(invitation.email, invitation.role, 'Admin', invitation.invitation_token)}
                          disabled={loading}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Renvoyer
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}