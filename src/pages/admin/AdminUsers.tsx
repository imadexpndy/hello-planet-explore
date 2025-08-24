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
import { Users, UserPlus, Shield, Mail } from 'lucide-react';

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

      toast.success('Invitation envoyée avec succès!');
      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: 'admin_spectacles', invitedByName: '' });
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les utilisateurs et les administrateurs de la plateforme</p>
        </div>
        
        {isSuperAdmin && (
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
        )}
      </div>

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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}