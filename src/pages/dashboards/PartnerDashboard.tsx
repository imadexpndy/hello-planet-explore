import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardCard } from '@/components/DashboardCard';
import { StatsCard } from '@/components/StatsCard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Ticket,
  ClipboardList,
  Users,
  Calendar,
  BarChart3,
  Target
} from 'lucide-react';

export default function PartnerDashboard() {
  const { profile } = useAuth();

  const headerActions = (
    <Button size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Nouvelle allocation
    </Button>
  );

  return (
    <DashboardLayout 
      title="Portail partenaire"
      subtitle={`Bienvenue, ${profile?.full_name || profile?.name || 'Partenaire'}`}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Quota mensuel"
          value="50"
          icon={Ticket}
          description="Tickets par session"
        />
        <StatsCard
          title="Tickets alloués"
          value="342"
          icon={Target}
          trend={{ value: 18, label: "ce mois" }}
          description="Total ce mois"
        />
        <StatsCard
          title="Associations"
          value="12"
          icon={Users}
          description="Partenaires actifs"
        />
        <StatsCard
          title="Taux d'utilisation"
          value="85%"
          icon={BarChart3}
          description="Tickets utilisés"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Sessions disponibles"
          description="Voir vos quotas par session"
          icon={Calendar}
          href="/partner/sessions"
          buttonText="Voir les sessions"
          gradient={true}
        />

        <DashboardCard
          title="Allouer des tickets"
          description="Distribuer aux associations"
          icon={Ticket}
          href="/partner/ticket-allocation"
          buttonText="Allouer"
          badge="50 disponibles"
        />

        <DashboardCard
          title="Mes allocations"
          description="Suivre vos allocations"
          icon={ClipboardList}
          href="/partner/allocations"
          buttonText="Voir"
        />

        <DashboardCard
          title="Associations"
          description="Gérer vos partenaires"
          icon={Users}
          href="/partner/associations"
          buttonText="Gérer"
        />

        <DashboardCard
          title="Statistiques"
          description="Rapports d'utilisation"
          icon={BarChart3}
          href="/partner/statistics"
          buttonText="Stats"
        />
      </div>
    </DashboardLayout>
  );
}