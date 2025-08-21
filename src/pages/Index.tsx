import { useAuth } from '@/hooks/useAuth';
import { RoleBasedRouter } from '@/components/RoleBasedRouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, show role-based dashboard
  if (user) {
    return <RoleBasedRouter />;
  }

  // Public landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">EDJS</h1>
            <p className="text-sm text-muted-foreground">École du Jeune Spectateur</p>
          </div>
          <Link to="/auth">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-primary mb-6">
          Théâtre pour Enfants au Maroc
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Découvrez notre programmation de spectacles dédiés aux jeunes spectateurs. 
          Une expérience théâtrale unique pour éveiller l'imagination et la créativité.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg">Réserver des places</Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg">Espace Enseignant</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Nos Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Écoles Privées</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Réservations avec devis personnalisés. Paiement sécurisé et tickets avec QR code.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Écoles Publiques</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                50 places gratuites par session. Inscription simple avec vérification annuelle.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Associations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Places gratuites après vérification. Jusqu'à 5 accompagnateurs autorisés.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grand Public</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Billetterie en ligne avec sélection de sièges. Paiement par carte CMI.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
