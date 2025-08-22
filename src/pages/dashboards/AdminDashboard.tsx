import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardCard } from '@/components/DashboardCard';
import { StatsCard } from '@/components/StatsCard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Theater,
  Calendar,
  Users,
  ClipboardList,
  Building2,
  Mail,
  Shield,
  BarChart3,
  Settings,
  UserCheck,
  Ticket,
  TrendingUp,
  Eye,
  Key
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();

  const headerActions = (
    <div className="flex gap-2">
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Nouveau spectacle
      </Button>
      <Button variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle session
      </Button>
    </div>
  );

  return (
    <DashboardLayout 
      title="Tableau de bord administrateur"
      subtitle={`Bienvenue, ${profile?.full_name || profile?.first_name || 'Administrateur'}`}
      headerActions={headerActions}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Spectacles actifs"
          value="12"
          icon={Theater}
          trend={{ value: 8, label: "ce mois" }}
          description="3 nouveaux spectacles"
        />
        <StatsCard
          title="Sessions planifiées"
          value="45"
          icon={Calendar}
          trend={{ value: 15, label: "cette semaine" }}
          description="8 sessions cette semaine"
        />
        <StatsCard
          title="Utilisateurs actifs"
          value="1,247"
          icon={Users}
          trend={{ value: 12, label: "ce mois" }}
          description="156 nouveaux utilisateurs"
        />
        <StatsCard
          title="Réservations totales"
          value="3,456"
          icon={Ticket}
          trend={{ value: 23, label: "ce mois" }}
          description="578 réservations ce mois"
        />
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Gestion des spectacles"
          description="Créer, modifier et gérer tous les spectacles de la programmation"
          icon={Theater}
          href="/admin/spectacles"
          buttonText="Gérer les spectacles"
          gradient={true}
          badge="12 actifs"
        />

        <DashboardCard
          title="Sessions et horaires"
          description="Planifier les sessions, définir les horaires et gérer les capacités"
          icon={Calendar}
          href="/admin/sessions"
          buttonText="Gérer les sessions"
          badge="45 sessions"
        />

        <DashboardCard
          title="Réservations"
          description="Voir toutes les réservations, statuts de paiement et validation"
          icon={ClipboardList}
          href="/admin/bookings"
          buttonText="Voir les réservations"
          badge="1,234 réservations"
          badgeVariant="secondary"
        />
      </div>

      {/* Secondary Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Utilisateurs"
          description="Gérer les comptes et vérifications"
          icon={Users}
          href="/admin/users"
          buttonText="Gérer"
          badge="23 en attente"
          badgeVariant="destructive"
        />

        <DashboardCard
          title="Organisations"
          description="Écoles et associations partenaires"
          icon={Building2}
          href="/admin/organizations"
          buttonText="Voir"
        />

        <DashboardCard
          title="Communications"
          description="Historique emails et WhatsApp"
          icon={Mail}
          href="/admin/communications"
          buttonText="Historique"
        />

        <DashboardCard
          title="Audit & Logs"
          description="Logs d'activité et sécurité"
          icon={Shield}
          href="/admin/audit"
          buttonText="Consulter"
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Statistiques avancées"
          description="Tableaux de bord détaillés et métriques de performance"
          icon={BarChart3}
          href="/admin/analytics"
          buttonText="Voir les stats"
          gradient={true}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>+23% de réservations ce mois</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>2,456 vues de spectacles</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Clés API"
          description="Générer et gérer les clés API pour l'accès mobile"
          icon={Key}
          href="/admin/api-keys"
          buttonText="Gérer les clés"
          gradient={true}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Accès complet aux données</p>
            <p>• Intégration mobile et externe</p>
            <p>• Gestion des permissions</p>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Paramètres système"
          description="Configuration générale, tarifs et paramètres avancés"
          icon={Settings}
          href="/admin/settings"
          buttonText="Configurer"
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Gestion des rôles et permissions</p>
            <p>• Configuration des paiements</p>
            <p>• Paramètres de notification</p>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}