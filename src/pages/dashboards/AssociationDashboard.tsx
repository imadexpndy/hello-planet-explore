import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export default function AssociationDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Portail Association</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Bienvenue, {profile?.first_name || 'Association'}
              </p>
              <Badge variant={profile?.is_verified ? "default" : "secondary"}>
                {profile?.is_verified ? 'Vérifiée' : 'En attente de vérification'}
              </Badge>
            </div>
          </div>
          <Button onClick={signOut} variant="outline">
            Déconnexion
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spectacles Disponibles</CardTitle>
              <CardDescription>Voir la programmation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Consulter les spectacles</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demander des Places</CardTitle>
              <CardDescription>Places gratuites après vérification</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                disabled={!profile?.is_verified}
              >
                {profile?.is_verified ? 'Demander des places' : 'Vérification requise'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes Réservations</CardTitle>
              <CardDescription>Voir vos réservations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir mes réservations</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accompagnateurs</CardTitle>
              <CardDescription>Gérer vos accompagnateurs (max 5)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Gérer les accompagnateurs</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mon Association</CardTitle>
              <CardDescription>Informations et vérification</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir les infos</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>Vos anciennes réservations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir l'historique</Button>
            </CardContent>
          </Card>
        </div>

        {!profile?.is_verified && (
          <Card className="mt-6 border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Vérification Requise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Votre association doit être vérifiée avant de pouvoir réserver des places gratuites. 
                Veuillez contacter l'administration avec vos documents officiels.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}