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
    const { name, expires_at } = await req.json();
    
    if (!name) {
      throw new Error("API key name is required");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      throw new Error("Admin access required");
    }

    // Generate API key components
    const prefix = `edjs_${Math.random().toString(36).substring(2, 8)}`;
    const secret = crypto.randomUUID().replace(/-/g, '');
    const fullApiKey = `${prefix}_${secret}`;
    
    // Hash the secret part for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store the API key
    const { data: apiKey, error: insertError } = await supabaseClient
      .from('api_keys')
      .insert({
        name,
        key_hash: hashHex,
        key_prefix: prefix,
        created_by: user.user.id,
        expires_at: expires_at || null,
        permissions: { full_access: true }
      })
      .select()
      .single();

    if (insertError) {
      console.error('API key creation error:', insertError);
      throw new Error("Failed to create API key");
    }

    // Log the creation
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'api_key_created',
        table_name: 'api_keys',
        record_id: apiKey.id,
        user_id: user.user.id,
        new_values: {
          name,
          key_prefix: prefix,
          expires_at: expires_at || null
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        api_key: fullApiKey, // Only return once!
        key_id: apiKey.id,
        name: apiKey.name,
        prefix: prefix,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('API key generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});