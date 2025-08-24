import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-setup-token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// No-op version bump to trigger redeploy
const BUILD_VERSION = 'debug-3';
console.log('create-admin function deployed', { version: BUILD_VERSION });

// Log available environment variables at startup
console.log('Environment check:', {
  ADMIN_SETUP_TOKEN_available: !!(Deno.env.get('ADMIN_SETUP_TOKEN') || '').trim(),
  SUPABASE_URL_available: !!(Deno.env.get('SUPABASE_URL') || '').trim(),
  SERVICE_ROLE_available: !!(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim(),
  timestamp: new Date().toISOString()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Debug endpoint to verify environment availability
    if (req.method === 'GET') {
      const expected = (Deno.env.get('ADMIN_SETUP_TOKEN') || '').trim();
      const supabaseUrlSet = !!(Deno.env.get('SUPABASE_URL') || '').trim();
      const serviceRoleSet = !!(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();

      return new Response(JSON.stringify({
        ok: true,
        version: BUILD_VERSION,
        env: {
          ADMIN_SETUP_TOKEN_set: !!expected,
          ADMIN_SETUP_TOKEN_len: expected.length,
          SUPABASE_URL_set: supabaseUrlSet,
          SERVICE_ROLE_set: serviceRoleSet,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const token = (req.headers.get('x-admin-setup-token') || '').trim();
    const expected = (Deno.env.get('ADMIN_SETUP_TOKEN') || '').trim();
    if (!expected || token !== expected) {
      console.log('create-admin unauthorized', { providedLen: token.length, expectedSet: !!expected, version: BUILD_VERSION });
      return new Response(JSON.stringify({ error: 'Unauthorized', reason: !expected ? 'server_secret_missing' : 'token_mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { email, password, full_name } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create auth user (confirmed)
    const { data: userResult, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !userResult?.user) {
      return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const userId = userResult.user.id;

    // Upsert profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email,
        admin_role: 'admin_full',
        full_name: full_name || 'Administrator',
        verification_status: 'approved',
        is_verified: true,
        privacy_accepted: true,
        terms_accepted: true,
      }, { onConflict: 'user_id' });

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('create-admin error', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
