import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardCard } from '@/components/DashboardCard';
import { StatsCard } from '@/components/StatsCard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Info } from 'lucide-react';
import {
  Theater,
  Ticket,
  ClipboardList,
  GraduationCap,
  FileText,
  Calendar,
  Users,
  BookOpen,
  AlertCircle
} from 'lucide-react';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  
  const isPrivateTeacher = profile?.verification_status === 'teacher_private';
  const isPublicTeacher = profile?.verification_status === 'teacher_public';
  const schoolType = isPrivateTeacher ? 'privée' : 'publique';

  const headerActions = (
    <div className="flex gap-2 items-center">
      <Badge variant={isPrivateTeacher ? "default" : "secondary"} className="text-xs">
        École {schoolType}
      </Badge>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Nouvelle réservation
      </Button>
    </div>
  );

  return (
    <DashboardLayout 
      title="Portail enseignant"
      subtitle={`Bienvenue, ${profile?.full_name || profile?.first_name || 'Enseignant'} - École ${schoolType}`}
      headerActions={headerActions}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Réservations actives"
          value="3"
          icon={ClipboardList}
          description="2 confirmées, 1 en attente"
        />
        <StatsCard
          title="Élèves inscrits"
          value="127"
          icon={Users}
          trend={{ value: 5, label: "cette semaine" }}
          description="Participants aux spectacles"
        />
        <StatsCard
          title="Spectacles vus"
          value="8"
          icon={Theater}
          description="Cette année scolaire"
        />
        <StatsCard
          title={isPrivateTeacher ? "Budget restant" : "Places disponibles"}
          value={isPrivateTeacher ? "2,450 DH" : "47"}
          icon={isPrivateTeacher ? FileText : Ticket}
          description={isPrivateTeacher ? "Budget annuel" : "Places gratuites restantes"}
        />
      </div>

      {/* Info Alert for Public Schools */}
      {isPublicTeacher && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>École Publique :</strong> Vous bénéficiez de 50 places gratuites par session. 
            Aucun ticket n'est généré - seul un registre de présence est nécessaire.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Spectacles disponibles"
          description="Découvrir la programmation adaptée à votre classe"
          icon={Theater}
          href={isPrivateTeacher ? "/teacher/private-booking" : "/teacher/public-booking"}
          buttonText="Voir les spectacles"
          gradient={true}
          badge="12 spectacles"
        />

        <DashboardCard
          title="Mes Réservations"
          description="Gérez vos réservations et téléchargez vos documents"
          icon={ClipboardList}
          href="/teacher/bookings"
          buttonText="Voir mes réservations"
          badge="3 actives"
          badgeVariant="secondary"
        />

        <DashboardCard
          title="Documents"
          description="Téléchargez vos devis, factures et billets"
          icon={FileText}
          href="/teacher/documents"
          buttonText="Accéder aux documents"
          badge={isPrivateTeacher ? "Devis/Factures" : "Gratuit"}
          badgeVariant="default"
        />
      </div>

      {/* School-specific Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Mon école"
          description="Informations et statistiques de votre établissement"
          icon={GraduationCap}
          href="/teacher/school"
          buttonText="Voir les infos"
        />

        {isPrivateTeacher && (
          <DashboardCard
            title="Devis en attente"
            description="Confirmer vos devis et procéder aux paiements"
            icon={FileText}
            href="/teacher/quotes"
            buttonText="Voir les devis"
            badge="2 en attente"
            badgeVariant="destructive"
          />
        )}

        <DashboardCard
          title="Calendrier scolaire"
          description="Planning des spectacles et disponibilités"
          icon={Calendar}
          href="/teacher/calendar"
          buttonText="Voir le calendrier"
        />

        <DashboardCard
          title="Ressources pédagogiques"
          description="Guides et fiches d'accompagnement des spectacles"
          icon={BookOpen}
          href="/teacher/resources"
          buttonText="Accéder aux ressources"
        />
      </div>

      {/* Private School Features */}
      {isPrivateTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard
            title="Gestion financière"
            description="Suivi des paiements, factures et budget annuel"
            icon={FileText}
            href="/teacher/finance"
            buttonText="Voir les finances"
          >
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Budget total : 5,000 DH</p>
              <p>• Dépensé : 2,550 DH</p>
              <p>• Restant : 2,450 DH</p>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Historique des spectacles"
            description="Tous vos spectacles de l'année avec évaluations"
            icon={Theater}
            href="/teacher/history"
            buttonText="Voir l'historique"
          >
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• 8 spectacles cette année</p>
              <p>• Note moyenne : 4.6/5</p>
              <p>• 347 élèves participants</p>
            </div>
          </DashboardCard>
        </div>
      )}
    </DashboardLayout>
  );
}