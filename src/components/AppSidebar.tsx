import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Ticket,
  Building2,
  GraduationCap,
  Heart,
  ShoppingCart,
  Shield,
  Home,
  UserCheck,
  Mail,
  FileText,
  LogOut,
  Theater,
  ClipboardList
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const { profile, signOut, isAdmin } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  // Navigation items based on user role
  const getNavigationItems = () => {
    const role = profile?.role;
    
    const commonItems = [
      { title: "Tableau de bord", url: getDashboardPath(), icon: Home },
      { title: "Profil", url: "/profile", icon: UserCheck },
    ];

    switch (role) {
      case 'admin_full':
      case 'super_admin':
        return [
          ...commonItems,
          { title: "Spectacles", url: "/admin/spectacles", icon: Theater },
          { title: "Sessions", url: "/admin/sessions", icon: Calendar },
          { title: "Réservations", url: "/admin/bookings", icon: ClipboardList },
          { title: "Utilisateurs", url: "/admin/users", icon: Users },
          { title: "Organisations", url: "/admin/organizations", icon: Building2 },
          { title: "Communications", url: "/admin/communications", icon: Mail },
          { title: "Audit", url: "/admin/audit", icon: Shield },
          { title: "Statistiques", url: "/admin/analytics", icon: BarChart3 },
        ];

      case 'teacher_private':
      case 'teacher_public':
        return [
          ...commonItems,
          { title: "Spectacles", url: "/teacher/shows", icon: Theater },
          { title: "Réserver", url: profile?.role === 'teacher_private' ? "/teacher/new-booking" : "/teacher/public-booking", icon: Ticket },
          { title: "Mes Réservations", url: "/teacher/bookings", icon: ClipboardList },
          { title: "Mon École", url: "/teacher/school", icon: GraduationCap },
          ...(profile?.role === 'teacher_private' ? [{ title: "Devis", url: "/teacher/quotes", icon: FileText }] : []),
        ];

      case 'association':
        return [
          ...commonItems,
          { title: "Spectacles", url: "/association/shows", icon: Theater },
          { title: "Réserver", url: "/association/new-booking", icon: Ticket },
          { title: "Mes Réservations", url: "/association/bookings", icon: ClipboardList },
          { title: "Mon Association", url: "/association/info", icon: Heart },
        ];

      case 'partner':
        return [
          ...commonItems,
          { title: "Sessions", url: "/partner/sessions", icon: Calendar },
          { title: "Allouer Tickets", url: "/partner/allocate-tickets", icon: Ticket },
          { title: "Mes Allocations", url: "/partner/allocations", icon: ClipboardList },
          { title: "Associations", url: "/partner/associations", icon: Users },
        ];

      case 'b2c_user':
        return [
          ...commonItems,
          { title: "Spectacles", url: "/b2c/shows", icon: Theater },
          { title: "Réserver", url: "/b2c/booking", icon: ShoppingCart },
          { title: "Mes Réservations", url: "/b2c/bookings", icon: ClipboardList },
          { title: "Plan des Salles", url: "/b2c/seating", icon: BookOpen },
        ];

      default:
        return commonItems;
    }
  };

  const getDashboardPath = () => {
    switch (profile?.role) {
      case 'admin_full':
      case 'super_admin':
        return '/admin';
      case 'teacher_private':
      case 'teacher_public':
        return '/teacher';
      case 'association':
        return '/association';
      case 'partner':
        return '/partner';
      case 'b2c_user':
        return '/b2c';
      default:
        return '/';
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Theater className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">EDJS</span>
              <span className="text-xs text-muted-foreground">École du Jeune Spectateur</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <Separator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive('/admin/settings')}>
                      <Link to="/admin/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {!isCollapsed && <span>Paramètres</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button 
                variant="ghost" 
                onClick={signOut}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Déconnexion</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}