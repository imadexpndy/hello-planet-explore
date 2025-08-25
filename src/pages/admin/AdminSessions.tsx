import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, MapPin, Calendar, Users } from 'lucide-react';

interface Session {
  id: string;
  spectacle_id: string;
  city: string | null;
  venue: string;
  session_date: string;
  session_time: string;
  datetime: string | null;
  total_capacity: number;
  b2c_capacity: number;
  partner_quota: number;
  session_type: string;
  status: string;
  spectacles: {
    title: string;
  };
  bookings: {
    number_of_tickets: number;
  }[];
}

interface Spectacle {
  id: string;
  title: string;
}

export default function AdminSessions() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [spectacles, setSpectacles] = useState<Spectacle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    spectacle_id: '',
    city: '',
    venue: '',
    session_date: '',
    session_time: '',
    total_capacity: '',
    b2c_capacity: '',
    partner_quota: '50',
    session_type: 'b2c',
    status: 'draft',
  });

  useEffect(() => {
    fetchSessions();
    fetchSpectacles();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          spectacles (title),
          bookings (number_of_tickets)
        `)
        .order('session_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sessions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpectacles = async () => {
    try {
      const { data, error } = await supabase
        .from('spectacles')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setSpectacles(data || []);
    } catch (error) {
      console.error('Error fetching spectacles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = {
        spectacle_id: formData.spectacle_id,
        city: formData.city || null,
        venue: formData.venue,
        session_date: formData.session_date,
        session_time: formData.session_time,
        datetime: `${formData.session_date}T${formData.session_time}:00`,
        total_capacity: parseInt(formData.total_capacity),
        b2c_capacity: parseInt(formData.b2c_capacity),
        partner_quota: parseInt(formData.partner_quota),
        session_type: formData.session_type,
        status: formData.status,
      };

      let error;
      if (editingSession) {
        ({ error } = await supabase
          .from('sessions')
          .update(sessionData)
          .eq('id', editingSession.id));
      } else {
        ({ error } = await supabase
          .from('sessions')
          .insert([sessionData]));
      }

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Session ${editingSession ? 'modifiée' : 'créée'} avec succès.`,
      });

      resetForm();
      setIsDialogOpen(false);
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      spectacle_id: session.spectacle_id,
      city: session.city || '',
      venue: session.venue,
      session_date: session.session_date,
      session_time: session.session_time,
      total_capacity: session.total_capacity.toString(),
      b2c_capacity: session.b2c_capacity.toString(),
      partner_quota: session.partner_quota.toString(),
      session_type: session.session_type,
      status: session.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Session supprimée avec succès.",
      });

      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      spectacle_id: '',
      city: '',
      venue: '',
      session_date: '',
      session_time: '',
      total_capacity: '',
      b2c_capacity: '',
      partner_quota: '50',
      session_type: 'b2c',
      status: 'draft',
    });
    setEditingSession(null);
  };

  const getBookedSeats = (session: Session) => {
    return session.bookings?.reduce((total, booking) => total + booking.number_of_tickets, 0) || 0;
  };

  const getRemainingCapacity = (session: Session) => {
    return session.total_capacity - getBookedSeats(session);
  };

  const filteredSessions = sessions.filter(session =>
    session.spectacles.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return <div>Accès non autorisé</div>;
  }

  const headerActions = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSession ? 'Modifier' : 'Créer'} une Session
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de la session
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spectacle_id">Spectacle *</Label>
                    <Select
                      value={formData.spectacle_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, spectacle_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un spectacle" />
                      </SelectTrigger>
                      <SelectContent>
                        {spectacles.map((spectacle) => (
                          <SelectItem key={spectacle.id} value={spectacle.id}>
                            {spectacle.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="ex: Casablanca"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue">Lieu *</Label>
                      <Input
                        id="venue"
                        value={formData.venue}
                        onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                        required
                        placeholder="ex: Théâtre Mohammed V"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="session_date">Date *</Label>
                      <Input
                        id="session_date"
                        type="date"
                        value={formData.session_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session_time">Heure *</Label>
                      <Input
                        id="session_time"
                        type="time"
                        value={formData.session_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, session_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_capacity">Capacité totale *</Label>
                      <Input
                        id="total_capacity"
                        type="number"
                        min="1"
                        value={formData.total_capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, total_capacity: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b2c_capacity">Capacité B2C *</Label>
                      <Input
                        id="b2c_capacity"
                        type="number"
                        min="0"
                        value={formData.b2c_capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, b2c_capacity: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner_quota">Quota partenaires</Label>
                      <Input
                        id="partner_quota"
                        type="number"
                        min="0"
                        value={formData.partner_quota}
                        onChange={(e) => setFormData(prev => ({ ...prev, partner_quota: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="session_type">Type de session *</Label>
                      <Select
                        value={formData.session_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, session_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Privé (écoles privées)</SelectItem>
                          <SelectItem value="public">Public (écoles publiques)</SelectItem>
                          <SelectItem value="b2c">B2C (grand public)</SelectItem>
                          <SelectItem value="association">Associations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                          <SelectItem value="closed">Fermé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingSession ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
  );

  return (
    <DashboardLayout 
      title="Gestion des Sessions"
      subtitle="Créer et gérer les sessions de spectacles"
      headerActions={headerActions}
    >
      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spectacle</TableHead>
                  <TableHead>Date & Lieu</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacité</TableHead>
                  <TableHead>Réservé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const bookedSeats = getBookedSeats(session);
                  const remainingCapacity = getRemainingCapacity(session);
                  
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="font-medium">{session.spectacles.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(session.session_date).toLocaleDateString('fr-FR')} à {session.session_time}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.city && `${session.city}, `}{session.venue}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {session.session_type === 'private' && 'Privé'}
                          {session.session_type === 'public' && 'Public'}
                          {session.session_type === 'b2c' && 'B2C'}
                          {session.session_type === 'association' && 'Association'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Users className="h-3 w-3 mr-1" />
                          {session.total_capacity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {bookedSeats} / {session.total_capacity}
                          </div>
                          <div className={`text-xs ${remainingCapacity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {remainingCapacity > 0 ? `${remainingCapacity} restantes` : 'Complet'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          session.status === 'published' ? "default" : 
                          session.status === 'draft' ? "secondary" : "outline"
                        }>
                          {session.status === 'draft' && 'Brouillon'}
                          {session.status === 'published' && 'Publié'}
                          {session.status === 'closed' && 'Fermé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(session)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}