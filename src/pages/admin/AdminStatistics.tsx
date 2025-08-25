import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/StatsCard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Download,
  DollarSign,
  Target
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminStatistics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeSpectacles: 0,
    conversionRate: 0,
    averageBookingValue: 0
  });
  const [chartData, setChartData] = useState({
    bookingsOverTime: [],
    revenueOverTime: [],
    usersByRole: [],
    bookingsByStatus: []
  });

  useEffect(() => {
    document.title = "Statistiques | EDJS";
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats
      const [usersRes, bookingsRes, spectaclesRes, revenueRes] = await Promise.all([
        supabase.from('profiles').select('id, role, created_at'),
        supabase.from('bookings').select('id, status, total_amount, created_at'),
        supabase.from('spectacles').select('id').eq('is_active', true),
        supabase.from('bookings').select('total_amount').eq('payment_status', 'completed')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (spectaclesRes.error) throw spectaclesRes.error;
      if (revenueRes.error) throw revenueRes.error;

      const users = usersRes.data || [];
      const bookings = bookingsRes.data || [];
      const spectacles = spectaclesRes.data || [];
      const revenue = revenueRes.data || [];

      // Calculate basic stats
      const totalRevenue = revenue.reduce((sum, booking) => sum + (parseFloat(booking.total_amount?.toString() || '0') || 0), 0);
      const paidBookings = bookings.filter(b => b.status === 'confirmed').length;
      const averageBookingValue = paidBookings > 0 ? totalRevenue / paidBookings : 0;
      const conversionRate = bookings.length > 0 ? (paidBookings / bookings.length) * 100 : 0;

      setStats({
        totalUsers: users.length,
        totalBookings: bookings.length,
        totalRevenue,
        activeSpectacles: spectacles.length,
        conversionRate,
        averageBookingValue
      });

      // Prepare chart data
      prepareChartData(users, bookings);

    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (users: any[], bookings: any[]) => {
    // Bookings over time (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const bookingsOverTime = last30Days.map(date => {
      const dayBookings = bookings.filter(b => 
        b.created_at.split('T')[0] === date
      ).length;
      
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        bookings: dayBookings
      };
    });

    // Revenue over time
    const revenueOverTime = last30Days.map(date => {
      const dayRevenue = bookings
        .filter(b => b.created_at.split('T')[0] === date)
        .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
      
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue
      };
    });

    // Users by role
    const roleCounts = users.reduce((acc, user) => {
      const role = user.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({
      role: role === 'b2c_user' ? 'Utilisateurs B2C' : 
            role === 'teacher_private' ? 'Enseignants Privés' :
            role === 'teacher_public' ? 'Enseignants Publics' :
            role === 'association' ? 'Associations' :
            role === 'partner' ? 'Partenaires' :
            role.startsWith('admin_') ? 'Administrateurs' : role,
      count
    }));

    // Bookings by status
    const statusCounts = bookings.reduce((acc, booking) => {
      const status = booking.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: status === 'pending' ? 'En attente' :
              status === 'confirmed' ? 'Confirmé' :
              status === 'cancelled' ? 'Annulé' : status,
      count
    }));

    setChartData({
      bookingsOverTime,
      revenueOverTime,
      usersByRole,
      bookingsByStatus
    });
  };

  const exportData = () => {
    try {
      const csvContent = [
        ['Métrique', 'Valeur'],
        ['Utilisateurs totaux', stats.totalUsers],
        ['Réservations totales', stats.totalBookings],
        ['Revenus totaux', `${stats.totalRevenue.toFixed(2)} MAD`],
        ['Spectacles actifs', stats.activeSpectacles],
        ['Taux de conversion', `${stats.conversionRate.toFixed(1)}%`],
        ['Valeur moyenne par réservation', `${stats.averageBookingValue.toFixed(2)} MAD`]
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Statistiques exportées avec succès');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erreur lors de l\'export des données');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const headerActions = (
    <div className="flex gap-2">
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">7 derniers jours</SelectItem>
          <SelectItem value="30d">30 derniers jours</SelectItem>
          <SelectItem value="90d">90 derniers jours</SelectItem>
          <SelectItem value="1y">Cette année</SelectItem>
        </SelectContent>
      </Select>
      
      <Button onClick={exportData} variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Exporter
      </Button>
    </div>
  );

  return (
    <DashboardLayout 
      title="Statistiques Avancées"
      subtitle="Analytics et métriques de performance"
      headerActions={headerActions}
    >

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Utilisateurs totaux"
          value={stats.totalUsers.toString()}
          icon={Users}
        />
        <StatsCard
          title="Réservations"
          value={stats.totalBookings.toString()}
          icon={Calendar}
        />
        <StatsCard
          title="Revenus"
          value={`${stats.totalRevenue.toFixed(0)} MAD`}
          icon={DollarSign}
        />
        <StatsCard
          title="Spectacles actifs"
          value={stats.activeSpectacles.toString()}
          icon={BarChart3}
        />
        <StatsCard
          title="Taux de conversion"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={Target}
        />
        <StatsCard
          title="Panier moyen"
          value={`${stats.averageBookingValue.toFixed(0)} MAD`}
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Évolution des réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.bookingsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Évolution du chiffre d'affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} MAD`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <div className="space-y-2">
                {chartData.usersByRole.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.role}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Statut des réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.bookingsByStatus} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="status" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}