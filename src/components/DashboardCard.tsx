import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  gradient?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  badge,
  badgeVariant = 'default',
  buttonText = 'Accéder',
  buttonVariant = 'default',
  gradient = false,
  disabled = false,
  children
}) => {
  const cardContent = (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${gradient ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-primary/10'}`}>
            <Icon className={`h-6 w-6 ${gradient ? 'text-white' : 'text-primary'}`} />
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
        {(href || onClick) && (
          <div className="mt-4">
            {href ? (
              <Button asChild variant={buttonVariant} className="w-full" disabled={disabled}>
                <Link to={href}>
                  {buttonText}
                </Link>
              </Button>
            ) : (
              <Button 
                variant={buttonVariant} 
                className="w-full" 
                onClick={onClick}
                disabled={disabled}
              >
                {buttonText}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </>
  );

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group animate-fade-in">
      {cardContent}
    </Card>
  );
};