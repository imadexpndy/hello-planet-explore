import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function B2CDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Billetterie Publique</h1>
            <p className="text-muted-foreground">
              Bienvenue, {profile?.first_name || 'Visiteur'}
            </p>
          </div>
          <Button onClick={signOut} variant="outline">
            Déconnexion
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spectacles Disponibles</CardTitle>
              <CardDescription>Découvrir notre programmation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir les spectacles</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réserver des Places</CardTitle>
              <CardDescription>Choisir vos sièges et payer</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Réserver maintenant</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes Réservations</CardTitle>
              <CardDescription>Voir vos achats et tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Mes réservations</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan des Salles</CardTitle>
              <CardDescription>Choisir vos sièges préférés</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir les plans</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mon Profil</CardTitle>
              <CardDescription>Gérer mes informations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Modifier le profil</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>Vos anciens achats</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir l'historique</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Information Billetterie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Paiement uniquement par carte CMI</p>
              <p>• Sélection de sièges sur plan interactif</p>
              <p>• Aucun remboursement - modifications possibles jusqu'à 27h avant le spectacle</p>
              <p>• Tickets électroniques avec QR code</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}