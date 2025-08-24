import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDocuments = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDocument = async (bookingId: string, documentType: 'devis' | 'facture' | 'billets', sendEmail = false) => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-document-pdf', {
        body: {
          bookingId,
          documentType,
          sendEmail
        }
      });

      if (error) throw error;

      toast({
        title: "Document généré avec succès",
        description: sendEmail ? 
          `Le ${documentType} a été généré et envoyé par email.` : 
          `Le ${documentType} a été généré.`,
      });

      return data;
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Erreur",
        description: `Impossible de générer le ${documentType}.`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocument = (htmlContent: string, fileName: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    generateDocument,
    downloadDocument,
    isGenerating
  };
};