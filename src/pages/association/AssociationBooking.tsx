import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Navigation } from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { checkSessionCapacity, reserveSeats } from '@/lib/capacity';
import { AlertCircle, Calendar, MapPin, Users, Clock } from 'lucide-react';

interface Spectacle {
  id: string;
  title: string;
  description: string;
  age_range_min: number;
  age_range_max: number;
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
  spectacles: { title: string };
}

export default function AssociationBooking() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [spectacles, setSpectacles] = useState<Spectacle[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSpectacleId, setSelectedSpectacleId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [kidsCount, setKidsCount] = useState(1);
  const [accompanistsCount, setAccompanistsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState('');

  const breadcrumbItems = [
    { label: 'Association', href: '/association' },
    { label: 'Nouvelle réservation', href: '/association/new-booking' }
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
    if (selectedSessionId && (kidsCount + accompanistsCount) > 0) {
      checkCapacity();
    }
  }, [selectedSessionId, kidsCount, accompanistsCount]);

  const fetchSpectacles = async () => {
    try {
      const { data, error } = await supabase
        .from('spectacles')
        .select('*')
        .eq('is_active', true)
        .not('age_range_min', 'is', null)
        .not('age_range_max', 'is', null);

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
          spectacles!inner(title)
        `)
        .eq('spectacle_id', selectedSpectacleId)
        .eq('is_active', true)
        .in('session_type', ['association', 'public'])
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

  const checkCapacity = async () => {
    try {
      const totalSeats = kidsCount + accompanistsCount;
      const result = await checkSessionCapacity(selectedSessionId, totalSeats);
      
      if (!result.canBook) {
        setCapacityWarning(`Capacité insuffisante. Seulement ${result.availableSeats} places disponibles.`);
      } else {
        setCapacityWarning('');
      }
    } catch (error) {
      console.error('Error checking capacity:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSessionId || !user || !profile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une session',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const totalSeats = kidsCount + accompanistsCount;
      
      // Reserve seats
      const booking = await reserveSeats(
        selectedSessionId,
        user.id,
        totalSeats,
        'association',
        profile.organization_id
      );

      // Generate tickets
      await generateTickets(booking.id, totalSeats);

      toast({
        title: 'Réservation confirmée',
        description: 'Vos billets avec codes QR ont été générés',
      });

      navigate('/association');
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

  const generateTickets = async (bookingId: string, ticketCount: number) => {
    // Generate QR tickets for association
    for (let i = 0; i < ticketCount; i++) {
      const qrCode = `EDJS-${bookingId}-${i + 1}-${Date.now()}`;
      
      await supabase
        .from('tickets')
        .insert({
          booking_id: bookingId,
          qr_code: qrCode,
          ticket_number: `${bookingId.slice(0, 8)}-${String(i + 1).padStart(3, '0')}`,
          status: 'active',
          association_name: profile?.name
        });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <Breadcrumbs />
        
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nouvelle réservation - Association
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="spectacle">Spectacle</Label>
                  <Select value={selectedSpectacleId} onValueChange={setSelectedSpectacleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un spectacle" />
                    </SelectTrigger>
                    <SelectContent>
                      {spectacles.map((spectacle) => (
                        <SelectItem key={spectacle.id} value={spectacle.id}>
                          {spectacle.title} (Ages {spectacle.age_range_min}-{spectacle.age_range_max})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSpectacleId && (
                  <div>
                    <Label htmlFor="session">Session</Label>
                    <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {session.session_date} à {session.session_time}
                              <MapPin className="h-4 w-4 ml-2" />
                              {session.venue}, {session.city}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kids">Nombre d'enfants</Label>
                    <Input
                      id="kids"
                      type="number"
                      min="1"
                      value={kidsCount}
                      onChange={(e) => setKidsCount(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accompanists">Accompagnateurs (max 5)</Label>
                    <Input
                      id="accompanists"
                      type="number"
                      min="0"
                      max="5"
                      value={accompanistsCount}
                      onChange={(e) => setAccompanistsCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {capacityWarning && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{capacityWarning}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !!capacityWarning || !selectedSessionId}
                >
                  {loading ? 'Réservation en cours...' : 'Confirmer la réservation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}