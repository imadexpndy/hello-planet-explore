import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Conditions d'Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Objet</h2>
                <p>
                  Les présentes conditions d'utilisation régissent l'accès et l'utilisation de la plateforme 
                  de réservation de spectacles. En utilisant notre service, vous acceptez ces conditions 
                  dans leur intégralité.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Description du service</h2>
                <p>
                  Notre plateforme permet la réservation de spectacles pour différents types d'utilisateurs :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Particuliers (B2C)</li>
                  <li>Enseignants d'écoles publiques et privées</li>
                  <li>Associations</li>
                  <li>Partenaires</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Inscription et compte utilisateur</h2>
                <p>
                  L'inscription sur la plateforme nécessite la fourniture d'informations exactes et complètes. 
                  Vous vous engagez à maintenir ces informations à jour et à protéger vos identifiants de connexion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Réservations</h2>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">4.1 Processus de réservation</h3>
                  <p>
                    Les réservations sont soumises à disponibilité. Une confirmation vous sera envoyée 
                    par email après validation de votre demande.
                  </p>
                  
                  <h3 className="text-lg font-medium">4.2 Tarification</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>B2C : tarifs pleins selon la grille tarifaire</li>
                    <li>Écoles publiques : places gratuites dans la limite des quotas</li>
                    <li>Écoles privées : tarifs préférentiels sur devis</li>
                    <li>Associations et partenaires : conditions spécifiques</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Paiement</h2>
                <p>
                  Les paiements peuvent s'effectuer par :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Carte bancaire (paiement sécurisé CMI)</li>
                  <li>Virement bancaire (écoles privées)</li>
                  <li>Chèque (écoles privées)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Annulation et remboursement</h2>
                <p>
                  Les conditions d'annulation varient selon le type de réservation et le délai de préavis. 
                  Contactez notre service client pour connaître les modalités applicables à votre réservation.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Responsabilité</h2>
                <p>
                  Notre responsabilité se limite à la fourniture du service de réservation. 
                  Nous ne saurions être tenus responsables des dommages indirects ou de la perte de données.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Propriété intellectuelle</h2>
                <p>
                  Tous les éléments de la plateforme (textes, images, logos, etc.) sont protégés par 
                  les droits de propriété intellectuelle. Toute reproduction non autorisée est interdite.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Protection des données</h2>
                <p>
                  Le traitement de vos données personnelles est régi par notre politique de confidentialité, 
                  conforme au RGPD.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Droit applicable</h2>
                <p>
                  Les présentes conditions sont régies par le droit français. 
                  Tout litige sera de la compétence des tribunaux français.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contact</h2>
                <p>
                  Pour toute question relative à ces conditions d'utilisation : support@spectacles.com
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};