import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationService, NotificationSettings } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface NotificationSettingsProps {
  currentWeek: number;
  pregnancyStartDate: Date | null;
  trackingMode?: 'pregnant' | 'period' | null;
  nextPeriodDate?: Date;
}

const NotificationSettingsComponent = ({ currentWeek, pregnancyStartDate, trackingMode, nextPeriodDate }: NotificationSettingsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    // Request permissions first if enabling any notification on native platform
    if (value && Capacitor.isNativePlatform()) {
      const granted = await NotificationService.requestPermissions();
      
      if (!granted) {
        toast({
          title: t('notificationsDisabled'),
          description: t('notificationsDisabledDesc'),
          variant: "destructive",
        });
        return;
      }
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (pregnancyStartDate) {
      await NotificationService.updateNotifications(newSettings, currentWeek, pregnancyStartDate, nextPeriodDate);
      
      // Only show success toast on native platform
      if (Capacitor.isNativePlatform()) {
        toast({
          title: t('settingsUpdated'),
          description: t('settingsUpdatedDesc'),
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-pink-800 flex items-center gap-2 font-medium">
        <Bell className="w-4 h-4" />
        {t('notificationSettings')}
      </h4>
      
      <div className="space-y-4">
        {trackingMode === 'pregnant' && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('weeklyNotifications')}</Label>
                <p className="text-xs text-muted-foreground">
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
                <Label className="text-sm font-medium">{t('dailyTipsNotifications')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('dailyTipsNotificationsDesc')}
                </p>
              </div>
              <Switch
                checked={settings.dailyTipsNotifications}
                onCheckedChange={(checked) => updateSetting('dailyTipsNotifications', checked)}
              />
            </div>
          </>
        )}

        {trackingMode === 'period' && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{t('periodNotifications')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('periodNotificationsDesc')}
              </p>
            </div>
            <Switch
              checked={settings.periodNotifications}
              onCheckedChange={(checked) => updateSetting('periodNotifications', checked)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsComponent;