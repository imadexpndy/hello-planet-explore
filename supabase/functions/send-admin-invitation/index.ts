import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to sanitize and normalize the RESEND_FROM value
function sanitizeFrom(rawFrom: string): { sanitized: string; isValid: boolean; notes: string[] } {
  const notes: string[] = [];
  
  if (!rawFrom) {
    return { sanitized: '', isValid: false, notes: ['RESEND_FROM is empty'] };
  }

  // Unicode normalize and basic cleanup
  let cleaned = rawFrom.normalize('NFKC').trim();
  notes.push(`Original length: ${rawFrom.length}, after normalize/trim: ${cleaned.length}`);

  // Strip common smart quotes and enclosing punctuation
  const smartQuotePattern = /^["""''«»`']+|["""''«»`']+$/g;
  cleaned = cleaned.replace(smartQuotePattern, '').trim();
  
  // Collapse multiple whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  if (cleaned !== rawFrom) {
    notes.push('Stripped smart quotes and normalized whitespace');
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const displayNameRegex = /^(.+?)\s*<\s*([^\s@]+@[^\s@]+\.[^\s@]+)\s*>$/;

  // Check if it's a display name format
  const displayMatch = cleaned.match(displayNameRegex);
  if (displayMatch) {
    const [, displayName, email] = displayMatch;
    notes.push(`Display name format detected: "${displayName}" <${email}>`);
    
    if (emailRegex.test(email)) {
      return { sanitized: cleaned, isValid: true, notes };
    } else {
      // Fall back to just the email if display name format is malformed
      notes.push('Display name format invalid, attempting to extract email');
      if (emailRegex.test(email)) {
        return { sanitized: email, isValid: true, notes: [...notes, 'Using extracted email only'] };
      }
    }
  }

  // Check if it's a plain email
  if (emailRegex.test(cleaned)) {
    notes.push('Plain email format detected');
    return { sanitized: cleaned, isValid: true, notes };
  }

  notes.push('Failed all validation patterns');
  return { sanitized: cleaned, isValid: false, notes };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check mode
  const url = new URL(req.url);
  const isHealthCheck = url.searchParams.get('health') === '1';
  
  try {
    const requestBody = req.method === 'GET' ? {} : await req.json();
    const { email, role, invitedByName, invitationToken, health } = requestBody;
    
    if (isHealthCheck || health === true) {
      // Health/diagnostics mode
      const rawFrom = Deno.env.get('RESEND_FROM') ?? '';
      const hasApiKey = !!(Deno.env.get('RESEND_API_KEY') || '').trim();
      const fromResult = sanitizeFrom(rawFrom);
      
      return new Response(
        JSON.stringify({
          hasApiKey,
          hasFrom: !!rawFrom,
          fromLooksValid: fromResult.isValid,
          sanitizedFromPreview: fromResult.isValid ? fromResult.sanitized.substring(0, 50) + (fromResult.sanitized.length > 50 ? '...' : '') : null,
          notes: fromResult.notes
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the current user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to invite admins (based on admin_role)
    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['super_admin', 'admin_full'].includes(profile.admin_role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine token to use (reuse existing for resend)
    const tokenToUse = invitationToken ?? crypto.randomUUID();

    // Only create a new record if this is a fresh invitation
    let invitation: any = null;
    if (!invitationToken) {
      const { data: insertData, error: inviteError } = await supabase
        .from('admin_invitations')
        .insert({
          email,
          role,
          invited_by: user.id,
          invitation_token: tokenToUse,
        })
        .select()
        .single();

      if (inviteError) {
        return new Response(
          JSON.stringify({ error: `Failed to create invitation: ${inviteError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      invitation = insertData;
    }

    // Send invitation email
    const inviteUrl = `${supabaseUrl.replace('supabase.co', 'lovable.app')}/admin/accept-invitation?token=${tokenToUse}`;

    const roleNames: Record<string, string> = {
      'admin_spectacles': 'Gestionnaire de Spectacles',
      'admin_schools': "Gestionnaire d'Écoles",
      'admin_partners': 'Gestionnaire de Partenaires',
      'admin_support': 'Support',
      'admin_notifications': 'Gestionnaire de Notifications',
      'admin_editor': 'Éditeur',
      'admin_full': 'Administrateur Complet',
      'super_admin': 'Super Administrateur'
    };

    // Use the robust sanitization function
    const rawFrom = Deno.env.get('RESEND_FROM') ?? '';
    const fromResult = sanitizeFrom(rawFrom);

    if (!fromResult.isValid) {
      console.error('Invalid RESEND_FROM format or missing:', fromResult.notes);
      return new Response(
        JSON.stringify({
          error: `RESEND_FROM validation failed: ${fromResult.notes.join(', ')}. Please use no-reply@edjs.art or "EDJS <no-reply@edjs.art>" from a verified domain.`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fromAddress = fromResult.sanitized;

    // Initialize Resend client safely (avoid startup crashes when key is missing)
    if (!resendApiKey || !resendApiKey.trim()) {
      console.error('Missing RESEND_API_KEY.');
      return new Response(
        JSON.stringify({ error: 'Missing RESEND_API_KEY. Set it in Supabase Function secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const resend = new Resend(resendApiKey.trim());

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "Invitation à rejoindre l'équipe d'administration EDJS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Invitation EDJS</h1>
          <p>Bonjour,</p>
          <p><strong>${invitedByName}</strong> vous invite à rejoindre l'équipe d'administration de la plateforme EDJS en tant que <strong>${roleNames[role] || role}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Votre rôle: ${roleNames[role] || role}</h3>
            <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation et configurer votre compte :</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accepter l'invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Cette invitation expire dans 7 jours. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            EDJS - Plateforme de gestion des spectacles éducatifs
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend error details:', emailError);
      let errorMsg = 'Unknown email error';
      if (typeof emailError === 'string') {
        errorMsg = emailError;
      } else if ((emailError as any)?.message) {
        errorMsg = (emailError as any).message;
      } else if ((emailError as any)?.error) {
        errorMsg = (emailError as any).error;
      } else {
        try { errorMsg = JSON.stringify(emailError); } catch { /* ignore */ }
      }
      return new Response(
        JSON.stringify({ error: `Email not sent: ${errorMsg}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation email sent:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation: invitation,
        emailId: (emailData as any)?.id || null 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error sending admin invitation:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
