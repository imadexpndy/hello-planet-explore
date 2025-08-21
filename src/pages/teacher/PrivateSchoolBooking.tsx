import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkSessionCapacity, reserveSeats } from '@/lib/capacity';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Calendar, MapPin, Users, AlertTriangle } from 'lucide-react';

interface Spectacle {
  id: string;
  title: string;
  description: string | null;
  level_range: string | null;
  price: number;
}

interface Session {
  id: string;
  spectacle_id: string;
  session_date: string;
  session_time: string;
  venue: string;
  city: string | null;
  total_capacity: number;
  spectacles: {
    title: string;
    price: number;
  };
}

export default function PrivateSchoolBooking() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [spectacles, setSpectacles] = useState<Spectacle[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSpectacle, setSelectedSpectacle] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [accompanistCount, setAccompanistCount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<any>(null);

  useEffect(() => {
    fetchSpectacles();
  }, []);

  useEffect(() => {
    if (selectedSpectacle) {
      fetchSessions(selectedSpectacle);
    } else {
      setSessions([]);
      setSelectedSession('');
    }
  }, [selectedSpectacle]);

  useEffect(() => {
    checkCapacity();
  }, [selectedSession, studentCount, accompanistCount]);

  const fetchSpectacles = async () => {
    try {
      const { data, error } = await supabase
        .from('spectacles')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setSpectacles(data || []);
    } catch (error) {
      console.error('Error fetching spectacles:', error);
    }
  };

  const fetchSessions = async (spectacleId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          spectacles (title, price)
        `)
        .eq('spectacle_id', spectacleId)
        .eq('session_type', 'private')
        .eq('status', 'published')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date');

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const checkCapacity = async () => {
    if (!selectedSession || !studentCount) {
      setCapacityWarning(null);
      return;
    }

    const totalSeats = parseInt(studentCount) + parseInt(accompanistCount || '0');
    if (totalSeats <= 0) return;

    try {
      const capacityCheck = await checkSessionCapacity(selectedSession, totalSeats);
      
      if (!capacityCheck.canBook) {
        setCapacityWarning(capacityCheck);
      } else {
        setCapacityWarning(null);
      }
    } catch (error) {
      console.error('Error checking capacity:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedSession || !studentCount) return;

    const totalSeats = parseInt(studentCount) + parseInt(accompanistCount || '0');
    
    setLoading(true);
    try {
      // Reserve seats and create booking
      const booking = await reserveSeats(
        selectedSession,
        user.id,
        totalSeats,
        'private_school',
        profile?.organization_id || undefined
      );

      toast({
        title: "Réservation créée",
        description: `Votre demande de réservation pour ${totalSeats} places a été créée. Un devis vous sera envoyé sous peu.`,
      });

      // Reset form
      setSelectedSpectacle('');
      setSelectedSession('');
      setStudentCount('');
      setAccompanistCount('0');
      setCapacityWarning(null);
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'teacher_private') {
    return <div>Accès réservé aux enseignants d'écoles privées</div>;
  }

  const selectedSessionData = sessions.find(s => s.id === selectedSession);
  const totalRequestedSeats = parseInt(studentCount || '0') + parseInt(accompanistCount || '0');

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 p-6">
        <Breadcrumbs />
        
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Nouvelle Réservation</h1>
            <p className="text-muted-foreground">
              Réserver des places pour votre école privée
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Détails de la réservation</CardTitle>
              <CardDescription>
                Sélectionnez un spectacle et une session pour votre école
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Spectacle Selection */}
                <div className="space-y-2">
                  <Label htmlFor="spectacle">Spectacle *</Label>
                  <Select value={selectedSpectacle} onValueChange={setSelectedSpectacle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un spectacle" />
                    </SelectTrigger>
                    <SelectContent>
                      {spectacles.map((spectacle) => (
                        <SelectItem key={spectacle.id} value={spectacle.id}>
                          <div>
                            <div className="font-medium">{spectacle.title}</div>
                            {spectacle.level_range && (
                              <div className="text-sm text-muted-foreground">
                                Niveaux: {spectacle.level_range}
                              </div>
                            )}
                            <div className="text-sm text-primary font-medium">
                              {spectacle.price} MAD HT par élève
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Session Selection */}
                {sessions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="session">Session *</Label>
                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(session.session_date).toLocaleDateString('fr-FR')} à {session.session_time}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {session.city && `${session.city}, `}{session.venue}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4" />
                                  Capacité: {session.total_capacity}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Attendee Counts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentCount">Nombre d'élèves *</Label>
                    <Input
                      id="studentCount"
                      type="number"
                      min="1"
                      value={studentCount}
                      onChange={(e) => setStudentCount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accompanistCount">Accompagnateurs (max 5)</Label>
                    <Input
                      id="accompanistCount"
                      type="number"
                      min="0"
                      max="5"
                      value={accompanistCount}
                      onChange={(e) => setAccompanistCount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Capacity Warning */}
                {capacityWarning && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Capacité insuffisante</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>
                          Vous demandez {totalRequestedSeats} places mais seulement {capacityWarning.availableSeats} sont disponibles.
                        </p>
                        {capacityWarning.alternativeSessions?.length > 0 && (
                          <div>
                            <p className="font-medium">Sessions alternatives disponibles:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {capacityWarning.alternativeSessions.map((alt: any) => (
                                <li key={alt.id}>
                                  {new Date(alt.date).toLocaleDateString('fr-FR')} à {alt.time} - 
                                  {alt.venue} ({alt.availableSeats} places disponibles)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Price Summary */}
                {selectedSessionData && studentCount && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Élèves ({studentCount})</span>
                          <span>{(parseInt(studentCount) * selectedSessionData.spectacles.price).toFixed(2)} MAD HT</span>
                        </div>
                        {parseInt(accompanistCount || '0') > 0 && (
                          <div className="flex justify-between">
                            <span>Accompagnateurs ({accompanistCount})</span>
                            <span>Gratuit</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span>{(parseInt(studentCount) * selectedSessionData.spectacles.price).toFixed(2)} MAD HT</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Un devis détaillé vous sera envoyé par email après validation
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !!capacityWarning}
                >
                  {loading ? 'Création...' : 'Créer la demande de réservation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}