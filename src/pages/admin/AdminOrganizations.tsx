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
import { Building2, Plus, School, Users } from 'lucide-react';

export default function AdminOrganizations() {
  const { hasPartnerPermission, hasSchoolPermission } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '',
    type: 'company',
    contact_email: '',
    contact_phone: '',
    address: '',
    ice: '',
    max_free_tickets: 0
  });
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    school_type: 'public',
    domain: '',
    address: '',
    city: '',
    ice_number: ''
  });

  useEffect(() => {
    document.title = "Gestion des Organisations | EDJS";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgsRes, schoolsRes, assocsRes] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('associations').select('*').order('created_at', { ascending: false })
      ]);

      if (orgsRes.error) throw orgsRes.error;
      if (schoolsRes.error) throw schoolsRes.error;
      if (assocsRes.error) throw assocsRes.error;

      setOrganizations(orgsRes.data || []);
      setSchools(schoolsRes.data || []);
      setAssociations(assocsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      const { error } = await supabase
        .from('organizations')
        .insert([{
          ...orgForm,
          type: orgForm.type as "private_school" | "public_school" | "association" | "partner"
        }]);

      if (error) throw error;

      toast.success('Organisation créée avec succès!');
      setOrgDialogOpen(false);
      setOrgForm({
        name: '',
        type: 'company',
        contact_email: '',
        contact_phone: '',
        address: '',
        ice: '',
        max_free_tickets: 0
      });
      fetchData();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Erreur lors de la création de l\'organisation');
    }
  };

  const handleCreateSchool = async () => {
    try {
      const { error } = await supabase
        .from('schools')
        .insert([schoolForm]);

      if (error) throw error;

      toast.success('École créée avec succès!');
      setSchoolDialogOpen(false);
      setSchoolForm({
        name: '',
        school_type: 'public',
        domain: '',
        address: '',
        city: '',
        ice_number: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating school:', error);
      toast.error('Erreur lors de la création de l\'école');
    }
  };

  const updateVerificationStatus = async (table: 'organizations' | 'schools' | 'associations', id: string, status: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ verification_status: status })
        .eq('id', id);

      if (error) throw error;

      toast.success('Statut mis à jour avec succès');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return (
        <Badge variant={status ? 'default' : 'secondary'}>
          {status ? 'Vérifié' : 'Non vérifié'}
        </Badge>
      );
    }
    
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approuvé</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const headerActions = (
    <div className="flex gap-2">
      {hasPartnerPermission && (
        <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Organisation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle organisation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={orgForm.type} onValueChange={(value) => setOrgForm({...orgForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Entreprise</SelectItem>
                    <SelectItem value="ngo">ONG</SelectItem>
                    <SelectItem value="government">Gouvernement</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contact_email">Email de contact</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={orgForm.contact_email}
                  onChange={(e) => setOrgForm({...orgForm, contact_email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Téléphone</Label>
                <Input
                  id="contact_phone"
                  value={orgForm.contact_phone}
                  onChange={(e) => setOrgForm({...orgForm, contact_phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="ice">ICE</Label>
                <Input
                  id="ice"
                  value={orgForm.ice}
                  onChange={(e) => setOrgForm({...orgForm, ice: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="max_free_tickets">Billets gratuits max</Label>
                <Input
                  id="max_free_tickets"
                  type="number"
                  value={orgForm.max_free_tickets}
                  onChange={(e) => setOrgForm({...orgForm, max_free_tickets: parseInt(e.target.value) || 0})}
                />
              </div>
              <Button onClick={handleCreateOrganization} className="w-full">
                Créer l'organisation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {hasSchoolPermission && (
        <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle École
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle école</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="school_name">Nom de l'école</Label>
                <Input
                  id="school_name"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({...schoolForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="school_type">Type</Label>
                <Select value={schoolForm.school_type} onValueChange={(value) => setSchoolForm({...schoolForm, school_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Privé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="domain">Domaine email</Label>
                <Input
                  id="domain"
                  value={schoolForm.domain}
                  onChange={(e) => setSchoolForm({...schoolForm, domain: e.target.value})}
                  placeholder="example.edu"
                />
              </div>
              <div>
                <Label htmlFor="school_address">Adresse</Label>
                <Textarea
                  id="school_address"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({...schoolForm, address: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={schoolForm.city}
                  onChange={(e) => setSchoolForm({...schoolForm, city: e.target.value})}
                />
              </div>
              <Button onClick={handleCreateSchool} className="w-full">
                Créer l'école
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  return (
    <DashboardLayout 
      title="Gestion des Organisations"
      subtitle="Gérez les partenaires, écoles et associations"
      headerActions={headerActions}
    >

      {/* Organizations/Partners */}
      {hasPartnerPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisations & Partenaires ({organizations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org: any) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.type}</TableCell>
                    <TableCell>{org.contact_email}</TableCell>
                    <TableCell>{getStatusBadge(org.verification_status)}</TableCell>
                    <TableCell>
                      <Select 
                        value={org.verification_status} 
                        onValueChange={(value) => updateVerificationStatus('organizations', org.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Schools */}
      {hasSchoolPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Écoles ({schools.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school: any) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.school_type}</TableCell>
                    <TableCell>{school.city}</TableCell>
                    <TableCell>{getStatusBadge(school.verification_status)}</TableCell>
                    <TableCell>
                      <Select 
                        value={school.verification_status} 
                        onValueChange={(value) => updateVerificationStatus('schools', school.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Associations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Associations ({associations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {associations.map((assoc: any) => (
                <TableRow key={assoc.id}>
                  <TableCell className="font-medium">{assoc.name}</TableCell>
                  <TableCell>{assoc.city}</TableCell>
                  <TableCell>{assoc.contact_person}</TableCell>
                  <TableCell>{getStatusBadge(assoc.verification_status)}</TableCell>
                  <TableCell>
                    <Select 
                      value={assoc.verification_status} 
                      onValueChange={(value) => updateVerificationStatus('associations', assoc.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}