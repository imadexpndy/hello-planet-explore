import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Users, Calendar, MapPin } from 'lucide-react';

interface Booking {
  id: string;
  booking_type: string;
  number_of_tickets: number;
  status: string;
  payment_status: string;
  created_at: string;
  students_count?: number;
  accompanists_count?: number;
  total_amount?: number;
  profiles: {
    name?: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  organizations: {
    name: string;
    type: string;
  } | null;
  sessions: {
    session_date: string;
    session_time: string;
    venue: string;
    city: string;
    spectacles: {
      title: string;
    };
  } | null;
}

export default function AdminBookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');


  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, typeFilter, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!left(name, email, first_name, last_name),
          organizations!left(name, type),
          sessions!left(
            session_date,
            session_time,
            venue,
            city,
            spectacles!left(title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as any);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réservations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.sessions?.spectacles?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.booking_type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: `Réservation ${newStatus === 'approved' ? 'approuvée' : 'rejetée'}`,
      });

      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Type',
      'Utilisateur',
      'Email',
      'Organisation',
      'Spectacle',
      'Session',
      'Lieu',
      'Billets',
      'Élèves',
      'Accompagnateurs',
      'Montant',
      'Statut',
      'Paiement',
      'Date création'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(booking => [
        booking.id,
        booking.booking_type,
        booking.profiles?.name || `${booking.profiles?.first_name || ''} ${booking.profiles?.last_name || ''}`.trim(),
        booking.profiles?.email || '',
        booking.organizations?.name || '',
        booking.sessions?.spectacles?.title || '',
        `${booking.sessions?.session_date || ''} ${booking.sessions?.session_time || ''}`,
        `${booking.sessions?.venue || ''}, ${booking.sessions?.city || ''}`,
        booking.number_of_tickets,
        booking.students_count || 0,
        booking.accompanists_count || 0,
        booking.total_amount || 0,
        booking.status,
        booking.payment_status,
        new Date(booking.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reservations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'awaiting_verification': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const headerActions = (
    <Button onClick={exportToCSV} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Exporter CSV
    </Button>
  );

  return (
    <DashboardLayout 
      title="Gestion des réservations"
      subtitle="Gérer toutes les réservations de la plateforme"
      headerActions={headerActions}
    >
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Réservations ({filteredBookings.length})
            </CardTitle>
            
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="teacher_private">École privée</SelectItem>
                  <SelectItem value="teacher_public">École publique</SelectItem>
                  <SelectItem value="association">Association</SelectItem>
                  <SelectItem value="partner">Partenaire</SelectItem>
                  <SelectItem value="b2c">B2C</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="awaiting_verification">Attente vérification</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Spectacle</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Billets</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.profiles?.name || `${booking.profiles?.first_name || ''} ${booking.profiles?.last_name || ''}`.trim() || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">{booking.profiles?.email || 'N/A'}</div>
                            {booking.organizations && (
                              <div className="text-sm text-muted-foreground">{booking.organizations.name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{booking.booking_type}</Badge>
                        </TableCell>
                        <TableCell>{booking.sessions?.spectacles?.title || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {booking.sessions?.session_date || 'N/A'} {booking.sessions?.session_time || ''}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {booking.sessions?.venue || 'N/A'}, {booking.sessions?.city || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{booking.number_of_tickets} billets</div>
                            {(booking.students_count || 0) > 0 && (
                              <div className="text-muted-foreground">
                                {booking.students_count} élèves, {booking.accompanists_count} accomp.
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.total_amount ? `${booking.total_amount} MAD` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge 
                              variant="secondary" 
                              className={`${getStatusColor(booking.status)} text-white`}
                            >
                              {booking.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {booking.payment_status}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.status === 'awaiting_verification' && (
                            <div className="space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'approved')}
                              >
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, 'rejected')}
                              >
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredBookings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune réservation trouvée
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}