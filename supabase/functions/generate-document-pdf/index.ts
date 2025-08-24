import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, documentType, sendEmail = false } = await req.json();

    // Create Supabase client with service role key for full access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey(full_name, email, phone),
        sessions!bookings_session_id_fkey(
          session_date,
          session_time,
          venue,
          city,
          spectacles!sessions_spectacle_id_fkey(title, description, price)
        ),
        organizations(name, contact_email, address, ice)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${bookingError?.message}`);
    }

    let htmlContent = '';
    let fileName = '';

    switch (documentType) {
      case 'devis':
        htmlContent = generateDevisHTML(booking);
        fileName = `devis_${booking.id}.pdf`;
        break;
      case 'facture':
        htmlContent = generateInvoiceHTML(booking);
        fileName = `facture_${booking.id}.pdf`;
        break;
      case 'billets':
        htmlContent = generateTicketsHTML(booking);
        fileName = `billets_${booking.id}.pdf`;
        break;
      default:
        throw new Error('Invalid document type');
    }

    // Store document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        booking_id: bookingId,
        document_type: documentType,
        file_name: fileName,
        file_url: `documents/${fileName}` // This would be updated with actual storage URL
      })
      .select()
      .single();

    if (docError) {
      console.error('Error storing document:', docError);
    }

    // Send email if requested
    if (sendEmail && booking.profiles?.email) {
      try {
        await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: booking.profiles.email,
            subject: `Votre ${documentType} - EDJS Spectacles`,
            html: generateEmailHTML(documentType, booking),
            attachments: [{
              filename: fileName,
              content: htmlContent,
              type: 'text/html'
            }]
          }
        });

        // Log email sending
        await supabaseAdmin
          .from('communications')
          .insert({
            user_id: booking.user_id,
            booking_id: bookingId,
            type: 'email',
            recipient: booking.profiles.email,
            subject: `Votre ${documentType} - EDJS Spectacles`,
            content: generateEmailHTML(documentType, booking),
            status: 'sent',
            sent_at: new Date().toISOString()
          });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    // Log audit
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: booking.user_id,
        action: 'document_generated',
        table_name: 'documents',
        entity: 'document',
        record_id: document?.id,
        new_values: {
          document_type: documentType,
          booking_id: bookingId,
          email_sent: sendEmail
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        documentId: document?.id,
        htmlContent,
        fileName,
        emailSent: sendEmail
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Document generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateDevisHTML(booking: any): string {
  const session = booking.sessions;
  const spectacle = session?.spectacles;
  const profile = booking.profiles;
  const organization = booking.organizations;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Devis - EDJS Spectacles</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #e74c3c; margin-bottom: 10px; }
            .document-title { font-size: 28px; color: #2c3e50; margin: 10px 0; }
            .client-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .spectacle-info { margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #e74c3c; color: white; }
            .total { text-align: right; font-size: 20px; font-weight: bold; color: #e74c3c; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🎭 EDJS SPECTACLES</div>
            <div class="document-title">DEVIS</div>
            <p>N° ${booking.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div class="client-info">
            <h3>Informations Client</h3>
            <p><strong>Nom:</strong> ${profile?.full_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${profile?.email || 'N/A'}</p>
            <p><strong>Téléphone:</strong> ${profile?.phone || 'N/A'}</p>
            ${organization ? `
                <p><strong>Organisation:</strong> ${organization.name}</p>
                <p><strong>ICE:</strong> ${organization.ice || 'N/A'}</p>
                <p><strong>Adresse:</strong> ${organization.address || 'N/A'}</p>
            ` : ''}
        </div>

        <div class="spectacle-info">
            <h3>Détails du Spectacle</h3>
            <table class="table">
                <tr>
                    <th>Spectacle</th>
                    <td>${spectacle?.title || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Date</th>
                    <td>${new Date(session?.session_date).toLocaleDateString('fr-FR')}</td>
                </tr>
                <tr>
                    <th>Heure</th>
                    <td>${session?.session_time || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Lieu</th>
                    <td>${session?.venue || 'N/A'}, ${session?.city || 'N/A'}</td>
                </tr>
                <tr>
                    <th>Nombre de billets</th>
                    <td>${booking.number_of_tickets}</td>
                </tr>
                <tr>
                    <th>Prix unitaire</th>
                    <td>${spectacle?.price || 0} DH</td>
                </tr>
            </table>
        </div>

        <div class="total">
            <p>Total: ${booking.total_amount || (booking.number_of_tickets * (spectacle?.price || 0))} DH</p>
        </div>

        <div class="footer">
            <p>Ce devis est valable 30 jours à compter de sa date d'émission.</p>
            <p>EDJS Spectacles - Contact: info@edjs-spectacles.ma</p>
        </div>
    </body>
    </html>
  `;
}

function generateInvoiceHTML(booking: any): string {
  const session = booking.sessions;
  const spectacle = session?.spectacles;
  const profile = booking.profiles;
  const organization = booking.organizations;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Facture - EDJS Spectacles</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #27ae60; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #27ae60; margin-bottom: 10px; }
            .document-title { font-size: 28px; color: #2c3e50; margin: 10px 0; }
            .paid-stamp { background: #27ae60; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; }
            .client-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #27ae60; color: white; }
            .total { text-align: right; font-size: 20px; font-weight: bold; color: #27ae60; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🎭 EDJS SPECTACLES</div>
            <div class="document-title">FACTURE</div>
            <div class="paid-stamp">PAYÉ</div>
            <p>N° ${booking.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div class="client-info">
            <h3>Informations Client</h3>
            <p><strong>Nom:</strong> ${profile?.full_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${profile?.email || 'N/A'}</p>
            ${organization ? `
                <p><strong>Organisation:</strong> ${organization.name}</p>
                <p><strong>ICE:</strong> ${organization.ice || 'N/A'}</p>
            ` : ''}
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        ${spectacle?.title || 'N/A'}<br>
                        <small>${new Date(session?.session_date).toLocaleDateString('fr-FR')} - ${session?.session_time}</small><br>
                        <small>${session?.venue}, ${session?.city}</small>
                    </td>
                    <td>${booking.number_of_tickets}</td>
                    <td>${spectacle?.price || 0} DH</td>
                    <td>${booking.total_amount || (booking.number_of_tickets * (spectacle?.price || 0))} DH</td>
                </tr>
            </tbody>
        </table>

        <div class="total">
            <p>Total TTC: ${booking.total_amount || (booking.number_of_tickets * (spectacle?.price || 0))} DH</p>
        </div>

        <div class="footer">
            <p>Merci de votre confiance !</p>
            <p>EDJS Spectacles - Contact: info@edjs-spectacles.ma</p>
        </div>
    </body>
    </html>
  `;
}

function generateTicketsHTML(booking: any): string {
  const session = booking.sessions;
  const spectacle = session?.spectacles;
  const tickets = Array.from({ length: booking.number_of_tickets }, (_, i) => ({
    number: `${booking.id.slice(0, 4).toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
    qrData: `${booking.id}-${i + 1}`
  }));

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Billets - EDJS Spectacles</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .ticket { width: 100%; max-width: 600px; margin: 0 auto 30px; border: 2px dashed #e74c3c; padding: 20px; background: linear-gradient(45deg, #f8f9fa, #ffffff); page-break-after: always; }
            .ticket:last-child { page-break-after: auto; }
            .ticket-header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 15px; margin-bottom: 15px; }
            .logo { font-size: 20px; font-weight: bold; color: #e74c3c; }
            .ticket-title { font-size: 24px; color: #2c3e50; margin: 10px 0; }
            .ticket-info { display: flex; justify-content: space-between; align-items: center; }
            .info-left { flex: 1; }
            .info-right { text-align: center; }
            .qr-placeholder { width: 80px; height: 80px; border: 2px solid #ddd; background: #f8f9fa; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; }
            .ticket-details p { margin: 5px 0; }
            .ticket-number { font-size: 18px; font-weight: bold; color: #e74c3c; }
        </style>
    </head>
    <body>
        ${tickets.map(ticket => `
            <div class="ticket">
                <div class="ticket-header">
                    <div class="logo">🎭 EDJS SPECTACLES</div>
                    <div class="ticket-title">${spectacle?.title || 'Spectacle'}</div>
                    <div class="ticket-number">Billet N° ${ticket.number}</div>
                </div>
                
                <div class="ticket-info">
                    <div class="info-left">
                        <div class="ticket-details">
                            <p><strong>Date:</strong> ${new Date(session?.session_date).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Heure:</strong> ${session?.session_time || 'N/A'}</p>
                            <p><strong>Lieu:</strong> ${session?.venue || 'N/A'}</p>
                            <p><strong>Ville:</strong> ${session?.city || 'N/A'}</p>
                            <p><strong>Réservation:</strong> ${booking.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                    
                    <div class="info-right">
                        <div class="qr-placeholder">
                            QR CODE<br>
                            ${ticket.qrData}
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
                    Présentez ce billet à l'entrée • Conservez-le pendant toute la durée du spectacle
                </div>
            </div>
        `).join('')}
    </body>
    </html>
  `;
}

function generateEmailHTML(documentType: string, booking: any): string {
  const session = booking.sessions;
  const spectacle = session?.spectacles;
  
  const docTypeMap = {
    'devis': 'devis',
    'facture': 'facture',
    'billets': 'billets'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Votre ${docTypeMap[documentType]} - EDJS Spectacles</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #e74c3c;">🎭 EDJS SPECTACLES</h1>
            </div>
            
            <h2>Bonjour ${booking.profiles?.full_name || 'Cher spectateur'},</h2>
            
            <p>Nous vous remercions pour votre réservation pour le spectacle <strong>"${spectacle?.title}"</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Détails de votre réservation :</h3>
                <ul>
                    <li><strong>Spectacle :</strong> ${spectacle?.title}</li>
                    <li><strong>Date :</strong> ${new Date(session?.session_date).toLocaleDateString('fr-FR')}</li>
                    <li><strong>Heure :</strong> ${session?.session_time}</li>
                    <li><strong>Lieu :</strong> ${session?.venue}, ${session?.city}</li>
                    <li><strong>Nombre de billets :</strong> ${booking.number_of_tickets}</li>
                </ul>
            </div>
            
            <p>Vous trouverez en pièce jointe votre ${docTypeMap[documentType]}.</p>
            
            ${documentType === 'billets' ? 
                '<p><strong>Important :</strong> Veuillez présenter vos billets à l\'entrée le jour du spectacle.</p>' : 
                ''
            }
            
            <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>L'équipe EDJS Spectacles</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                <p>EDJS Spectacles | Email: info@edjs-spectacles.ma | Téléphone: +212 5XX XX XX XX</p>
            </div>
        </div>
    </body>
    </html>
  `;
}