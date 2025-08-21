import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeConfig: Record<string, BreadcrumbItem[]> = {
  '/': [{ label: 'Accueil' }],
  '/admin': [{ label: 'Accueil', href: '/' }, { label: 'Admin' }],
  '/admin/spectacles': [{ label: 'Accueil', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Spectacles' }],
  '/admin/users': [{ label: 'Accueil', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Utilisateurs' }],
  '/admin/organizations': [{ label: 'Accueil', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Organisations' }],
  '/admin/communications': [{ label: 'Accueil', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Communications' }],
  '/admin/audit': [{ label: 'Accueil', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Audit' }],
  
  '/teacher': [{ label: 'Accueil', href: '/' }, { label: 'Enseignant' }],
  '/teacher/bookings': [{ label: 'Accueil', href: '/' }, { label: 'Enseignant', href: '/teacher' }, { label: 'Réservations' }],
  '/teacher/new-booking': [{ label: 'Accueil', href: '/' }, { label: 'Enseignant', href: '/teacher' }, { label: 'Nouvelle Réservation' }],
  '/teacher/organization': [{ label: 'Accueil', href: '/' }, { label: 'Enseignant', href: '/teacher' }, { label: 'Mon École' }],
  
  '/association': [{ label: 'Accueil', href: '/' }, { label: 'Association' }],
  '/association/bookings': [{ label: 'Accueil', href: '/' }, { label: 'Association', href: '/association' }, { label: 'Réservations' }],
  '/association/request': [{ label: 'Accueil', href: '/' }, { label: 'Association', href: '/association' }, { label: 'Demander Places' }],
  '/association/profile': [{ label: 'Accueil', href: '/' }, { label: 'Association', href: '/association' }, { label: 'Mon Association' }],
  
  '/partner': [{ label: 'Accueil', href: '/' }, { label: 'Partenaire' }],
  '/partner/quota': [{ label: 'Accueil', href: '/' }, { label: 'Partenaire', href: '/partner' }, { label: 'Mon Quota' }],
  '/partner/allocate': [{ label: 'Accueil', href: '/' }, { label: 'Partenaire', href: '/partner' }, { label: 'Allouer Places' }],
  '/partner/associations': [{ label: 'Accueil', href: '/' }, { label: 'Partenaire', href: '/partner' }, { label: 'Mes Associations' }],
  
  '/b2c': [{ label: 'Accueil', href: '/' }, { label: 'Billetterie' }],
  '/b2c/shows': [{ label: 'Accueil', href: '/' }, { label: 'Billetterie', href: '/b2c' }, { label: 'Spectacles' }],
  '/b2c/book': [{ label: 'Accueil', href: '/' }, { label: 'Billetterie', href: '/b2c' }, { label: 'Réserver' }],
  '/b2c/bookings': [{ label: 'Accueil', href: '/' }, { label: 'Billetterie', href: '/b2c' }, { label: 'Mes Réservations' }],
  
  '/profile': [{ label: 'Accueil', href: '/' }, { label: 'Mon Profil' }],
  '/unauthorized': [{ label: 'Accueil', href: '/' }, { label: 'Accès refusé' }],
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const breadcrumbs = routeConfig[location.pathname] || [{ label: 'Page inconnue' }];

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors"
            >
              {index === 0 ? <Home className="h-4 w-4" /> : item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {index === 0 ? <Home className="h-4 w-4" /> : item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};