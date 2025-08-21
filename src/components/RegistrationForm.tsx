import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, Building2, Users, GraduationCap, User } from 'lucide-react';

interface School {
  id: string;
  name: string;
  school_type: string;
  city: string;
  domain?: string;
}

interface RegistrationFormProps {
  onBack: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<string>('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    whatsapp: '',
    professionalEmail: '',
    schoolId: '',
    schoolType: '',
    newSchoolName: '',
    newSchoolICE: '',
    newSchoolAddress: '',
    newSchoolCity: '',
    associationName: '',
    associationICE: '',
    associationAddress: '',
    associationCity: '',
    contactPerson: '',
    requiresVerification: false
  });

  useEffect(() => {
    if (userType === 'teacher') {
      fetchSchools();
    }
  }, [userType]);

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .in('verification_status', ['approved', 'pending'])
      .order('name');

    if (error) {
      console.error('Error fetching schools:', error);
    } else {
      setSchools(data || []);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `verification/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Erreur d'upload",
          description: "Impossible d'uploader le fichier",
          variant: "destructive"
        });
      } else {
        uploadedUrls.push(filePath);
      }
    }

    setUploadedDocs(prev => [...prev, ...uploadedUrls]);
    setLoading(false);
  };

  const validateEmail = (email: string, schoolDomain?: string) => {
    if (!email.includes('@')) return false;
    if (schoolDomain && !email.endsWith(`@${schoolDomain}`)) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    // Email validation for teachers
    if (userType === 'teacher' && formData.schoolId !== 'other') {
      const selectedSchool = schools.find(s => s.id === formData.schoolId);
      if (selectedSchool?.domain && !validateEmail(formData.professionalEmail, selectedSchool.domain)) {
        toast({
          title: "Erreur",
          description: `L'email professionnel doit utiliser le domaine @${selectedSchool.domain}`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte");
      }

      // 2. Create school/association if needed
      let schoolId = formData.schoolId;
      let associationId = null;

      if (userType === 'teacher' && formData.schoolId === 'other') {
        const { data: newSchool, error: schoolError } = await supabase
          .from('schools')
          .insert({
            name: formData.newSchoolName,
            ice_number: formData.newSchoolICE,
            address: formData.newSchoolAddress,
            city: formData.newSchoolCity,
            school_type: formData.schoolType,
            verification_status: 'pending'
          })
          .select()
          .single();

        if (schoolError) throw schoolError;
        schoolId = newSchool.id;
      }

      if (userType === 'association') {
        const { data: newAssociation, error: associationError } = await supabase
          .from('associations')
          .insert({
            name: formData.associationName,
            ice_number: formData.associationICE,
            address: formData.associationAddress,
            city: formData.associationCity,
            contact_person: formData.contactPerson,
            verification_status: 'pending'
          })
          .select()
          .single();

        if (associationError) throw associationError;
        associationId = newAssociation.id;
      }

      // 3. Create profile with appropriate role
      let role: 'admin' | 'teacher_private' | 'teacher_public' | 'association' | 'partner' | 'b2c_user' | 'super_admin' = 'b2c_user';
      if (userType === 'teacher') {
        role = formData.schoolType === 'private' ? 'teacher_private' : 'teacher_public';
      } else if (userType === 'association') {
        role = 'association';
      }

      const verificationStatus = 
        userType === 'teacher' && formData.schoolType === 'public' ? 'pending' :
        userType === 'association' ? 'pending' :
        'approved';

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: role,
          full_name: formData.fullName,
          phone: formData.phone,
          whatsapp: formData.whatsapp || formData.phone,
          professional_email: formData.professionalEmail || formData.email,
          school_id: schoolId !== 'other' ? schoolId : null,
          association_id: associationId,
          verification_status: verificationStatus,
          verification_documents: uploadedDocs.length > 0 ? uploadedDocs : null,
          contact_person: userType === 'association' ? formData.contactPerson : null
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Inscription réussie",
        description: "Vérifiez votre email pour confirmer votre compte",
      });

      // Redirect based on verification status
      if (verificationStatus === 'pending') {
        toast({
          title: "En attente de vérification",
          description: "Votre compte sera activé après validation par un administrateur",
        });
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderUserTypeSelection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-colors hover:bg-accent ${userType === 'b2c' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setUserType('b2c')}
        >
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">Parent / Particulier</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Achat de billets pour famille
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-accent ${userType === 'teacher' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setUserType('teacher')}
        >
          <CardContent className="p-6 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">Enseignant</h3>
            <p className="text-sm text-muted-foreground mt-2">
              École publique ou privée
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-accent ${userType === 'association' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setUserType('association')}
        >
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">Association</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Organisation à but non lucratif
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors hover:bg-accent ${userType === 'partner' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setUserType('partner')}
        >
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">Partenaire</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Contactez l'administration
            </p>
          </CardContent>
        </Card>
      </div>

      {userType === 'partner' && (
        <Alert>
          <AlertDescription>
            Les comptes partenaires sont créés uniquement par l'administration. 
            Veuillez contacter l'équipe support pour plus d'informations.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button 
          onClick={() => setStep(2)} 
          disabled={!userType || userType === 'partner'}
        >
          Continuer
        </Button>
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="fullName">Nom complet *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password">Mot de passe *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
            required
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp (optionnel)</Label>
          <Input
            id="whatsapp"
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData(prev => ({...prev, whatsapp: e.target.value}))}
            placeholder="Par défaut: même que téléphone"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button 
          onClick={() => setStep(3)}
          disabled={!formData.email || !formData.fullName || !formData.password || !formData.phone}
        >
          Continuer
        </Button>
      </div>
    </div>
  );

  const renderSpecificInfo = () => {
    if (userType === 'b2c') {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Votre compte sera activé immédiatement après confirmation de l'email. 
              Vous pourrez acheter des billets directement.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </div>
        </div>
      );
    }

    if (userType === 'teacher') {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="schoolType">Type d'école *</Label>
            <Select value={formData.schoolType} onValueChange={(value) => setFormData(prev => ({...prev, schoolType: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type d'école" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">École publique</SelectItem>
                <SelectItem value="private">École privée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.schoolType && (
            <div>
              <Label htmlFor="school">École *</Label>
              <Select value={formData.schoolId} onValueChange={(value) => setFormData(prev => ({...prev, schoolId: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre école" />
                </SelectTrigger>
                <SelectContent>
                  {schools
                    .filter(school => school.school_type === formData.schoolType)
                    .map(school => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} - {school.city}
                      </SelectItem>
                    ))}
                  <SelectItem value="other">Autre (créer une nouvelle école)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.schoolId === 'other' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold">Nouvelle école</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newSchoolName">Nom de l'école *</Label>
                  <Input
                    id="newSchoolName"
                    value={formData.newSchoolName}
                    onChange={(e) => setFormData(prev => ({...prev, newSchoolName: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newSchoolICE">ICE</Label>
                  <Input
                    id="newSchoolICE"
                    value={formData.newSchoolICE}
                    onChange={(e) => setFormData(prev => ({...prev, newSchoolICE: e.target.value}))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="newSchoolAddress">Adresse</Label>
                <Input
                  id="newSchoolAddress"
                  value={formData.newSchoolAddress}
                  onChange={(e) => setFormData(prev => ({...prev, newSchoolAddress: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="newSchoolCity">Ville</Label>
                <Input
                  id="newSchoolCity"
                  value={formData.newSchoolCity}
                  onChange={(e) => setFormData(prev => ({...prev, newSchoolCity: e.target.value}))}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="professionalEmail">Email professionnel *</Label>
            <Input
              id="professionalEmail"
              type="email"
              value={formData.professionalEmail}
              onChange={(e) => setFormData(prev => ({...prev, professionalEmail: e.target.value}))}
              required
            />
            {formData.schoolId !== 'other' && schools.find(s => s.id === formData.schoolId)?.domain && (
              <p className="text-sm text-muted-foreground mt-1">
                Doit utiliser le domaine @{schools.find(s => s.id === formData.schoolId)?.domain}
              </p>
            )}
          </div>

          {formData.schoolType === 'public' && (
            <div>
              <Label htmlFor="documents">Documents de vérification *</Label>
              <Input
                id="documents"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Téléchargez vos documents officiels (carte professionnelle, attestation, etc.)
              </p>
              {uploadedDocs.length > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  {uploadedDocs.length} document(s) téléchargé(s)
                </p>
              )}
            </div>
          )}

          {formData.schoolType === 'public' && (
            <Alert>
              <AlertDescription>
                Les enseignants d'écoles publiques nécessitent une vérification manuelle. 
                Votre compte sera activé après validation par un administrateur.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.schoolType || !formData.professionalEmail}
            >
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </div>
        </div>
      );
    }

    if (userType === 'association') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="associationName">Nom de l'association *</Label>
              <Input
                id="associationName"
                value={formData.associationName}
                onChange={(e) => setFormData(prev => ({...prev, associationName: e.target.value}))}
                required
              />
            </div>
            <div>
              <Label htmlFor="associationICE">ICE / Numéro officiel</Label>
              <Input
                id="associationICE"
                value={formData.associationICE}
                onChange={(e) => setFormData(prev => ({...prev, associationICE: e.target.value}))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contactPerson">Personne de contact *</Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => setFormData(prev => ({...prev, contactPerson: e.target.value}))}
              required
            />
          </div>

          <div>
            <Label htmlFor="associationAddress">Adresse</Label>
            <Textarea
              id="associationAddress"
              value={formData.associationAddress}
              onChange={(e) => setFormData(prev => ({...prev, associationAddress: e.target.value}))}
            />
          </div>

          <div>
            <Label htmlFor="associationCity">Ville</Label>
            <Input
              id="associationCity"
              value={formData.associationCity}
              onChange={(e) => setFormData(prev => ({...prev, associationCity: e.target.value}))}
            />
          </div>

          <div>
            <Label htmlFor="documents">Documents requis *</Label>
            <Input
              id="documents"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Statuts, certificat officiel, etc.
            </p>
            {uploadedDocs.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {uploadedDocs.length} document(s) téléchargé(s)
              </p>
            )}
          </div>

          <Alert>
            <AlertDescription>
              Les associations nécessitent une validation administrative. 
              Votre compte sera activé après approbation.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.associationName || !formData.contactPerson || uploadedDocs.length === 0}
            >
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Type de compte";
      case 2: return "Informations personnelles";
      case 3: 
        if (userType === 'b2c') return "Finalisation";
        if (userType === 'teacher') return "Informations scolaires";
        if (userType === 'association') return "Informations association";
        return "Informations spécifiques";
      default: return "";
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{getStepTitle()}</CardTitle>
        <CardDescription>
          Étape {step} sur 3
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && renderUserTypeSelection()}
        {step === 2 && renderBasicInfo()}
        {step === 3 && renderSpecificInfo()}
      </CardContent>
    </Card>
  );
};