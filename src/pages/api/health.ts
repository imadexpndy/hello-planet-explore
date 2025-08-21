// Health check API endpoint
export const healthCheck = () => {
  return {
    status: "ok",
    version: "1.0.0",
    commit: process.env.NODE_ENV === 'production' ? 'prod-build' : 'dev-build',
    timestamp: new Date().toISOString(),
    service: "EDJS Platform"
  };
};

// For use with Express-like routing
export const healthHandler = (req: any, res: any) => {
  res.json(healthCheck());
};