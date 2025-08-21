import { supabase } from '@/integrations/supabase/client';

// Health check API endpoint
export const healthCheck = async () => {
  let supabaseStatus = false;
  
  try {
    // Test Supabase connection
    const { error } = await supabase.from('profiles').select('id').limit(1);
    supabaseStatus = !error;
  } catch (error) {
    console.error('Supabase health check failed:', error);
  }

  return {
    status: "ok",
    version: "1.0.0",
    commit: process.env.NODE_ENV === 'production' ? 'prod-build' : 'dev-build',
    timestamp: new Date().toISOString(),
    service: "EDJS Platform",
    supabase: supabaseStatus
  };
};

// For use with Express-like routing
export const healthHandler = async (req: any, res: any) => {
  const health = await healthCheck();
  res.json(health);
};