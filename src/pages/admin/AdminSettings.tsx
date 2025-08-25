import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, Database, Mail, Shield } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    platform_name: 'EDJS Platform',
    contact_email: 'contact@edjs.ma',
    support_email: 'support@edjs.ma',
    maintenance_mode: false,
    allow_registrations: true,
    max_bookings_per_user: 5,
    booking_deadline_hours: 48,
    email_notifications: true,
    sms_notifications: false,
    auto_confirmation: false,
    terms_version: '1.0',
    privacy_version: '1.0'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Paramètres Système | EDJS";
  }, []);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Paramètres sauvegardés avec succès!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setLoading(true);
      
      // Simulate cache clearing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Cache vidé avec succès!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Erreur lors du vidage du cache');
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseMaintenance = async () => {
    try {
      setLoading(true);
      
      // Simulate database maintenance
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('Maintenance de la base de données terminée!');
    } catch (error) {
      console.error('Error during database maintenance:', error);
      toast.error('Erreur lors de la maintenance de la base de données');
    } finally {
      setLoading(false);
    }
  };

  const headerActions = (
    <div className="flex gap-2">
      <Button onClick={handleClearCache} variant="outline" disabled={loading}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Vider le cache
      </Button>
      <Button onClick={handleSaveSettings} disabled={loading}>
        <Save className="h-4 w-4 mr-2" />
        Sauvegarder
      </Button>
    </div>
  );

  return (
    <DashboardLayout 
      title="Paramètres Système"
      subtitle="Configuration générale de la plateforme"
      headerActions={headerActions}
    >

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration générale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform_name">Nom de la plateforme</Label>
              <Input
                id="platform_name"
                value={settings.platform_name}
                onChange={(e) => setSettings({...settings, platform_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email de contact</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="support_email">Email support</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({...settings, support_email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="max_bookings">Réservations max par utilisateur</Label>
              <Input
                id="max_bookings"
                type="number"
                value={settings.max_bookings_per_user}
                onChange={(e) => setSettings({...settings, max_bookings_per_user: parseInt(e.target.value) || 5})}
              />
            </div>
            <div>
              <Label htmlFor="booking_deadline">Délai de réservation (heures)</Label>
              <Input
                id="booking_deadline"
                type="number"
                value={settings.booking_deadline_hours}
                onChange={(e) => setSettings({...settings, booking_deadline_hours: parseInt(e.target.value) || 48})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Contrôles des fonctionnalités
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance_mode">Mode maintenance</Label>
              <p className="text-sm text-muted-foreground">Désactive l'accès à la plateforme pour maintenance</p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => setSettings({...settings, maintenance_mode: checked})}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow_registrations">Autoriser les inscriptions</Label>
              <p className="text-sm text-muted-foreground">Permet aux nouveaux utilisateurs de s'inscrire</p>
            </div>
            <Switch
              id="allow_registrations"
              checked={settings.allow_registrations}
              onCheckedChange={(checked) => setSettings({...settings, allow_registrations: checked})}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_confirmation">Confirmation automatique</Label>
              <p className="text-sm text-muted-foreground">Confirme automatiquement les réservations</p>
            </div>
            <Switch
              id="auto_confirmation"
              checked={settings.auto_confirmation}
              onCheckedChange={(checked) => setSettings({...settings, auto_confirmation: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Paramètres de notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications">Notifications email</Label>
              <p className="text-sm text-muted-foreground">Activer les notifications par email</p>
            </div>
            <Switch
              id="email_notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => setSettings({...settings, email_notifications: checked})}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms_notifications">Notifications SMS</Label>
              <p className="text-sm text-muted-foreground">Activer les notifications par SMS</p>
            </div>
            <Switch
              id="sms_notifications"
              checked={settings.sms_notifications}
              onCheckedChange={(checked) => setSettings({...settings, sms_notifications: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Documents légaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="terms_version">Version CGU</Label>
              <Input
                id="terms_version"
                value={settings.terms_version}
                onChange={(e) => setSettings({...settings, terms_version: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="privacy_version">Version politique de confidentialité</Label>
              <Input
                id="privacy_version"
                value={settings.privacy_version}
                onChange={(e) => setSettings({...settings, privacy_version: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Maintenance système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Vider le cache
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDatabaseMaintenance}
              disabled={loading}
            >
              <Database className="h-4 w-4 mr-2" />
              Maintenance base de données
            </Button>
          </div>
        </CardContent>
        </Card>
    </DashboardLayout>
  );
}