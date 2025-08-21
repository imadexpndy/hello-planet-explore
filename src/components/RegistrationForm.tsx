import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Check, Upload, User, Building2, Users, GraduationCap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [userCategory, setUserCategory] = useState<'b2c' | 'b2b' | ''>('');
  const [userType, setUserType] = useState<string>('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const { toast } = useToast();

  const totalSteps = userCategory === 'b2c' ? 3 : 5;
  const progress = (currentStep / totalSteps) * 100;

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

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
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
            school_type: userType === 'teacher_private' ? 'private' : 'public',
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="min-h-screen flex items-center justify-center px-1">
            <div className="w-full max-w-none mx-auto">
              <div className="text-center mb-20">
                <h1 className="text-4xl font-bold text-foreground mb-6">Choisissez votre profil</h1>
                <p className="text-lg text-muted-foreground">Quelle catégorie vous correspond ?</p>
              </div>
              
              <div className="grid grid-cols-2 gap-24 w-full">
                <button
                  className={`group relative bg-white p-12 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    userCategory === 'b2c' 
                      ? 'border-primary shadow-primary/10' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => {
                    setUserCategory('b2c');
                    setUserType('b2c');
                  }}
                >
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground mb-6">PARTICULIER</h3>
                    <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
                      Parents<br/>
                      et<br/>
                      familles<br/>
                      souhaitant<br/>
                      acheter<br/>
                      des<br/>
                      billets<br/>
                      individuellement
                    </p>
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary/10 text-primary text-base font-semibold">
                      <Check className="h-5 w-5 mr-2" />
                      Accès immédiat
                    </div>
                  </div>
                </button>

                <button
                  className={`group relative bg-white p-12 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    userCategory === 'b2b' 
                      ? 'border-primary shadow-primary/10' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => setUserCategory('b2b')}
                >
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground mb-6">PROFESSIONNEL</h3>
                    <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
                      Enseignants,<br/>
                      associations<br/>
                      et<br/>
                      organismes<br/>
                      éducatifs
                    </p>
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-50 text-blue-700 text-base font-semibold">
                      Tarifs préférentiels
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        if (userCategory === 'b2b') {
          return (
            <div className="w-full max-w-none mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-foreground mb-4">Précisez votre profil</h1>
                <p className="text-2xl text-muted-foreground">Quel type d'organisation représentez-vous ?</p>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                <button
                  className={`p-10 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                    userType === 'teacher_private' 
                      ? 'border-primary bg-primary/10 shadow-2xl' 
                      : 'border-gray-200 hover:border-primary/50 hover:shadow-lg'
                  }`}
                  onClick={() => setUserType('teacher_private')}
                >
                  <GraduationCap className="h-20 w-20 mx-auto mb-6 text-primary" />
                  <h3 className="text-2xl font-bold mb-4">École Privée</h3>
                  <p className="text-base text-muted-foreground">Vérification par email du domaine</p>
                </button>

                <button
                  className={`p-10 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                    userType === 'teacher_public' 
                      ? 'border-primary bg-primary/10 shadow-2xl' 
                      : 'border-gray-200 hover:border-primary/50 hover:shadow-lg'
                  }`}
                  onClick={() => setUserType('teacher_public')}
                >
                  <GraduationCap className="h-20 w-20 mx-auto mb-6 text-accent" />
                  <h3 className="text-2xl font-bold mb-4">École Publique</h3>
                  <p className="text-base text-muted-foreground">Documents officiels requis</p>
                </button>

                <button
                  className={`p-10 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                    userType === 'association' 
                      ? 'border-primary bg-primary/10 shadow-2xl' 
                      : 'border-gray-200 hover:border-primary/50 hover:shadow-lg'
                  }`}
                  onClick={() => setUserType('association')}
                >
                  <Users className="h-20 w-20 mx-auto mb-6 text-primary" />
                  <h3 className="text-2xl font-bold mb-4">Association</h3>
                  <p className="text-base text-muted-foreground">Organisation à but non lucratif</p>
                </button>
              </div>
            </div>
          );
        }
        // Fall through for B2C users
      case 3:
        if (userCategory === 'b2c' || (userCategory === 'b2b' && currentStep === 3)) {
          return (
            <div className="w-full max-w-none mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-foreground mb-4">Vos informations</h1>
                <p className="text-2xl text-muted-foreground">Quelques détails pour créer votre compte</p>
              </div>
              
              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <Label htmlFor="fullName" className="text-xl font-semibold mb-3 block">Nom complet *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                      className="h-14 text-lg"
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-xl font-semibold mb-3 block">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      className="h-14 text-lg"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <Label htmlFor="phone" className="text-xl font-semibold mb-3 block">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                      className="h-14 text-lg"
                      placeholder="+212 6XX XX XX XX"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp" className="text-xl font-semibold mb-3 block">WhatsApp (optionnel)</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({...prev, whatsapp: e.target.value}))}
                      className="h-14 text-lg"
                      placeholder="Par défaut: même que téléphone"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        }
      case 4:
        return (
          <div className="w-full max-w-none mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-foreground mb-4">Sécurisez votre compte</h1>
              <p className="text-2xl text-muted-foreground">Créez un mot de passe fort</p>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div>
                <Label htmlFor="password" className="text-xl font-semibold mb-3 block">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  className="h-14 text-lg"
                  placeholder="Votre mot de passe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-xl font-semibold mb-3 block">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                  className="h-14 text-lg"
                  placeholder="Confirmez votre mot de passe"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 5:
        if (userType === 'teacher_private' || userType === 'teacher_public') {
          return (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-foreground">Votre école</h1>
                <p className="text-xl text-muted-foreground">Informations sur votre établissement</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <Label htmlFor="school" className="text-lg font-medium">École *</Label>
                  <Select value={formData.schoolId} onValueChange={(value) => setFormData(prev => ({...prev, schoolId: value}))}>
                    <SelectTrigger className="mt-2 h-12 text-lg">
                      <SelectValue placeholder="Sélectionnez votre école" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools
                        .filter(school => school.school_type === (userType === 'teacher_private' ? 'private' : 'public'))
                        .map(school => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name} - {school.city}
                          </SelectItem>
                        ))}
                      <SelectItem value="other">Autre (créer une nouvelle école)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="professionalEmail" className="text-lg font-medium">Email professionnel *</Label>
                  <Input
                    id="professionalEmail"
                    type="email"
                    value={formData.professionalEmail}
                    onChange={(e) => setFormData(prev => ({...prev, professionalEmail: e.target.value}))}
                    className="mt-2 h-12 text-lg"
                    placeholder="votre@ecole.ma"
                    required
                  />
                </div>

                {userType === 'teacher_public' && (
                  <div>
                    <Label htmlFor="documents" className="text-lg font-medium">Documents de vérification *</Label>
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="mt-2 h-12"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Téléchargez vos documents officiels (carte professionnelle, attestation, etc.)
                    </p>
                    {uploadedDocs.length > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        {uploadedDocs.length} document(s) téléchargé(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (userType === 'association') {
          return (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-foreground">Votre association</h1>
                <p className="text-xl text-muted-foreground">Informations sur votre organisation</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <Label htmlFor="associationName" className="text-lg font-medium">Nom de l'association *</Label>
                  <Input
                    id="associationName"
                    value={formData.associationName}
                    onChange={(e) => setFormData(prev => ({...prev, associationName: e.target.value}))}
                    className="mt-2 h-12 text-lg"
                    placeholder="Nom de votre association"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactPerson" className="text-lg font-medium">Personne de contact *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({...prev, contactPerson: e.target.value}))}
                    className="mt-2 h-12 text-lg"
                    placeholder="Nom du responsable"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="associationICE" className="text-lg font-medium">ICE / Numéro officiel</Label>
                  <Input
                    id="associationICE"
                    value={formData.associationICE}
                    onChange={(e) => setFormData(prev => ({...prev, associationICE: e.target.value}))}
                    className="mt-2 h-12 text-lg"
                    placeholder="Numéro d'identification"
                  />
                </div>

                <div>
                  <Label htmlFor="documents" className="text-lg font-medium">Documents requis *</Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="mt-2 h-12"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Statuts, certificat officiel, etc.
                  </p>
                  {uploadedDocs.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {uploadedDocs.length} document(s) téléchargé(s)
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return userCategory !== '';
      case 2:
        return userCategory === 'b2c' || userType !== '';
      case 3:
        return formData.fullName && formData.email && formData.phone;
      case 4:
        return formData.password && formData.confirmPassword;
      case 5:
        if (userType === 'teacher_private' || userType === 'teacher_public') {
          return formData.schoolId && formData.professionalEmail && 
                 (userType === 'teacher_private' || uploadedDocs.length > 0);
        }
        if (userType === 'association') {
          return formData.associationName && formData.contactPerson && uploadedDocs.length > 0;
        }
        return true;
      default:
        return false;
    }
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-none mx-auto px-1 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Étape {currentStep} sur {totalSteps}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-0">
        <div className="w-full">
          {renderStep()}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur-sm border-t sticky bottom-0">
        <div className="max-w-none mx-auto px-1 py-6">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 text-lg px-6 py-3"
            >
              <ArrowLeft className="h-5 w-5" />
              Retour
            </Button>

            <Button
              onClick={isLastStep ? handleSubmit : handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center gap-2 text-lg px-8 py-3"
              size="lg"
            >
              {loading ? (
                "Traitement..."
              ) : isLastStep ? (
                <>
                  <Check className="h-5 w-5" />
                  Créer mon compte
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};