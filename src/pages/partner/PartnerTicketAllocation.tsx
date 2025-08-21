import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Users, Ticket, AlertCircle } from 'lucide-react';

interface Session {
  id: string;
  spectacle_id: string;
  city: string;
  venue: string;
  session_date: string;
  session_time: string;
  total_capacity: number;
  partner_quota: number;
  spectacles: { title: string };
}

interface PartnerAllocation {
  session_id: string;
  allocated_tickets: number;
}

export default function PartnerTicketAllocation() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [associationName, setAssociationName] = useState('');
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState<PartnerAllocation[]>([]);

  const breadcrumbItems = [
    { label: 'Partenaire', href: '/partner' },
    { label: 'Allocation de billets', href: '/partner/allocate-tickets' }
  ];

  useEffect(() => {
    fetchSessions();
    fetchAllocations();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          spectacles!inner(title)
        `)
        .eq('is_active', true)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date');

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

  const fetchAllocations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('session_id, number_of_tickets')
        .eq('user_id', user.id)
        .eq('booking_type', 'partner');

      if (error) throw error;
      
      const allocationsMap = (data || []).reduce((acc: Record<string, number>, booking) => {
        acc[booking.session_id] = (acc[booking.session_id] || 0) + booking.number_of_tickets;
        return acc;
      }, {});

      const allocationsArray = Object.entries(allocationsMap).map(([sessionId, tickets]) => ({
        session_id: sessionId,
        allocated_tickets: tickets
      }));

      setAllocations(allocationsArray);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const getUsedQuota = (sessionId: string) => {
    const allocation = allocations.find(a => a.session_id === sessionId);
    return allocation?.allocated_tickets || 0;
  };

  const getRemainingQuota = (sessionId: string, quota: number) => {
    return quota - getUsedQuota(sessionId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSessionId || !associationName || !user || !profile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return;

    const remainingQuota = getRemainingQuota(selectedSessionId, session.partner_quota);
    
    if (ticketCount > remainingQuota) {
      toast({
        title: 'Quota dépassé',
        description: `Vous ne pouvez allouer que ${remainingQuota} billets maximum`,
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
          organization_id: profile.organization_id,
          booking_type: 'partner',
          number_of_tickets: ticketCount,
          status: 'confirmed',
          payment_status: 'completed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Generate tickets
      for (let i = 0; i < ticketCount; i++) {
        const qrCode = `PARTNER-${booking.id}-${i + 1}-${Date.now()}`;
        
        await supabase
          .from('tickets')
          .insert({
            booking_id: booking.id,
            qr_code: qrCode,
            ticket_number: `${booking.id.slice(0, 8)}-${String(i + 1).padStart(3, '0')}`,
            status: 'active',
            partner_name: profile.name,
            association_name: associationName
          });
      }

      toast({
        title: 'Allocation réussie',
        description: `${ticketCount} billets alloués à ${associationName}`,
      });

      // Reset form
      setSelectedSessionId('');
      setAssociationName('');
      setTicketCount(1);
      
      // Refresh allocations
      fetchAllocations();
    } catch (error: any) {
      console.error('Error allocating tickets:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'allocation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <Breadcrumbs />
        
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Allocation de billets partenaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="session">Session</Label>
                  <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <span>{session.spectacles.title}</span>
                              <span className="text-sm text-muted-foreground">
                                {getRemainingQuota(session.id, session.partner_quota)}/{session.partner_quota} restants
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {session.session_date} à {session.session_time}
                              <MapPin className="h-3 w-3 ml-2" />
                              {session.venue}, {session.city}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSessionId && (
                  <div>
                    <Label>Quota utilisé</Label>
                    {(() => {
                      const session = sessions.find(s => s.id === selectedSessionId);
                      if (!session) return null;
                      
                      const used = getUsedQuota(selectedSessionId);
                      const total = session.partner_quota;
                      const percentage = (used / total) * 100;
                      
                      return (
                        <div className="space-y-2">
                          <Progress value={percentage} className="w-full" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{used} / {total} billets utilisés</span>
                            <span>{total - used} restants</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <Label htmlFor="association">Nom de l'association</Label>
                  <Input
                    id="association"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    placeholder="Entrez le nom de l'association"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tickets">Nombre de billets</Label>
                  <Input
                    id="tickets"
                    type="number"
                    min="1"
                    max={selectedSessionId ? getRemainingQuota(selectedSessionId, sessions.find(s => s.id === selectedSessionId)?.partner_quota || 0) : 50}
                    value={ticketCount}
                    onChange={(e) => setTicketCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                {selectedSessionId && getRemainingQuota(selectedSessionId, sessions.find(s => s.id === selectedSessionId)?.partner_quota || 0) === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Quota épuisé pour cette session
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !selectedSessionId || getRemainingQuota(selectedSessionId, sessions.find(s => s.id === selectedSessionId)?.partner_quota || 0) === 0}
                >
                  {loading ? 'Allocation en cours...' : 'Allouer les billets'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}