import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Spectacle {
  id: string;
  title: string;
  description: string | null;
  level_range: string | null;
  age_range_min: number | null;
  age_range_max: number | null;
  duration_minutes: number | null;
  price: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminSpectacles() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [spectacles, setSpectacles] = useState<Spectacle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpectacle, setEditingSpectacle] = useState<Spectacle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level_range: '',
    age_range_min: '',
    age_range_max: '',
    duration_minutes: '',
    price: '80',
    is_active: true,
  });

  useEffect(() => {
    fetchSpectacles();
  }, []);

  const fetchSpectacles = async () => {
    try {
      const { data, error } = await supabase
        .from('spectacles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpectacles(data || []);
    } catch (error) {
      console.error('Error fetching spectacles:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les spectacles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const spectacleData = {
        title: formData.title,
        description: formData.description || null,
        level_range: formData.level_range || null,
        age_range_min: formData.age_range_min ? parseInt(formData.age_range_min) : null,
        age_range_max: formData.age_range_max ? parseInt(formData.age_range_max) : null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        price: parseFloat(formData.price),
        is_active: formData.is_active,
      };

      let error;
      if (editingSpectacle) {
        ({ error } = await supabase
          .from('spectacles')
          .update(spectacleData)
          .eq('id', editingSpectacle.id));
      } else {
        ({ error } = await supabase
          .from('spectacles')
          .insert([spectacleData]));
      }

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Spectacle ${editingSpectacle ? 'modifié' : 'créé'} avec succès.`,
      });

      resetForm();
      setIsDialogOpen(false);
      fetchSpectacles();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (spectacle: Spectacle) => {
    setEditingSpectacle(spectacle);
    setFormData({
      title: spectacle.title,
      description: spectacle.description || '',
      level_range: spectacle.level_range || '',
      age_range_min: spectacle.age_range_min?.toString() || '',
      age_range_max: spectacle.age_range_max?.toString() || '',
      duration_minutes: spectacle.duration_minutes?.toString() || '',
      price: spectacle.price.toString(),
      is_active: spectacle.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce spectacle ?')) return;

    try {
      const { error } = await supabase
        .from('spectacles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Spectacle supprimé avec succès.",
      });

      fetchSpectacles();
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
      title: '',
      description: '',
      level_range: '',
      age_range_min: '',
      age_range_max: '',
      duration_minutes: '',
      price: '80',
      is_active: true,
    });
    setEditingSpectacle(null);
  };

  const filteredSpectacles = spectacles.filter(spectacle =>
    spectacle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spectacle.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
                  Nouveau Spectacle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSpectacle ? 'Modifier' : 'Créer'} un Spectacle
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations du spectacle
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix (MAD HT) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="level_range">Niveaux Scolaires</Label>
                      <Input
                        id="level_range"
                        placeholder="ex: CP-CE2, 6ème-3ème"
                        value={formData.level_range}
                        onChange={(e) => setFormData(prev => ({ ...prev, level_range: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Durée (minutes)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age_range_min">Âge minimum</Label>
                      <Input
                        id="age_range_min"
                        type="number"
                        value={formData.age_range_min}
                        onChange={(e) => setFormData(prev => ({ ...prev, age_range_min: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age_range_max">Âge maximum</Label>
                      <Input
                        id="age_range_max"
                        type="number"
                        value={formData.age_range_max}
                        onChange={(e) => setFormData(prev => ({ ...prev, age_range_max: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    <Label htmlFor="is_active">Spectacle actif</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingSpectacle ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
  );

  return (
    <DashboardLayout 
      title="Gestion des Spectacles"
      subtitle="Créer et gérer les spectacles EDJS"
      headerActions={headerActions}
    >
      {/* Search */}
      <Card className="mb-6">
...
      </Card>
    </DashboardLayout>
  );
}