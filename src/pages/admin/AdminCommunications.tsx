import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Mail, Send, MessageSquare, Filter } from 'lucide-react';

export default function AdminCommunications() {
  const { hasNotificationPermission } = useAuth();
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [emailForm, setEmailForm] = useState({
    recipient: '',
    subject: '',
    content: '',
    type: 'email'
  });

  useEffect(() => {
    document.title = "Communications | EDJS";
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
      toast.error('Erreur lors du chargement des communications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailForm
      });

      if (error) throw error;

      toast.success('Email envoyé avec succès!');
      setEmailDialogOpen(false);
      setEmailForm({
        recipient: '',
        subject: '',
        content: '',
        type: 'email'
      });
      fetchCommunications();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Envoyé</Badge>;
      case 'delivered':
        return <Badge variant="default">Livré</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'email':
        return <Badge variant="outline">Email</Badge>;
      case 'sms':
        return <Badge variant="outline">SMS</Badge>;
      case 'push':
        return <Badge variant="outline">Push</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredCommunications = communications.filter((comm: any) => {
    const statusMatch = filterStatus === 'all' || comm.status === filterStatus;
    const typeMatch = filterType === 'all' || comm.type === filterType;
    return statusMatch && typeMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const headerActions = hasNotificationPermission ? (
    <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Nouvel Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer un email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">Destinataire</Label>
            <Input
              id="recipient"
              type="email"
              value={emailForm.recipient}
              onChange={(e) => setEmailForm({...emailForm, recipient: e.target.value})}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
              placeholder="Objet de l'email"
            />
          </div>
          <div>
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={emailForm.content}
              onChange={(e) => setEmailForm({...emailForm, content: e.target.value})}
              placeholder="Contenu de votre message..."
              rows={6}
            />
          </div>
          <Button onClick={handleSendEmail} className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Envoyer l'email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <DashboardLayout 
      title="Communications"
      subtitle="Envoyez des emails et gérez les communications"
      headerActions={headerActions}
    >

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="failed">Échec</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Historique des communications ({filteredCommunications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Envoyé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommunications.map((comm: any) => (
                <TableRow key={comm.id}>
                  <TableCell>{getTypeBadge(comm.type)}</TableCell>
                  <TableCell>{comm.recipient}</TableCell>
                  <TableCell className="max-w-xs truncate">{comm.subject || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(comm.status)}</TableCell>
                  <TableCell>
                    {comm.sent_at 
                      ? new Date(comm.sent_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCommunications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune communication trouvée avec les filtres actuels
            </div>
          )}
        </CardContent>
        </Card>
    </DashboardLayout>
  );
}