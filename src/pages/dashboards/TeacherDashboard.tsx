import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export default function TeacherDashboard() {
  const { profile, signOut } = useAuth();

  const isPrivateTeacher = profile?.role === 'teacher_private';
  const isPublicTeacher = profile?.role === 'teacher_public';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Portail Enseignant</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Bienvenue, {profile?.first_name || 'Enseignant'}
              </p>
              <Badge variant={isPrivateTeacher ? "default" : "secondary"}>
                {isPrivateTeacher ? 'École Privée' : 'École Publique'}
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
              <CardTitle>Nouvelle Réservation</CardTitle>
              <CardDescription>
                {isPrivateTeacher ? 'Réserver pour votre école' : 'Demander des places gratuites'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Faire une réservation</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes Réservations</CardTitle>
              <CardDescription>Voir vos réservations en cours</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir mes réservations</Button>
            </CardContent>
          </Card>

          {isPrivateTeacher && (
            <Card>
              <CardHeader>
                <CardTitle>Devis en Attente</CardTitle>
                <CardDescription>Confirmer vos devis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Voir les devis</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Mon Organisation</CardTitle>
              <CardDescription>Informations de votre école</CardDescription>
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

        {isPublicTeacher && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">Information École Publique</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                En tant qu'école publique, vous bénéficiez de 50 places gratuites par session. 
                Aucun ticket n'est généré - seul un registre de présence est nécessaire.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}