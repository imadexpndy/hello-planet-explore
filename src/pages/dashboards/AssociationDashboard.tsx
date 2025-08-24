import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardCard } from '@/components/DashboardCard';
import { StatsCard } from '@/components/StatsCard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Heart } from 'lucide-react';
import {
  Theater,
  Ticket,
  ClipboardList,
  Users,
  Calendar,
  FileText
} from 'lucide-react';

export default function AssociationDashboard() {
  const { profile } = useAuth();

  const headerActions = (
    <Button size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Nouvelle réservation
    </Button>
  );

  return (
    <DashboardLayout 
      title="Portail association"
      subtitle={`Bienvenue, ${profile?.full_name || profile?.contact_person || 'Association'}`}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Réservations actives"
          value="2"
          icon={ClipboardList}
          description="Places confirmées"
        />
        <StatsCard
          title="Bénéficiaires"
          value="85"
          icon={Users}
          description="Enfants accompagnés"
        />
        <StatsCard
          title="Spectacles vus"
          value="6"
          icon={Theater}
          description="Cette année"
        />
        <StatsCard
          title="Accompagnateurs"
          value="5"
          icon={Users}
          description="Maximum autorisé"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Spectacles disponibles"
          description="Programmation par tranche d'âge"
          icon={Theater}
          href="/association/booking"
          buttonText="Voir les spectacles"
          gradient={true}
        />

        <DashboardCard
          title="Mes réservations"
          description="Suivre vos réservations"
          icon={ClipboardList}
          href="/association/bookings"
          buttonText="Mes réservations"
          badge="2 actives"
        />

        <DashboardCard
          title="Documents"
          description="Téléchargez vos confirmations et billets gratuits"
          icon={FileText}
          href="/association/documents"
          buttonText="Accéder aux documents"
          badge="Gratuit"
          badgeVariant="secondary"
        />

        <DashboardCard
          title="Mon association"
          description="Informations et vérification"
          icon={Heart}
          href="/association/info"
          buttonText="Voir les infos"
        />

        <DashboardCard
          title="Accompagnateurs"
          description="Gérer les adultes (max 5)"
          icon={Users}
          href="/association/chaperones"
          buttonText="Gérer"
        />

        <DashboardCard
          title="Documents"
          description="Attestations et autorisations"
          icon={FileText}
          href="/association/documents"
          buttonText="Mes documents"
        />
      </div>
    </DashboardLayout>
  );
}