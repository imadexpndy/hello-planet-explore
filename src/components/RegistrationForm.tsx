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
import { ArrowLeft, Upload, Building2, Users, GraduationCap, User, CheckCircle, Sparkles } from 'lucide-react';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userCategory, setUserCategory] = useState<'b2c' | 'b2b' | ''>('');
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
    if (userType === 'teacher_private' || userType === 'teacher_public') {
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
      // Upload to verification/ prefix which allows anonymous uploads during registration
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
        toast({
          title: "Upload réussi",
          description: `Fichier ${file.name} uploadé avec succès`,
        });
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
    if ((userType === 'teacher_private' || userType === 'teacher_public') && formData.schoolId !== 'other') {
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

      if ((userType === 'teacher_private' || userType === 'teacher_public') && formData.schoolId === 'other') {
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
      if (userType === 'teacher_private' || userType === 'teacher_public') {
        role = userType as 'teacher_private' | 'teacher_public';
      } else if (userType === 'association') {
        role = 'association';
      }

      const verificationStatus = 
        userType === 'teacher_public' ? 'pending' :
        userType === 'association' ? 'pending' :
        'approved';

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
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

  const renderCategorySelection = () => (
    <div className="space-y-8">      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card 
          className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
            userCategory === 'b2c' 
              ? 'ring-2 ring-primary border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => {
            setUserCategory('b2c');
            setUserType('b2c');
          }}
        >
          <CardContent className="p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-foreground">Particulier</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Parents et familles souhaitant acheter des billets individuellement
              </p>
              
              <div className="bg-gradient-to-r from-accent/20 to-primary/10 rounded-xl p-4 border border-accent/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-sm font-semibold text-foreground">Accès immédiat</p>
                </div>
                <p className="text-xs text-muted-foreground">Inscription rapide, achat direct</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
            userCategory === 'b2b' 
              ? 'ring-2 ring-primary border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setUserCategory('b2b')}
        >
          <CardContent className="p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-foreground">Professionnel</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Enseignants, associations et organismes éducatifs
              </p>
              
              <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <p className="text-sm font-semibold text-foreground">Tarifs préférentiels</p>
                </div>
                <p className="text-xs text-muted-foreground">Validation requise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} className="px-8 py-3 hover:scale-105 transition-transform">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button 
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setStep(2);
              setIsTransitioning(false);
            }, 200);
          }} 
          disabled={!userCategory}
          className="px-8 py-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            Continuer
            <Sparkles className="h-4 w-4 animate-pulse" />
          </span>
        </Button>
      </div>
    </div>
  );

  const renderUserTypeSelection = () => (
    <div className="space-y-8">
      <div className="text-center mb-8 animate-fade-in">
        <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Précisez votre profil professionnel
        </h3>
        <p className="text-muted-foreground text-lg">Sélectionnez votre type d'organisation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            type: 'teacher_private',
            icon: GraduationCap,
            title: 'École Privée',
            description: 'Vérification par email du domaine',
            color: 'from-primary to-primary/80',
            delay: '0ms'
          },
          {
            type: 'teacher_public',
            icon: GraduationCap,
            title: 'École Publique',
            description: 'Documents officiels requis',
            color: 'from-accent to-accent/80',
            delay: '100ms'
          },
          {
            type: 'association',
            icon: Users,
            title: 'Association',
            description: 'Organisation à but non lucratif',
            color: 'from-primary to-accent',
            delay: '200ms'
          }
        ].map((option, index) => (
          <Card 
            key={option.type}
            className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 animate-fade-in ${
              userType === option.type 
                ? 'ring-2 ring-primary border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            style={{ animationDelay: option.delay }}
            onClick={() => setUserType(option.type)}
          >
            <CardContent className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full transform translate-x-12 -translate-y-12" />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-foreground">{option.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
                
                {userType === option.type && (
                  <div className="mt-4 animate-scale-in">
                    <CheckCircle className="h-6 w-6 text-primary mx-auto animate-pulse" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <Button variant="outline" onClick={() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setStep(1);
            setIsTransitioning(false);
          }, 200);
        }} className="px-8 py-3 hover:scale-105 transition-transform">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button 
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setStep(3);
              setIsTransitioning(false);
            }, 200);
          }} 
          disabled={!userType}
          className="px-8 py-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            Continuer
            <Sparkles className="h-4 w-4 animate-pulse" />
          </span>
        </Button>
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
            required
            className="mt-2 transition-all duration-200 focus:scale-105"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Label htmlFor="fullName" className="text-sm font-medium">Nom complet *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
            required
            className="mt-2 transition-all duration-200 focus:scale-105"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Label htmlFor="password" className="text-sm font-medium">Mot de passe *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
            required
            className="mt-2 transition-all duration-200 focus:scale-105"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
            required
            className="mt-2 transition-all duration-200 focus:scale-105"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Label htmlFor="phone" className="text-sm font-medium">Téléphone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
            required
            className="mt-2 transition-all duration-200 focus:scale-105"
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp (optionnel)</Label>
          <Input
            id="whatsapp"
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData(prev => ({...prev, whatsapp: e.target.value}))}
            placeholder="Par défaut: même que téléphone"
            className="mt-2 transition-all duration-200 focus:scale-105"
          />
        </div>
      </div>

      <div className="flex justify-between pt-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <Button variant="outline" onClick={() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setStep(userCategory === 'b2c' ? 1 : 2);
            setIsTransitioning(false);
          }, 200);
        }} className="px-8 py-3 hover:scale-105 transition-transform">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button 
          onClick={() => {
            setIsTransitioning(true);
            setTimeout(() => {
              setStep(userCategory === 'b2c' ? 3 : 4);
              setIsTransitioning(false);
            }, 200);
          }}
          disabled={!formData.email || !formData.fullName || !formData.password || !formData.phone}
          className="px-8 py-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            Continuer
            <Sparkles className="h-4 w-4 animate-pulse" />
          </span>
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
              <Button variant="outline" onClick={() => setStep(userCategory === 'b2c' ? 2 : 3)}>
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

          if (userType === 'teacher_private' || userType === 'teacher_public') {
            const schoolType = userType === 'teacher_private' ? 'private' : 'public';
            return (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="school">École *</Label>
                  <Select value={formData.schoolId} onValueChange={(value) => setFormData(prev => ({...prev, schoolId: value, schoolType}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre école" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools
                        .filter(school => school.school_type === schoolType)
                        .map(school => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name} - {school.city}
                          </SelectItem>
                        ))}
                      <SelectItem value="other">Autre (créer une nouvelle école)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.schoolId === 'other' && (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-semibold">Nouvelle école {schoolType === 'private' ? 'privée' : 'publique'}</h4>
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

                {userType === 'teacher_public' && (
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

                {userType === 'teacher_public' ? (
                  <Alert>
                    <AlertDescription>
                      <strong>École Publique:</strong> Votre compte nécessite une validation manuelle avec documents officiels. 
                      Accès après approbation administrative.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertDescription>
                      <strong>École Privée:</strong> Vérification automatique par email du domaine scolaire. 
                      Accès immédiat après confirmation.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.schoolId || !formData.professionalEmail || (userType === 'teacher_public' && uploadedDocs.length === 0)}
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
              <Button variant="outline" onClick={() => setStep(3)}>
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
      case 1: return "Choisir mon profil";
      case 2: return userCategory === 'b2c' ? "Informations personnelles" : "Type professionnel";
      case 3: return userCategory === 'b2c' ? "Finalisation" : "Informations personnelles";
      case 4: 
        if (userType === 'teacher_private' || userType === 'teacher_public') return "Informations scolaires";
        if (userType === 'association') return "Informations association";
        return "Informations spécifiques";
      default: return "";
    }
  };

  const maxSteps = userCategory === 'b2c' ? 3 : 4;
  const progress = (step / maxSteps) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/8 via-primary/4 to-primary/12 p-4 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-128 h-128 bg-gradient-to-br from-primary/6 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary-glow/6 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute top-3/4 left-1/3 w-48 h-48 bg-gradient-to-br from-primary/4 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: '6s' }} />
      </div>
      
      
      {/* Stylized back button */}
      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 backdrop-blur-xl bg-card/60 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Button>
      </div>

      {/* Enhanced progress indicator */}
      <div className="absolute top-6 right-6 z-20 bg-card/90 backdrop-blur-xl rounded-xl p-6 border border-primary/20 shadow-xl min-w-[240px]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-muted-foreground">Étape {step} sur {maxSteps}</span>
          <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted/20 rounded-full h-4 overflow-hidden border border-primary/10">
          <div 
            className="bg-gradient-to-r from-primary via-primary-glow to-primary h-full rounded-full transition-all duration-700 ease-in-out transform shadow-glow"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Début</span>
          <span>Terminé</span>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10 mt-24">

      {/* Enhanced main card */}
      <Card className="w-full border-0 shadow-elegant bg-card/95 backdrop-blur-xl overflow-hidden relative">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/6 pointer-events-none" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-xl" />
        
        <CardHeader className="relative text-center pb-10 pt-12">
          <div className="space-y-4">
            {/* Icon indicator */}
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center shadow-glow mb-6">
              {step === 1 && <User className="h-8 w-8 text-primary-foreground" />}
              {step === 2 && userCategory === 'b2b' && <Building2 className="h-8 w-8 text-primary-foreground" />}
              {step === 2 && userCategory === 'b2c' && <User className="h-8 w-8 text-primary-foreground" />}
              {step === 3 && <GraduationCap className="h-8 w-8 text-primary-foreground" />}
              {step === 4 && <Upload className="h-8 w-8 text-primary-foreground" />}
            </div>
            
            <CardTitle className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent animate-fade-in">
              {getStepTitle()}
            </CardTitle>
            <div className="w-32 h-1.5 bg-gradient-to-r from-primary via-primary-glow to-primary mx-auto rounded-full shadow-glow" />
            <CardDescription className="text-xl text-muted-foreground mt-6 max-w-3xl mx-auto leading-relaxed">
              {step === 1 && "Commençons par identifier votre profil pour personnaliser votre expérience théâtrale"}
              {step === 2 && userCategory === 'b2b' && "Précisez votre type d'organisation pour des services adaptés à vos besoins"}
              {step === 2 && userCategory === 'b2c' && "Vos informations personnelles pour finaliser votre compte"}
              {step === 3 && userCategory === 'b2b' && "Vos informations personnelles pour compléter votre profil professionnel"}
              {step === 3 && userCategory === 'b2c' && "Dernière étape pour finaliser votre inscription"}
              {step === 4 && "Informations spécifiques à votre organisation pour la validation"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="relative px-20 pb-16">
          <div 
            className={`transition-all duration-500 ease-in-out transform ${
              isTransitioning 
                ? 'opacity-0 translate-x-8 scale-95' 
                : 'opacity-100 translate-x-0 scale-100'
            }`}
          >
            <div className="animate-fade-in">
              {step === 1 && (
                <div className="animate-scale-in">
                  {renderCategorySelection()}
                </div>
              )}
              {step === 2 && userCategory === 'b2b' && (
                <div className="animate-slide-in-right">
                  {renderUserTypeSelection()}
                </div>
              )}
              {step === 2 && userCategory === 'b2c' && (
                <div className="animate-slide-in-right">
                  {renderBasicInfo()}
                </div>
              )}
              {step === 3 && userCategory === 'b2b' && (
                <div className="animate-slide-in-right">
                  {renderBasicInfo()}
                </div>
              )}
              {step === 3 && userCategory === 'b2c' && (
                <div className="animate-slide-in-right">
                  {renderSpecificInfo()}
                </div>
              )}
              {step === 4 && (
                <div className="animate-slide-in-right">
                  {renderSpecificInfo()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};