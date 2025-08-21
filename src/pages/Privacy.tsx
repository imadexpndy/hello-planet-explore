import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Politique de Confidentialité</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Collecte des données personnelles</h2>
                <p>
                  Nous collectons les données personnelles que vous nous fournissez directement lors de :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>La création de votre compte utilisateur</li>
                  <li>La réservation de spectacles</li>
                  <li>La communication avec notre service client</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Utilisation des données</h2>
                <p>
                  Vos données personnelles sont utilisées pour :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Gérer vos réservations et commandes</li>
                  <li>Vous envoyer des confirmations et rappels</li>
                  <li>Améliorer nos services</li>
                  <li>Respecter nos obligations légales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Partage des données</h2>
                <p>
                  Nous ne vendons, ne louons ni ne partageons vos données personnelles avec des tiers, 
                  sauf dans les cas suivants :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Avec votre consentement explicite</li>
                  <li>Pour répondre à une obligation légale</li>
                  <li>Avec nos prestataires de services (sous contrat de confidentialité)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Sécurité des données</h2>
                <p>
                  Nous mettons en place des mesures techniques et organisationnelles appropriées 
                  pour protéger vos données personnelles contre la perte, l'utilisation abusive, 
                  l'accès non autorisé, la divulgation, l'altération ou la destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Vos droits</h2>
                <p>
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Droit d'accès à vos données personnelles</li>
                  <li>Droit de rectification</li>
                  <li>Droit à l'effacement</li>
                  <li>Droit à la limitation du traitement</li>
                  <li>Droit à la portabilité des données</li>
                  <li>Droit d'opposition</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Cookies</h2>
                <p>
                  Notre site utilise des cookies techniques nécessaires au fonctionnement du service. 
                  Nous n'utilisons pas de cookies de tracking ou publicitaires sans votre consentement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Contact</h2>
                <p>
                  Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, 
                  vous pouvez nous contacter à : privacy@spectacles.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Modifications</h2>
                <p>
                  Cette politique de confidentialité peut être modifiée. La version en vigueur est 
                  celle publiée sur cette page avec la date de dernière mise à jour.
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