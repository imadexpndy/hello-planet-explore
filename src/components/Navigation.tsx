import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { 
  Menu, 
  Home, 
  Users, 
  Calendar, 
  Building, 
  MessageSquare, 
  FileText, 
  Settings,
  LogOut,
  User,
  Ticket,
  School,
  Heart,
  Handshake,
  ShoppingCart
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Accueil', href: '/', icon: Home, roles: ['admin', 'teacher_private', 'teacher_public', 'association', 'partner', 'b2c_user'] },
  
  // Admin items
  { label: 'Spectacles', href: '/admin/spectacles', icon: Calendar, roles: ['admin'] },
  { label: 'Utilisateurs', href: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Organisations', href: '/admin/organizations', icon: Building, roles: ['admin'] },
  { label: 'Communications', href: '/admin/communications', icon: MessageSquare, roles: ['admin'] },
  { label: 'Audit', href: '/admin/audit', icon: FileText, roles: ['admin'] },
  
  // Teacher items
  { label: 'Mes Réservations', href: '/teacher/bookings', icon: Ticket, roles: ['teacher_private', 'teacher_public'] },
  { label: 'Nouvelle Réservation', href: '/teacher/new-booking', icon: Calendar, roles: ['teacher_private', 'teacher_public'] },
  { label: 'Mon École', href: '/teacher/organization', icon: School, roles: ['teacher_private', 'teacher_public'] },
  
  // Association items
  { label: 'Mes Réservations', href: '/association/bookings', icon: Ticket, roles: ['association'] },
  { label: 'Demander Places', href: '/association/request', icon: Heart, roles: ['association'] },
  { label: 'Mon Association', href: '/association/profile', icon: Building, roles: ['association'] },
  
  // Partner items
  { label: 'Mon Quota', href: '/partner/quota', icon: Ticket, roles: ['partner'] },
  { label: 'Allouer Places', href: '/partner/allocate', icon: Handshake, roles: ['partner'] },
  { label: 'Mes Associations', href: '/partner/associations', icon: Building, roles: ['partner'] },
  
  // B2C items
  { label: 'Spectacles', href: '/b2c/shows', icon: Calendar, roles: ['b2c_user'] },
  { label: 'Réserver', href: '/b2c/book', icon: ShoppingCart, roles: ['b2c_user'] },
  { label: 'Mes Réservations', href: '/b2c/bookings', icon: Ticket, roles: ['b2c_user'] },
];

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const userNavItems = navItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  );

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <h2 className="text-2xl font-bold text-primary">EDJS</h2>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {userNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link 
          to="/profile" 
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <User className="h-4 w-4" />
          Mon Profil
        </Link>
        
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <aside className="hidden md:flex w-72 bg-card border-r">
        <NavContent />
      </aside>
    </>
  );
};