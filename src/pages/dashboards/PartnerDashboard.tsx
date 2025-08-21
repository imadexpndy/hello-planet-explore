import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export default function PartnerDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Portail Partenaire</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Bienvenue, {profile?.first_name || 'Partenaire'}
              </p>
              <Badge variant="default">Partenaire Officiel</Badge>
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
              <CardTitle>Mon Quota</CardTitle>
              <CardDescription>50 tickets par session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir mon quota</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allouer des Places</CardTitle>
              <CardDescription>Distribuer aux associations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Allouer des places</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes Associations</CardTitle>
              <CardDescription>Gérer vos associations bénéficiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir les associations</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allocations Actives</CardTitle>
              <CardDescription>Voir les allocations en cours</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir les allocations</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>Historique des allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir l'historique</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Information Partenaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              En tant que partenaire, vous disposez de 50 tickets par session que vous pouvez allouer 
              à vos associations partenaires. Les tickets doivent mentionner le nom du partenaire 
              et de l'association bénéficiaire.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}