import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
          role,
          invited_by: user.id,
          invitation_token: tokenToUse,
        },
        // Use the Site URL configured in Supabase for redirects
      }
    );

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: `Failed to send invite: ${inviteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, invitation, userId: inviteData?.user?.id ?? null }),
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
