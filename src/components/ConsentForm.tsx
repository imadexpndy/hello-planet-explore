import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ConsentFormProps {
  onConsentComplete: () => void;
  showEmailConsent?: boolean;
  showWhatsAppConsent?: boolean;
}

export const ConsentForm: React.FC<ConsentFormProps> = ({
  onConsentComplete,
  showEmailConsent = true,
  showWhatsAppConsent = false
}) => {
  const [consents, setConsents] = useState({
    privacy: false,
    terms: false,
    email: false,
    whatsapp: false
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleConsentChange = (type: keyof typeof consents, checked: boolean) => {
    setConsents(prev => ({ ...prev, [type]: checked }));
  };

  const handleSaveConsents = async () => {
    if (!consents.privacy || !consents.terms) {
      toast({
        title: "Consentements requis",
        description: "Vous devez accepter la politique de confidentialité et les conditions d'utilisation",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          privacy_accepted: consents.privacy,
          terms_accepted: consents.terms,
          email_consent: consents.email,
          whatsapp_consent: consents.whatsapp,
          consent_date: new Date().toISOString()
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Consentements enregistrés",
        description: "Vos préférences ont été sauvegardées",
      });

      onConsentComplete();
    } catch (error) {
      console.error('Error saving consents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos consentements",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = consents.privacy && consents.terms;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consentements et préférences</CardTitle>
        <CardDescription>
          Veuillez accepter les conditions requises et configurer vos préférences de communication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Les consentements marqués d'un astérisque (*) sont obligatoires pour utiliser la plateforme.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={consents.privacy}
              onCheckedChange={(checked) => handleConsentChange('privacy', checked as boolean)}
            />
            <Label htmlFor="privacy" className="text-sm leading-5">
              * J'accepte la{' '}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                politique de confidentialité
              </Link>
            </Label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={consents.terms}
              onCheckedChange={(checked) => handleConsentChange('terms', checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm leading-5">
              * J'accepte les{' '}
              <Link to="/terms" className="text-primary hover:underline" target="_blank">
                conditions d'utilisation
              </Link>
            </Label>
          </div>

          {showEmailConsent && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="email"
                checked={consents.email}
                onCheckedChange={(checked) => handleConsentChange('email', checked as boolean)}
              />
              <Label htmlFor="email" className="text-sm leading-5">
                J'accepte de recevoir des communications par email (confirmations, rappels, newsletters)
              </Label>
            </div>
          )}

          {showWhatsAppConsent && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="whatsapp"
                checked={consents.whatsapp}
                onCheckedChange={(checked) => handleConsentChange('whatsapp', checked as boolean)}
              />
              <Label htmlFor="whatsapp" className="text-sm leading-5">
                J'accepte de recevoir des notifications WhatsApp (confirmations, rappels)
              </Label>
            </div>
          )}
        </div>

        <Button
          onClick={handleSaveConsents}
          disabled={!isFormValid || saving}
          className="w-full"
        >
          {saving ? "Enregistrement..." : "Confirmer les consentements"}
        </Button>
      </CardContent>
    </Card>
  );
};