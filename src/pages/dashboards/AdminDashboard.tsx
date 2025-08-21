import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 p-6">
        <Breadcrumbs />
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Tableau de bord Admin</h1>
            <p className="text-muted-foreground">
              Bienvenue, {profile?.first_name || profile?.name || 'Administrateur'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spectacles</CardTitle>
                <CardDescription>Gérer les spectacles et sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link to="/admin/spectacles">
                    <Button className="w-full">Gérer les spectacles</Button>
                  </Link>
                  <Link to="/admin/sessions">
                    <Button variant="outline" className="w-full">Gérer les sessions</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs</CardTitle>
                <CardDescription>Gérer les comptes utilisateurs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Gérer les utilisateurs</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Réservations</CardTitle>
                <CardDescription>Voir toutes les réservations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Voir les réservations</Button>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organisations</CardTitle>
              <CardDescription>Gérer écoles et associations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Gérer les organisations</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communications</CardTitle>
              <CardDescription>Historique des emails/WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir les communications</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit</CardTitle>
              <CardDescription>Logs d'activité système</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Voir les logs</Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </main>
    </div>
  );
}