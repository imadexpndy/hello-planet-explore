import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Shield, Search, Download, Filter, Eye } from 'lucide-react';

export default function AdminAudit() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    document.title = "Audit & Logs | EDJS";
    fetchAuditLogs();
  }, [filterAction, filterTable, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }
      
      if (filterTable !== 'all') {
        query = query.eq('table_name', filterTable);
      }

      // Apply date range
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          break;
      }

      if (dateRange !== 'all') {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Erreur lors du chargement des logs d\'audit');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        ['Date', 'Action', 'Table', 'Utilisateur', 'IP', 'Agent utilisateur'].join(','),
        ...auditLogs.map((log: any) => [
          new Date(log.created_at).toISOString(),
          log.action,
          log.table_name,
          log.user_id || 'Système',
          log.ip_address || 'N/A',
          `"${log.user_agent || 'N/A'}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Logs exportés avec succès');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Erreur lors de l\'export des logs');
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
        return <Badge variant="default">Création</Badge>;
      case 'update':
        return <Badge variant="secondary">Modification</Badge>;
      case 'delete':
        return <Badge variant="destructive">Suppression</Badge>;
      case 'select':
        return <Badge variant="outline">Lecture</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const filteredLogs = auditLogs.filter((log: any) =>
    searchTerm === '' || 
    log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const headerActions = (
    <Button onClick={exportLogs} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Exporter CSV
    </Button>
  );

  return (
    <DashboardLayout 
      title="Audit & Logs"
      subtitle="Surveillez l'activité de la plateforme"
      headerActions={headerActions}
    >

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="INSERT">Créations</SelectItem>
                  <SelectItem value="UPDATE">Modifications</SelectItem>
                  <SelectItem value="DELETE">Suppressions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Table</Label>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les tables</SelectItem>
                  <SelectItem value="profiles">Profils</SelectItem>
                  <SelectItem value="spectacles">Spectacles</SelectItem>
                  <SelectItem value="sessions">Sessions</SelectItem>
                  <SelectItem value="bookings">Réservations</SelectItem>
                  <SelectItem value="organizations">Organisations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Période</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Dernière 24h</SelectItem>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="90d">90 derniers jours</SelectItem>
                  <SelectItem value="all">Tout l'historique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Journal d'audit ({filteredLogs.length} entrées)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Heure</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                  <TableCell>
                    {log.user_id ? (
                      <span className="font-mono text-sm">{log.user_id.substring(0, 8)}...</span>
                    ) : (
                      <Badge variant="outline">Système</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.ip_address || 'N/A'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun log d'audit trouvé avec les filtres actuels
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}