import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import TeacherDashboard from '@/pages/dashboards/TeacherDashboard';
import AssociationDashboard from '@/pages/dashboards/AssociationDashboard';
import PartnerDashboard from '@/pages/dashboards/PartnerDashboard';
import B2CDashboard from '@/pages/dashboards/B2CDashboard';

export const RoleBasedRouter = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  switch (profile.role) {
    case 'admin_full':
    case 'super_admin':
      return <AdminDashboard />;
    case 'teacher_private':
    case 'teacher_public':
      return <TeacherDashboard />;
    case 'association':
      return <AssociationDashboard />;
    case 'partner':
      return <PartnerDashboard />;
    case 'b2c_user':
      return <B2CDashboard />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};