import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  headerActions 
}) => {
  const { profile, signOut } = useAuth();

  const getUserInitials = () => {
    const name = profile?.full_name || profile?.first_name || profile?.name || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeVariant = () => {
    switch (profile?.role) {
      case 'admin_full':
      case 'super_admin':
        return 'destructive';
      case 'teacher_private':
        return 'default';
      case 'teacher_public':
        return 'secondary';
      case 'association':
        return 'outline';
      case 'partner':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = () => {
    switch (profile?.role) {
      case 'admin_full':
        return 'Administrateur';
      case 'super_admin':
        return 'Super Admin';
      case 'teacher_private':
        return 'École Privée';
      case 'teacher_public':
        return 'École Publique';
      case 'association':
        return 'Association';
      case 'partner':
        return 'Partenaire';
      case 'b2c_user':
        return 'Client';
      default:
        return 'Utilisateur';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-full items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-2" />
                <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher..." 
                    className="border-0 bg-muted/50 focus-visible:ring-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">3</Badge>
                </Button>
                
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center gap-3 pl-2 border-l">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">
                      {profile?.full_name || profile?.first_name || 'Utilisateur'}
                    </p>
                    <Badge variant={getRoleBadgeVariant()} className="text-xs">
                      {getRoleDisplayName()}
                    </Badge>
                  </div>
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground animate-fade-in">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {headerActions && (
                    <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                      {headerActions}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};