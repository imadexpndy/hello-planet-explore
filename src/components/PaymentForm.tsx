import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Building2, FileText, Loader2 } from 'lucide-react';

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  userRole: string;
  onPaymentSuccess: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  bookingId,
  amount,
  userRole,
  onPaymentSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un mode de paiement",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          bookingId,
          amount,
          paymentMethod
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Paiement traité",
          description: paymentMethod === 'cmi_card' 
            ? "Votre paiement a été confirmé"
            : "Votre demande de paiement a été enregistrée",
        });

        // Generate appropriate document
        const documentType = userRole === 'teacher_private' ? 'devis' : 'invoice';
        await supabase.functions.invoke('generate-document', {
          body: {
            bookingId,
            documentType
          }
        });

        onPaymentSuccess();
      } else {
        throw new Error("Le paiement a échoué");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors du traitement du paiement",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentOptions = () => {
    if (userRole === 'b2c_user') {
      return (
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent">
            <RadioGroupItem value="cmi_card" id="cmi_card" />
            <Label htmlFor="cmi_card" className="flex items-center gap-2 cursor-pointer">
              <CreditCard className="h-4 w-4" />
              Paiement par carte bancaire (CMI)
            </Label>
          </div>
        </RadioGroup>
      );
    }

    if (userRole === 'teacher_private') {
      return (
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent">
            <RadioGroupItem value="bank_transfer" id="bank_transfer" />
            <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer">
              <Building2 className="h-4 w-4" />
              Virement bancaire
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent">
            <RadioGroupItem value="check" id="check" />
            <Label htmlFor="check" className="flex items-center gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Chèque
            </Label>
          </div>
        </RadioGroup>
      );
    }

    return null;
  };

  const renderPaymentInfo = () => {
    if (userRole === 'teacher_private' && paymentMethod) {
      return (
        <Alert>
          <AlertDescription>
            {paymentMethod === 'bank_transfer' && (
              <div>
                <h4 className="font-semibold mb-2">Informations de virement</h4>
                <p>IBAN: FR76 1234 5678 9012 3456 7890 123</p>
                <p>BIC: ABCDEFGH</p>
                <p>Référence: {bookingId.slice(0, 8)}</p>
              </div>
            )}
            {paymentMethod === 'check' && (
              <div>
                <h4 className="font-semibold mb-2">Paiement par chèque</h4>
                <p>Chèque à l'ordre de: [Nom de l'organisation]</p>
                <p>Référence à indiquer: {bookingId.slice(0, 8)}</p>
                <p>Adresse d'envoi: [Adresse à définir]</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  if (amount === 0) {
    return (
      <Alert>
        <AlertDescription>
          Cette réservation est gratuite. Aucun paiement n'est requis.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement</CardTitle>
        <CardDescription>
          Montant à payer: {amount}€
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderPaymentOptions()}
        {renderPaymentInfo()}
        
        <Button 
          onClick={handlePayment}
          disabled={!paymentMethod || processing}
          className="w-full"
        >
          {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {userRole === 'teacher_private' 
            ? 'Confirmer la commande'
            : 'Procéder au paiement'
          }
        </Button>
      </CardContent>
    </Card>
  );
};