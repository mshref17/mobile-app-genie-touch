import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationSettings {
  weeklyNotifications: boolean;
  dailyTipsNotifications: boolean;
  periodNotifications: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  weeklyNotifications: true,
  dailyTipsNotifications: true,
  periodNotifications: true,
};

export class NotificationService {
  private static readonly WEEKLY_NOTIFICATION_ID = 1;
  private static readonly DAILY_TIP_NOTIFICATION_ID = 2;
  private static readonly PERIOD_NOTIFICATION_ID = 3;
  private static readonly SETTINGS_KEY = 'notificationSettings';

  static async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static getSettings(): NotificationSettings {
    const saved = localStorage.getItem(this.SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  }

  static saveSettings(settings: NotificationSettings): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  static async scheduleWeeklyNotification(currentWeek: number, pregnancyStartDate: Date): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const settings = this.getSettings();
    if (!settings.weeklyNotifications) return;

    try {
      // Cancel existing weekly notification
      await LocalNotifications.cancel({
        notifications: [{ id: this.WEEKLY_NOTIFICATION_ID }]
      });

      // Calculate next week start date (every 7 days from pregnancy start)
      const nextWeekStart = new Date(pregnancyStartDate);
      nextWeekStart.setDate(nextWeekStart.getDate() + (currentWeek * 7));
      nextWeekStart.setHours(9, 0, 0, 0); // 9 AM

      // If the notification time has passed today, schedule for next week
      const now = new Date();
      if (nextWeekStart <= now) {
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.WEEKLY_NOTIFICATION_ID,
            title: '🎉 New Week Started!',
            body: `Congratulations! You've completed week ${currentWeek} and started week ${currentWeek + 1} of your pregnancy journey.`,
            schedule: {
              at: nextWeekStart,
              repeats: true,
              every: 'week'
            },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'weekly',
              week: currentWeek + 1
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling weekly notification:', error);
    }
  }

  static async scheduleDailyTipNotification(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const settings = this.getSettings();
    if (!settings.dailyTipsNotifications) return;

    try {
      // Cancel existing daily notification
      await LocalNotifications.cancel({
        notifications: [{ id: this.DAILY_TIP_NOTIFICATION_ID }]
      });

      // Schedule daily notification at 8 AM
      const now = new Date();
      const scheduleTime = new Date();
      scheduleTime.setHours(8, 0, 0, 0);

      // If 8 AM has passed today, schedule for tomorrow
      if (scheduleTime <= now) {
        scheduleTime.setDate(scheduleTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.DAILY_TIP_NOTIFICATION_ID,
            title: '💡 Daily Tip',
            body: 'Check out today\'s pregnancy tip to help you on your journey!',
            schedule: {
              at: scheduleTime,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'daily_tip'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling daily tip notification:', error);
    }
  }

  static async schedulePeriodNotifications(nextPeriodDate: Date): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const settings = this.getSettings();
    if (!settings.periodNotifications) return;

    try {
      // Cancel existing period notifications
      await LocalNotifications.cancel({
        notifications: [{ id: this.PERIOD_NOTIFICATION_ID }]
      });

      // Calculate notification start date (2 days before period)
      const notificationStart = new Date(nextPeriodDate);
      notificationStart.setDate(notificationStart.getDate() - 2);
      notificationStart.setHours(9, 0, 0, 0); // 9 AM

      // Only schedule if the notification date is in the future
      const now = new Date();
      if (notificationStart <= now) return;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.PERIOD_NOTIFICATION_ID,
            title: '🌸 Period Reminder',
            body: 'Your period is expected in 2 days. If it has already started, please update it in the app.',
            schedule: {
              at: notificationStart,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              type: 'period_reminder'
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling period notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: this.WEEKLY_NOTIFICATION_ID },
          { id: this.DAILY_TIP_NOTIFICATION_ID },
          { id: this.PERIOD_NOTIFICATION_ID }
        ]
      });
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  static async updateNotifications(
    settings: NotificationSettings, 
    currentWeek: number, 
    pregnancyStartDate: Date,
    nextPeriodDate?: Date
  ): Promise<void> {
    // Cancel all notifications first
    await this.cancelAllNotifications();

    // Reschedule based on new settings
    if (settings.weeklyNotifications) {
      await this.scheduleWeeklyNotification(currentWeek, pregnancyStartDate);
    }

    if (settings.dailyTipsNotifications) {
      await this.scheduleDailyTipNotification();
    }

    if (settings.periodNotifications && nextPeriodDate) {
      await this.schedulePeriodNotifications(nextPeriodDate);
    }

    this.saveSettings(settings);
  }
}