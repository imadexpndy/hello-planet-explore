import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Navigation } from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Clock, Users, Euro, Armchair } from 'lucide-react';

interface Spectacle {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: number;
}

interface Session {
  id: string;
  spectacle_id: string;
  city: string;
  venue: string;
  session_date: string;
  session_time: string;
  total_capacity: number;
  b2c_capacity: number;
  price_mad: number;
  spectacles: { title: string; description: string };
}

interface SeatMap {
  [key: number]: 'available' | 'booked' | 'selected';
}

export default function B2CBooking() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [spectacles, setSpectacles] = useState<Spectacle[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSpectacleId, setSelectedSpectacleId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [seatMap, setSeatMap] = useState<SeatMap>({});
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);

  const breadcrumbItems = [
    { label: 'Accueil', href: '/b2c' },
    { label: 'Réservation', href: '/b2c/booking' }
  ];

  useEffect(() => {
    fetchSpectacles();
  }, []);

  useEffect(() => {
    if (selectedSpectacleId) {
      fetchSessions();
    } else {
      setSessions([]);
      setSelectedSessionId('');
    }
  }, [selectedSpectacleId]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchBookedSeats();
    }
  }, [selectedSessionId]);

  const fetchSpectacles = async () => {
    try {
      const { data, error } = await supabase
        .from('spectacles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setSpectacles(data || []);
    } catch (error) {
      console.error('Error fetching spectacles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les spectacles',
        variant: 'destructive',
      });
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          spectacles!inner(title, description)
        `)
        .eq('spectacle_id', selectedSpectacleId)
        .eq('is_active', true)
        .eq('session_type', 'b2c')
        .gte('session_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sessions',
        variant: 'destructive',
      });
    }
  };

  const fetchBookedSeats = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('seat_number')
        .eq('booking_id', selectedSessionId)
        .eq('status', 'active')
        .not('seat_number', 'is', null);

      if (error) throw error;
      
      const booked = (data || [])
        .map(ticket => parseInt(ticket.seat_number || '0'))
        .filter(seat => seat > 0);
      
      setBookedSeats(booked);
      
      // Initialize seat map
      const session = sessions.find(s => s.id === selectedSessionId);
      if (session) {
        const map: SeatMap = {};
        for (let i = 1; i <= session.b2c_capacity; i++) {
          map[i] = booked.includes(i) ? 'booked' : 'available';
        }
        setSeatMap(map);
      }
    } catch (error) {
      console.error('Error fetching booked seats:', error);
    }
  };

  const toggleSeat = (seatNumber: number) => {
    if (seatMap[seatNumber] === 'booked') return;
    
    const newSeatMap = { ...seatMap };
    const newSelectedSeats = [...selectedSeats];
    
    if (seatMap[seatNumber] === 'selected') {
      newSeatMap[seatNumber] = 'available';
      const index = newSelectedSeats.indexOf(seatNumber);
      if (index > -1) newSelectedSeats.splice(index, 1);
    } else {
      newSeatMap[seatNumber] = 'selected';
      newSelectedSeats.push(seatNumber);
    }
    
    setSeatMap(newSeatMap);
    setSelectedSeats(newSelectedSeats);
  };

  const getSeatColor = (seatNumber: number) => {
    switch (seatMap[seatNumber]) {
      case 'booked': return 'bg-destructive';
      case 'selected': return 'bg-primary';
      default: return 'bg-secondary hover:bg-secondary/80';
    }
  };

  const handleSubmit = async () => {
    if (!selectedSessionId || !user || selectedSeats.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins une place',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          session_id: selectedSessionId,
          user_id: user.id,
          booking_type: 'b2c',
          number_of_tickets: selectedSeats.length,
          status: 'pending',
          payment_status: 'pending',
          total_amount: selectedSeats.length * (sessions.find(s => s.id === selectedSessionId)?.price_mad || 80)
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Generate tickets with seat assignments
      for (let i = 0; i < selectedSeats.length; i++) {
        const seatNumber = selectedSeats[i];
        const qrCode = `B2C-${booking.id}-${seatNumber}-${Date.now()}`;
        
        await supabase
          .from('tickets')
          .insert({
            booking_id: booking.id,
            qr_code: qrCode,
            ticket_number: `${booking.id.slice(0, 8)}-${String(seatNumber).padStart(3, '0')}`,
            seat_number: seatNumber.toString(),
            status: 'active',
            holder_name: profile?.name || `${profile?.first_name} ${profile?.last_name}`.trim()
          });
      }

      toast({
        title: 'Réservation créée',
        description: 'Vos billets ont été générés. Procédez au paiement.',
      });

      navigate('/b2c');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la réservation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSeatMap = () => {
    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return null;

    const rows = Math.ceil(session.b2c_capacity / 10);
    const seatGrid = [];

    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < 10; col++) {
        const seatNumber = row * 10 + col + 1;
        if (seatNumber <= session.b2c_capacity) {
          rowSeats.push(
            <button
              key={seatNumber}
              type="button"
              onClick={() => toggleSeat(seatNumber)}
              className={`w-8 h-8 m-1 rounded text-xs font-medium transition-colors ${getSeatColor(seatNumber)} ${
                seatMap[seatNumber] === 'booked' ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              disabled={seatMap[seatNumber] === 'booked'}
            >
              {seatNumber}
            </button>
          );
        }
      }
      seatGrid.push(
        <div key={row} className="flex justify-center">
          {rowSeats}
        </div>
      );
    }

    return seatGrid;
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const totalPrice = selectedSeats.length * (selectedSession?.price_mad || 80);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <Breadcrumbs />
        
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Armchair className="h-5 w-5" />
                Réservation B2C
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Spectacle</label>
                <Select value={selectedSpectacleId} onValueChange={setSelectedSpectacleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un spectacle" />
                  </SelectTrigger>
                  <SelectContent>
                    {spectacles.map((spectacle) => (
                      <SelectItem key={spectacle.id} value={spectacle.id}>
                        <div>
                          <div className="font-medium">{spectacle.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {spectacle.duration_minutes} min
                            <Euro className="h-3 w-3 ml-2" />
                            {spectacle.price} MAD
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSpectacleId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Session</label>
                  <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {session.session_date} à {session.session_time}
                              <MapPin className="h-4 w-4 ml-2" />
                              {session.venue}, {session.city}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {session.b2c_capacity} places B2C disponibles
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedSessionId && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Plan de salle</CardTitle>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-secondary rounded"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span>Sélectionné</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-destructive rounded"></div>
                    <span>Occupé</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center text-sm font-medium mb-4">SCÈNE</div>
                  {renderSeatMap()}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSeats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Places sélectionnées:</span>
                    <div className="flex gap-1">
                      {selectedSeats.map(seat => (
                        <Badge key={seat} variant="secondary">{seat}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Nombre de billets:</span>
                    <span>{selectedSeats.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prix unitaire:</span>
                    <span>{selectedSession?.price_mad || 80} MAD</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{totalPrice} MAD</span>
                  </div>
                  <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                    {loading ? 'Réservation en cours...' : 'Confirmer la réservation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}