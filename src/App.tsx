import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRouter } from "@/components/RoleBasedRouter";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import AssociationDashboard from "./pages/dashboards/AssociationDashboard";
import PartnerDashboard from "./pages/dashboards/PartnerDashboard";
import B2CDashboard from "./pages/dashboards/B2CDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { healthCheck } from "./pages/api/health";

const queryClient = new QueryClient();

const App = () => {
  // Health API simulation for client-side
  if (window.location.pathname === '/api/health') {
    return (
      <div style={{ fontFamily: 'monospace', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h2>EDJS Platform Health Check</h2>
        <pre style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
          {JSON.stringify({
            status: "ok",
            version: "1.0.0", 
            commit: process.env.NODE_ENV === 'production' ? 'prod-build' : 'dev-build',
            timestamp: new Date().toISOString(),
            service: "EDJS Platform",
            supabase: true
          }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Teacher Routes */}
              <Route 
                path="/teacher" 
                element={
                  <ProtectedRoute allowedRoles={['teacher_private', 'teacher_public']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Association Routes */}
              <Route 
                path="/association" 
                element={
                  <ProtectedRoute requiredRole="association">
                    <AssociationDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Partner Routes */}
              <Route 
                path="/partner" 
                element={
                  <ProtectedRoute requiredRole="partner">
                    <PartnerDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected B2C Routes */}
              <Route 
                path="/b2c" 
                element={
                  <ProtectedRoute requiredRole="b2c_user">
                    <B2CDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
