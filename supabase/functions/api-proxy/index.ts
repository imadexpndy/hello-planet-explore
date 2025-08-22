import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      throw new Error("API key is required");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify API key
    const { data: keyValidation, error: keyError } = await supabaseClient
      .rpc('verify_api_key', { api_key_input: apiKey });

    if (keyError || !keyValidation || keyValidation.length === 0 || !keyValidation[0].is_valid) {
      throw new Error("Invalid API key");
    }

    const { permissions } = keyValidation[0];

    // Parse the request URL to determine the action
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Remove 'api-proxy' from path
    const apiPath = pathSegments.slice(1).join('/');
    
    // Handle different API endpoints
    let response;
    
    if (apiPath.startsWith('spectacles')) {
      response = await handleSpectaclesAPI(req, supabaseClient, apiPath, permissions);
    } else if (apiPath.startsWith('sessions')) {
      response = await handleSessionsAPI(req, supabaseClient, apiPath, permissions);
    } else if (apiPath.startsWith('bookings')) {
      response = await handleBookingsAPI(req, supabaseClient, apiPath, permissions);
    } else if (apiPath.startsWith('users') || apiPath.startsWith('profiles')) {
      response = await handleUsersAPI(req, supabaseClient, apiPath, permissions);
    } else if (apiPath.startsWith('notifications')) {
      response = await handleNotificationsAPI(req, supabaseClient, apiPath, permissions);
    } else {
      throw new Error(`API endpoint not found: ${apiPath}`);
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('API proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message.includes('not found') ? 404 : 500,
      }
    );
  }
});

async function handleSpectaclesAPI(req: Request, supabase: any, path: string, permissions: any) {
  const method = req.method;
  const url = new URL(req.url);
  
  if (method === 'GET') {
    // Get all spectacles or specific spectacle
    const spectacleId = path.split('/')[1];
    
    let query = supabase.from('spectacles').select('*');
    
    if (spectacleId) {
      query = query.eq('id', spectacleId).single();
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  }
  
  // Only platform admins can create/modify spectacles
  if (method === 'POST' && permissions.full_access) {
    const body = await req.json();
    const { data, error } = await supabase
      .from('spectacles')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  }
  
  throw new Error('Method not allowed or insufficient permissions');
}

async function handleSessionsAPI(req: Request, supabase: any, path: string, permissions: any) {
  const method = req.method;
  
  if (method === 'GET') {
    const sessionId = path.split('/')[1];
    
    let query = supabase.from('sessions').select(`
      *,
      spectacles:spectacle_id (*)
    `);
    
    if (sessionId) {
      query = query.eq('id', sessionId).single();
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  }
  
  // Only platform admins can create/modify sessions
  if (method === 'POST' && permissions.full_access) {
    const body = await req.json();
    const { data, error } = await supabase
      .from('sessions')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  }
  
  throw new Error('Method not allowed or insufficient permissions');
}

async function handleBookingsAPI(req: Request, supabase: any, path: string, permissions: any) {
  const method = req.method;
  
  if (method === 'GET') {
    const bookingId = path.split('/')[1];
    
    let query = supabase.from('bookings').select(`
      *,
      sessions:session_id (*),
      profiles:user_id (*)
    `);
    
    if (bookingId) {
      query = query.eq('id', bookingId).single();
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  }
  
  // Mobile app can create bookings
  if (method === 'POST') {
    const body = await req.json();
    const { data, error } = await supabase
      .from('bookings')
      .insert(body)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  }
  
  throw new Error('Method not allowed');
}

async function handleUsersAPI(req: Request, supabase: any, path: string, permissions: any) {
  const method = req.method;
  
  if (method === 'GET') {
    const userId = path.split('/')[1];
    
    let query = supabase.from('profiles').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId).single();
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data };
  }
  
  // Mobile app can register users and update profiles
  if (method === 'POST') {
    const body = await req.json();
    const { data, error } = await supabase
      .from('profiles')
      .upsert(body)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  }
  
  throw new Error('Method not allowed');
}

async function handleNotificationsAPI(req: Request, supabase: any, path: string, permissions: any) {
  const method = req.method;
  
  if (method === 'POST' && permissions.full_access) {
    const body = await req.json();
    const { to, subject, message, type = 'email' } = body;
    
    if (!to || !subject || !message) {
      throw new Error('Missing required fields: to, subject, message');
    }
    
    // Send notification via email function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html: message
      }
    });
    
    if (error) throw error;
    
    return { success: true, message: 'Notification sent', data };
  }
  
  throw new Error('Method not allowed or insufficient permissions');
}