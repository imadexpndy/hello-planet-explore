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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId, documentType } = await req.json();

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        profiles(email, full_name),
        sessions(
          date,
          start_time,
          end_time,
          spectacles(title, description, price)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    // Generate document content based on type
    let documentContent = '';
    let fileName = '';

    if (documentType === 'devis') {
      fileName = `devis_${bookingId}.html`;
      documentContent = generateDevisHTML(booking);
    } else if (documentType === 'invoice') {
      fileName = `invoice_${bookingId}.html`;
      documentContent = generateInvoiceHTML(booking);
    } else if (documentType === 'ticket') {
      fileName = `tickets_${bookingId}.html`;
      documentContent = generateTicketHTML(booking);
    }

    // For now, we'll store as HTML and provide download URL
    // In production, you'd upload to Cloudflare R2 or similar
    const fileUrl = `data:text/html;base64,${btoa(documentContent)}`;

    // Store document record
    const { data: document, error: documentError } = await supabaseClient
      .from('documents')
      .insert({
        booking_id: bookingId,
        document_type: documentType,
        file_url: fileUrl,
        file_name: fileName
      })
      .select()
      .single();

    if (documentError) throw documentError;

    // Log audit trail
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'document_generated',
        entity_type: 'document',
        entity_id: document.id,
        details: {
          booking_id: bookingId,
          document_type: documentType,
          file_name: fileName
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        documentId: document.id,
        fileName: fileName,
        downloadUrl: fileUrl
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
  const spectacle = session.spectacles;
  const profile = booking.profiles;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Devis - ${spectacle.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .details { margin-bottom: 30px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f5f5f5; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DEVIS</h1>
        <p>N° ${booking.id.slice(0, 8)}</p>
        <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      
      <div class="details">
        <h3>Client:</h3>
        <p>${profile.full_name || profile.email}</p>
        <p>${profile.email}</p>
        
        <h3>Spectacle:</h3>
        <p><strong>${spectacle.title}</strong></p>
        <p>Date: ${new Date(session.date).toLocaleDateString('fr-FR')}</p>
        <p>Heure: ${session.start_time} - ${session.end_time}</p>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Places enfants</td>
            <td>${booking.students_count || booking.children_count || 0}</td>
            <td>${spectacle.price || 0}€</td>
            <td>${((booking.students_count || booking.children_count || 0) * (spectacle.price || 0))}€</td>
          </tr>
          <tr>
            <td>Places accompagnateurs</td>
            <td>${booking.accompanists_count || 0}</td>
            <td>Gratuit</td>
            <td>0€</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total" style="text-align: right; margin-top: 20px;">
        <p>Total: ${((booking.students_count || booking.children_count || 0) * (spectacle.price || 0))}€</p>
      </div>
      
      <div style="margin-top: 40px;">
        <h3>Modalités de paiement:</h3>
        <p>• Virement bancaire</p>
        <p>• Chèque à l'ordre de [Nom de l'organisation]</p>
        <p>Ce devis est valable 30 jours à compter de sa date d'émission.</p>
      </div>
    </body>
    </html>
  `;
}

function generateInvoiceHTML(booking: any): string {
  const session = booking.sessions;
  const spectacle = session.spectacles;
  const profile = booking.profiles;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Facture - ${spectacle.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .details { margin-bottom: 30px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f5f5f5; }
        .total { font-weight: bold; font-size: 18px; }
        .paid { color: green; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>FACTURE</h1>
        <p>N° ${booking.id.slice(0, 8)}</p>
        <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      
      <div class="details">
        <h3>Client:</h3>
        <p>${profile.full_name || profile.email}</p>
        <p>${profile.email}</p>
        
        <h3>Spectacle:</h3>
        <p><strong>${spectacle.title}</strong></p>
        <p>Date: ${new Date(session.date).toLocaleDateString('fr-FR')}</p>
        <p>Heure: ${session.start_time} - ${session.end_time}</p>
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Places</td>
            <td>${(booking.students_count || booking.children_count || 0) + (booking.accompanists_count || 0)}</td>
            <td>${spectacle.price || 0}€</td>
            <td>${((booking.students_count || booking.children_count || 0) * (spectacle.price || 0))}€</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total" style="text-align: right; margin-top: 20px;">
        <p>Total: ${((booking.students_count || booking.children_count || 0) * (spectacle.price || 0))}€</p>
        <p class="paid">PAYÉ</p>
      </div>
    </body>
    </html>
  `;
}

function generateTicketHTML(booking: any): string {
  const session = booking.sessions;
  const spectacle = session.spectacles;
  const totalTickets = (booking.students_count || booking.children_count || 0) + (booking.accompanists_count || 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Billets - ${spectacle.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .ticket { 
          border: 2px solid #333; 
          margin: 20px 0; 
          padding: 20px; 
          page-break-after: always;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .ticket:last-child { page-break-after: auto; }
        .ticket-header { text-align: center; margin-bottom: 20px; }
        .ticket-details { margin: 10px 0; }
        .qr-code { text-align: center; margin: 20px 0; font-family: monospace; }
      </style>
    </head>
    <body>
      ${Array.from({ length: totalTickets }, (_, i) => `
        <div class="ticket">
          <div class="ticket-header">
            <h2>${spectacle.title}</h2>
            <p>Billet #${i + 1}</p>
          </div>
          <div class="ticket-details">
            <p><strong>Date:</strong> ${new Date(session.date).toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure:</strong> ${session.start_time} - ${session.end_time}</p>
            <p><strong>Réservation:</strong> ${booking.id.slice(0, 8)}</p>
          </div>
          <div class="qr-code">
            <p>[QR CODE: ${booking.id}-${i + 1}]</p>
            <p style="font-size: 12px;">Présentez ce billet à l'entrée</p>
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}