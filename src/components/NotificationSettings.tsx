import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationService, NotificationSettings } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  currentWeek: number;
  pregnancyStartDate: Date | null;
}

const NotificationSettingsComponent = ({ currentWeek, pregnancyStartDate }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());
  const [permissionRequested, setPermissionRequested] = useState(false);

  const requestNotificationPermissions = async () => {
    setPermissionRequested(true);
    const granted = await NotificationService.requestPermissions();
    
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive pregnancy notifications as configured.",
      });
    } else {
      toast({
        title: "Notifications Disabled",
        description: "Please enable notifications in your device settings to receive alerts.",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!permissionRequested) {
      await requestNotificationPermissions();
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (pregnancyStartDate) {
      await NotificationService.updateNotifications(newSettings, currentWeek, pregnancyStartDate);
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-pink-800 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('notificationSettings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{t('weeklyNotifications')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('weeklyNotificationsDesc')}
            </p>
          </div>
          <Switch
            checked={settings.weeklyNotifications}
            onCheckedChange={(checked) => updateSetting('weeklyNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{t('dailyTipsNotifications')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('dailyTipsNotificationsDesc')}
            </p>
          </div>
          <Switch
            checked={settings.dailyTipsNotifications}
            onCheckedChange={(checked) => updateSetting('dailyTipsNotifications', checked)}
          />
        </div>

        {!permissionRequested && (
          <Button 
            onClick={requestNotificationPermissions}
            className="w-full"
            variant="outline"
          >
            <Bell className="w-4 h-4 mr-2" />
            {t('enableNotifications')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsComponent;