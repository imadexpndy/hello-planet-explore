import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardCard } from '@/components/DashboardCard';
import { StatsCard } from '@/components/StatsCard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Info } from 'lucide-react';
import {
  Theater,
  Ticket,
  ClipboardList,
  BookOpen,
  CreditCard,
  Calendar,
  Users,
  Star,
  MapPin,
  Heart
} from 'lucide-react';

export default function B2CDashboard() {
  const { profile } = useAuth();

  const headerActions = (
    <Button size="sm">
      <ShoppingCart className="h-4 w-4 mr-2" />
      Réserver maintenant
    </Button>
  );

  return (
    <DashboardLayout 
      title="Billetterie publique"
      subtitle={`Bienvenue, ${profile?.full_name || profile?.first_name || 'Visiteur'}`}
      headerActions={headerActions}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Réservations"
          value="5"
          icon={ClipboardList}
          description="Billets achetés cette année"
        />
        <StatsCard
          title="Spectacles vus"
          value="12"
          icon={Theater}
          trend={{ value: 3, label: "ce mois" }}
          description="Votre historique de spectacles"
        />
        <StatsCard
          title="Note moyenne"
          value="4.8/5"
          icon={Star}
          description="Votre satisfaction moyenne"
        />
        <StatsCard
          title="Points fidélité"
          value="240"
          icon={Heart}
          trend={{ value: 15, label: "ce mois" }}
          description="Utilisables sur vos prochains achats"
        />
      </div>

      {/* Information Alert */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Billetterie en ligne :</strong> Paiement par carte CMI uniquement. 
          Sélection de sièges interactive et tickets électroniques avec QR code.
        </AlertDescription>
      </Alert>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          title="Spectacles à l'affiche"
          description="Découvrir notre programmation jeunesse"
          icon={Theater}
          href="/b2c/shows"
          buttonText="Voir les spectacles"
          gradient={true}
          badge="8 spectacles"
        />

        <DashboardCard
          title="Réserver des places"
          description="Choisir vos sièges et payer en ligne"
          icon={ShoppingCart}
          href="/b2c/booking"
          buttonText="Réserver maintenant"
          badge="Places disponibles"
          badgeVariant="secondary"
        />

        <DashboardCard
          title="Mes réservations"
          description="Voir vos achats et télécharger vos tickets"
          icon={ClipboardList}
          href="/b2c/bookings"
          buttonText="Mes réservations"
          badge="5 billets"
        />
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Plan des salles"
          description="Choisir vos sièges préférés"
          icon={MapPin}
          href="/b2c/seating"
          buttonText="Voir les plans"
        />

        <DashboardCard
          title="Programme détaillé"
          description="Horaires et descriptions des spectacles"
          icon={BookOpen}
          href="/b2c/program"
          buttonText="Consulter"
        />

        <DashboardCard
          title="Mes paiements"
          description="Historique et reçus de paiement"
          icon={CreditCard}
          href="/b2c/payments"
          buttonText="Voir les paiements"
        />

        <DashboardCard
          title="Calendrier"
          description="Toutes les dates de spectacles"
          icon={Calendar}
          href="/b2c/calendar"
          buttonText="Voir le calendrier"
        />
      </div>

      {/* Loyalty and Family Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard
          title="Programme fidélité"
          description="Profitez de réductions et avantages exclusifs"
          icon={Heart}
          href="/b2c/loyalty"
          buttonText="Voir mes avantages"
          gradient={true}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 240 points disponibles</p>
            <p>• Prochaine récompense : billet gratuit (300 points)</p>
            <p>• Réduction famille : -15% dès 4 billets</p>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Mes préférences"
          description="Personnaliser votre expérience et notifications"
          icon={Users}
          href="/b2c/preferences"
          buttonText="Gérer mes préférences"
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Âges préférés : 6-10 ans</p>
            <p>• Notifications : Email + WhatsApp</p>
            <p>• Sièges préférés : Centre, rangées 5-8</p>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}