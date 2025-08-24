import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
const resendFrom = Deno.env.get('RESEND_FROM') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Using Supabase Auth invitations; no custom email sender needed.


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
      // Health/diagnostics: verify service role key exists and can call admin APIs
      const hasServiceRole = !!(supabaseServiceKey || '').trim();
      const hasUrl = !!(supabaseUrl || '').trim();
      return new Response(
        JSON.stringify({
          using: 'supabase-auth',
          hasServiceRole,
          hasUrl,
          canInvite: hasServiceRole && hasUrl
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

    // Send invitation via Supabase Auth (built-in email)
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          admin_role: role,  // Use admin_role to match profiles table
          invited_by: user.id,
          invitation_token: tokenToUse,
        },
      }
    );

    if (inviteError) {
      const msg = (inviteError as any)?.message || String(inviteError);
      console.error('Supabase invite error:', inviteError);

      // Fallback: if user already exists, generate a recovery (magic) link to let them sign in
      if (/already exists|already registered|duplicate/i.test(msg)) {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { data: { admin_role: role, invited_by: user.id } }
        });
        if (linkError) {
          console.error('Failed to generate recovery link:', linkError);
          return new Response(
            JSON.stringify({ error: `User exists and recovery link failed: ${linkError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ success: true, invitation, mode: 'recovery_fallback', recoveryLink: linkData?.action_link || null }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Failed to send invite: ${msg}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation sent successfully via Supabase Auth:', inviteData);

    // Also generate a direct invite link so admins can share manually if email delivery fails
    const { data: linkInvite, error: linkInviteError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { data: { admin_role: role, invited_by: user.id, invitation_token: tokenToUse } }
    });
    if (linkInviteError) {
      console.warn('Could not generate invite link (non-blocking):', linkInviteError);
    }

    // If Resend is configured, send the email ourselves to ensure delivery
    if (linkInvite?.action_link && resendApiKey && resendFrom) {
      try {
        const emailBody = {
          from: resendFrom,
          to: [email],
          subject: "Invitation à rejoindre l'administration EDJS",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color:#2563eb;margin-bottom:16px">Invitation EDJS</h2>
              <p>Bonjour,</p>
              <p><strong>${invitedByName || 'Un administrateur'}</strong> vous invite à rejoindre l'administration EDJS en tant que <strong>${role}</strong>.</p>
              <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
              <p style="text-align:center;margin:24px 0">
                <a href="${linkInvite.action_link}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">Accepter l'invitation</a>
              </p>
              <p style="color:#6b7280;font-size:12px">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br/>${linkInvite.action_link}</p>
            </div>
          `
        } as any;

        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailBody),
        });
        const result = await resp.json();
        if (!resp.ok) {
          console.warn('Resend send failed (non-blocking):', result);
        }
      } catch (e) {
        console.warn('Resend unexpected error (non-blocking):', e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, invitation, userId: inviteData?.user?.id ?? null, inviteLink: linkInvite?.action_link || null, via: resendApiKey && resendFrom ? 'resend+supabase' : 'supabase-only' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
