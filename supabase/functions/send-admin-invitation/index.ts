import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, invitedByName, invitationToken } = await req.json();

    // Get the current user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

// Check if user has permission to invite admins
const { data: profile } = await supabase
  .from('profiles')
  .select('admin_role')
  .eq('user_id', user.id)
  .single();

if (!profile || !['super_admin', 'admin_full'].includes(profile.admin_role)) {
  throw new Error('Insufficient permissions');
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
        throw new Error(`Failed to create invitation: ${inviteError.message}`);
      }
      invitation = insertData;
    }

    // Send invitation email
    const inviteUrl = `${supabaseUrl.replace('supabase.co', 'lovable.app')}/admin/accept-invitation?token=${tokenToUse}`;
    
    const roleNames = {
      'admin_spectacles': 'Gestionnaire de Spectacles',
      'admin_schools': 'Gestionnaire d\'Écoles',
      'admin_partners': 'Gestionnaire de Partenaires',
      'admin_support': 'Support',
      'admin_notifications': 'Gestionnaire de Notifications',
      'admin_editor': 'Éditeur',
      'admin_full': 'Administrateur Complet',
      'super_admin': 'Super Administrateur'
    };
    const fromAddress = Deno.env.get('RESEND_FROM') || "Lovable <onboarding@resend.dev>";

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
      const msg = typeof emailError === 'string' ? emailError : (emailError?.message ?? JSON.stringify(emailError));
      throw new Error(`Email not sent: ${msg}`);
    }

    console.log('Invitation email sent:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation: invitation,
        emailId: emailData?.id || null 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error sending admin invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});