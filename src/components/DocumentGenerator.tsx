import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDocuments } from '@/hooks/useDocuments';
import { FileText, Download, Mail, Loader2 } from 'lucide-react';

interface DocumentGeneratorProps {
  bookingId: string;
  bookingData: {
    spectacle_title: string;
    session_date: string;
    number_of_tickets: number;
    total_amount: number;
    status: string;
  };
  userRole?: string;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  bookingId,
  bookingData,
  userRole
}) => {
  const { generateDocument, downloadDocument, isGenerating } = useDocuments();

  const handleGenerateDocument = async (type: 'devis' | 'facture' | 'billets', sendEmail = false) => {
    try {
      const result = await generateDocument(bookingId, type, sendEmail);
      if (result.htmlContent && result.fileName) {
        downloadDocument(result.htmlContent, result.fileName);
      }
    } catch (error) {
      console.error('Failed to generate document:', error);
    }
  };

  const canGenerateInvoice = bookingData.status === 'confirmed' || bookingData.status === 'paid';
  const canGenerateTickets = bookingData.status === 'confirmed' || bookingData.status === 'paid';
  const showFinancialDocs = userRole === 'teacher_private' || userRole === 'admin_full' || userRole === 'super_admin';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents de Réservation
        </CardTitle>
        <CardDescription>
          Générez et téléchargez vos documents pour la réservation {bookingId.slice(0, 8).toUpperCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Booking Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">{bookingData.spectacle_title}</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <span>Date: {new Date(bookingData.session_date).toLocaleDateString('fr-FR')}</span>
            <span>Billets: {bookingData.number_of_tickets}</span>
            <span>Total: {bookingData.total_amount} DH</span>
            <Badge variant={bookingData.status === 'confirmed' ? 'default' : 'secondary'} className="w-fit">
              {bookingData.status}
            </Badge>
          </div>
        </div>

        {/* Document Actions */}
        <div className="grid gap-3">
          {/* Devis - Always available for B2B users */}
          {showFinancialDocs && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium">Devis</p>
                  <p className="text-sm text-muted-foreground">Document de demande de prix</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateDocument('devis', false)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateDocument('devis', true)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Facture - Only when paid */}
          {showFinancialDocs && canGenerateInvoice && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">Facture</p>
                  <p className="text-sm text-muted-foreground">Document de facturation</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateDocument('facture', false)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateDocument('facture', true)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Billets - When confirmed */}
          {canGenerateTickets && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="font-medium">Billets</p>
                  <p className="text-sm text-muted-foreground">Billets d'entrée ({bookingData.number_of_tickets})</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateDocument('billets', false)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateDocument('billets', true)}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {(!showFinancialDocs && userRole === 'association') && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              En tant qu'association, vos billets sont gratuits ! 
              Vous pouvez télécharger vos billets une fois la réservation confirmée.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};