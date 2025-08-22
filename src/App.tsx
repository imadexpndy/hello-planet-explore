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
import AdminSpectacles from "./pages/admin/AdminSpectacles";
import AdminSessions from "./pages/admin/AdminSessions";
import PrivateSchoolBooking from "./pages/teacher/PrivateSchoolBooking";
import PublicSchoolBooking from "./pages/teacher/PublicSchoolBooking";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import AssociationDashboard from "./pages/dashboards/AssociationDashboard";
import AssociationBooking from "./pages/association/AssociationBooking";
import PartnerDashboard from "./pages/dashboards/PartnerDashboard";
import PartnerTicketAllocation from "./pages/partner/PartnerTicketAllocation";
import B2CDashboard from "./pages/dashboards/B2CDashboard";
import B2CBooking from "./pages/b2c/B2CBooking";
import AdminBookings from "./pages/admin/AdminBookings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { healthCheck } from "./pages/api/health";
import AdminSetup from "./pages/admin/AdminSetup";
import AdminApiKeys from "./pages/admin/AdminApiKeys";

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
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
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
              <Route 
                path="/admin/spectacles" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminSpectacles />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/sessions" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminSessions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/api-keys" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminApiKeys />
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
              <Route 
                path="/teacher/new-booking" 
                element={
                  <ProtectedRoute requiredRole="teacher_private">
                    <PrivateSchoolBooking />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher/public-booking" 
                element={
                  <ProtectedRoute requiredRole="teacher_public">
                    <PublicSchoolBooking />
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
              <Route 
                path="/association/new-booking" 
                element={
                  <ProtectedRoute requiredRole="association">
                    <AssociationBooking />
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
              <Route 
                path="/partner/allocate-tickets" 
                element={
                  <ProtectedRoute requiredRole="partner">
                    <PartnerTicketAllocation />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin setup (one-time) */}
              <Route path="/admin/setup" element={<AdminSetup />} />
              
              {/* Protected B2C Routes */}
              <Route 
                path="/b2c" 
                element={
                  <ProtectedRoute requiredRole="b2c_user">
                    <B2CDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/b2c/booking" 
                element={
                  <ProtectedRoute requiredRole="b2c_user">
                    <B2CBooking />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Admin Booking Routes */}
              <Route 
                path="/admin/bookings" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminBookings />
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
