import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Baby, Users, Heart, Settings, CalendarDays, Clock, Star, Gift, Info, Lightbulb } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, addDays, differenceInDays, differenceInWeeks, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

import WeeklyInfo from "@/components/WeeklyInfo";
import Community from "@/components/Community";
import DailyTip from "@/components/DailyTip";
import NotificationSettings from "@/components/NotificationSettings";
import { BottomNavigation } from "@/components/BottomNavigation";
import SplashScreen from "@/components/SplashScreen";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { NotificationService } from "@/lib/notifications";
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import backgroundImage from "@/assets/newbgnine.jpg";

const appLogo = "/app-icon.png";

const Index = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [trackingMode, setTrackingMode] = useState<'pregnant' | 'period' | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<Date>();
  const [dueDateMode, setDueDateMode] = useState<'period' | 'duedate'>('period');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodDuration, setPeriodDuration] = useState<number>(5);
  const [isPeriodDatePickerOpen, setIsPeriodDatePickerOpen] = useState(false);
  const [selectedPeriodStartDate, setSelectedPeriodStartDate] = useState<Date>();
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);
  const [showMonthNumbers, setShowMonthNumbers] = useState(false);
  const [openBabyMessage, setOpenBabyMessage] = useState(false);
  const [isDailyTipOpen, setIsDailyTipOpen] = useState(false);
  const [dailyTip, setDailyTip] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedDate = localStorage.getItem('lastPeriodDate');
    const savedMode = localStorage.getItem('dueDateMode') as 'period' | 'duedate' || 'period';
    const savedTrackingMode = localStorage.getItem('trackingMode') as 'pregnant' | 'period' || null;
    const savedCycleLength = localStorage.getItem('cycleLength');
    const savedPeriodDuration = localStorage.getItem('periodDuration');
    const savedMonthFormat = localStorage.getItem('showMonthNumbers');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedMonthFormat) setShowMonthNumbers(savedMonthFormat === 'true');
    if (savedDarkMode) {
      const isDark = savedDarkMode === 'true';
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    }
    
    if (savedDate && savedTrackingMode) {
      const date = new Date(savedDate);
      setLastPeriodDate(date);
      setIsFirstTime(false);
      setDueDateMode(savedMode);
      setTrackingMode(savedTrackingMode);
      
      if (savedCycleLength) setCycleLength(parseInt(savedCycleLength));
      if (savedPeriodDuration) setPeriodDuration(parseInt(savedPeriodDuration));
      
      // Initialize notifications when app loads
      if (savedTrackingMode === 'pregnant') {
        const pregnancyInfo = calculatePregnancyInfoForDate(date);
        if (pregnancyInfo) {
          NotificationService.scheduleWeeklyNotification(pregnancyInfo.weeksPregnant, date);
          NotificationService.scheduleDailyTipNotification();
        }
      } else if (savedTrackingMode === 'period' && savedCycleLength) {
        const nextPeriod = addDays(date, parseInt(savedCycleLength));
        NotificationService.schedulePeriodNotifications(nextPeriod);
      }
    }

    // Listen for notification actions
    if (Capacitor.isNativePlatform()) {
      let listenerHandle: any;
      
      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (notification: { notification: LocalNotificationSchema }) => {
          const extra = notification.notification.extra;
          
          if (extra?.type === 'weekly') {
            // Navigate to weekly tab and open baby message
            setActiveTab('weekly');
            setTimeout(() => {
              setOpenBabyMessage(true);
            }, 100);
          } else if (extra?.type === 'daily_tip') {
            // Navigate to dashboard for daily tips
            setActiveTab('dashboard');
          }
        }
      ).then((handle) => {
        listenerHandle = handle;
      });

      return () => {
        if (listenerHandle) {
          listenerHandle.remove();
        }
      };
    }
  }, []);

  const handleDateSubmit = () => {
    // Cancel all previous notifications when switching modes
    NotificationService.cancelAllNotifications();
    
    if (trackingMode === 'period' && selectedDate) {
      setLastPeriodDate(selectedDate);
      localStorage.setItem('lastPeriodDate', selectedDate.toISOString());
      localStorage.setItem('trackingMode', 'period');
      localStorage.setItem('cycleLength', cycleLength.toString());
      localStorage.setItem('periodDuration', periodDuration.toString());
      setIsFirstTime(false);
      
      // Schedule period notifications
      const nextPeriod = addDays(selectedDate, cycleLength);
      NotificationService.schedulePeriodNotifications(nextPeriod);
    } else if (trackingMode === 'pregnant') {
      if (dueDateMode === 'period' && selectedDate) {
        setLastPeriodDate(selectedDate);
        localStorage.setItem('lastPeriodDate', selectedDate.toISOString());
        localStorage.setItem('dueDateMode', 'period');
        localStorage.setItem('trackingMode', 'pregnant');
        setIsFirstTime(false);
      } else if (dueDateMode === 'duedate' && selectedDueDate) {
        const calculatedLastPeriod = subDays(selectedDueDate, 280);
        setLastPeriodDate(calculatedLastPeriod);
        localStorage.setItem('lastPeriodDate', calculatedLastPeriod.toISOString());
        localStorage.setItem('dueDateMode', 'duedate');
        localStorage.setItem('trackingMode', 'pregnant');
        setIsFirstTime(false);
      }
    }
  };

  const handlePeriodStarted = (date: Date | undefined) => {
    if (!date) return;
    
    setLastPeriodDate(date);
    localStorage.setItem('lastPeriodDate', date.toISOString());
    
    // Schedule new period notifications
    const nextPeriod = addDays(date, cycleLength);
    NotificationService.schedulePeriodNotifications(nextPeriod);
    
    setIsPeriodDatePickerOpen(false);
    setSelectedPeriodStartDate(undefined);
    
    toast({
      title: t('periodStarted'),
      description: t('periodStartedSuccess'),
    });
  };

  const handlePeriodEnded = (endDate: Date | undefined) => {
    if (!lastPeriodDate || !endDate) return;
    
    const actualDuration = differenceInDays(endDate, lastPeriodDate) + 1;
    setPeriodDuration(actualDuration);
    localStorage.setItem('periodDuration', actualDuration.toString());
    setIsPeriodDatePickerOpen(false);
    setSelectedPeriodStartDate(undefined);
    
    toast({
      title: t('periodEnded'),
      description: `${t('periodEndedSuccess')} ${actualDuration} ${t('days')}`,
    });
  };

  const handleSettingsUpdate = () => {
    if (dueDateMode === 'period' && selectedDate) {
      setLastPeriodDate(selectedDate);
      localStorage.setItem('lastPeriodDate', selectedDate.toISOString());
      localStorage.setItem('dueDateMode', 'period');
    } else if (dueDateMode === 'duedate' && selectedDueDate) {
      const calculatedLastPeriod = subDays(selectedDueDate, 280);
      setLastPeriodDate(calculatedLastPeriod);
      localStorage.setItem('lastPeriodDate', calculatedLastPeriod.toISOString());
      localStorage.setItem('dueDateMode', 'duedate');
    }
    setIsSettingsOpen(false);
  };

  const handleResetApp = () => {
    // Clear all localStorage data
    localStorage.removeItem('trackingMode');
    localStorage.removeItem('lastPeriodDate');
    localStorage.removeItem('cycleLength');
    localStorage.removeItem('periodDuration');
    localStorage.removeItem('pregnancyStartDate');
    localStorage.removeItem('dueDateMode');
    
    // Reset all state
    setTrackingMode(null);
    setLastPeriodDate(null);
    setCycleLength(28);
    setPeriodDuration(5);
    setSelectedDate(undefined);
    setSelectedDueDate(undefined);
    setDueDateMode('period');
    setIsSettingsOpen(false);
    
    // Cancel all notifications
    NotificationService.cancelAllNotifications();
    
    // Show intro screen
    setIsFirstTime(true);
    
    toast({
      title: t('appReset'),
      description: t('appResetSuccess'),
    });
  };

  const calculatePregnancyInfoForDate = (periodDate: Date) => {
    if (!periodDate) return null;

    const today = new Date();
    const daysPregnant = differenceInDays(today, periodDate) + 1; // Add 1 to include the start date
    
    // Days 1-14 = week 1, then every 7 days after that
    let weeksPregnant, daysInCurrentWeek;
    if (daysPregnant <= 14) {
      weeksPregnant = 1;
      daysInCurrentWeek = daysPregnant;
    } else {
      weeksPregnant = Math.floor((daysPregnant - 15) / 7) + 2; // Start from week 2 after day 14
      daysInCurrentWeek = ((daysPregnant - 15) % 7) + 1;
    }
    
    const dueDate = addDays(periodDate, 280); // 40 weeks
    const daysRemaining = differenceInDays(dueDate, today) + 1; // Add 1 to include today

    return {
      weeksPregnant,
      daysInCurrentWeek,
      dueDate,
      daysRemaining: Math.max(0, daysRemaining),
      totalDays: daysPregnant
    };
  };

  const calculatePregnancyMonth = (weeks: number) => {
    if (weeks >= 1 && weeks <= 4) return 1;
    if (weeks >= 5 && weeks <= 8) return 2;
    if (weeks >= 9 && weeks <= 13) return 3;
    if (weeks >= 14 && weeks <= 17) return 4;
    if (weeks >= 18 && weeks <= 21) return 5;
    if (weeks >= 22 && weeks <= 26) return 6;
    if (weeks >= 27 && weeks <= 30) return 7;
    if (weeks >= 31 && weeks <= 35) return 8;
    if (weeks >= 36 && weeks <= 40) return 9;
    return 1; // fallback
  };

  const calculatePregnancyInfo = () => {
    return calculatePregnancyInfoForDate(lastPeriodDate);
  };

  const calculatePeriodInfo = () => {
    if (!lastPeriodDate) return null;
    
    const today = new Date();
    const daysSinceLastPeriod = differenceInDays(today, lastPeriodDate);
    const daysUntilNextPeriod = cycleLength - daysSinceLastPeriod;
    const nextPeriodDate = addDays(lastPeriodDate, cycleLength);
    
    // Check if user is currently in their period
    const isInPeriod = daysSinceLastPeriod < periodDuration;
    
    // Ovulation typically occurs 14 days before next period
    const ovulationDate = subDays(nextPeriodDate, 14);
    // Fertile window is typically 5 days before ovulation to 1 day after
    const fertileWindowStart = subDays(ovulationDate, 5);
    const fertileWindowEnd = addDays(ovulationDate, 1);
    
    const daysSinceOvulation = differenceInDays(today, ovulationDate);
    const isInFertileWindow = today >= fertileWindowStart && today <= fertileWindowEnd;
    
    return {
      nextPeriodDate,
      daysUntilNextPeriod: Math.max(0, daysUntilNextPeriod),
      ovulationDate,
      fertileWindowStart,
      fertileWindowEnd,
      isInFertileWindow,
      cycleDay: (daysSinceLastPeriod % cycleLength) + 1,
      isInPeriod,
      daysSinceLastPeriod
    };
  };

  const pregnancyInfo = trackingMode === 'pregnant' ? calculatePregnancyInfo() : null;
  const periodInfo = trackingMode === 'period' ? calculatePeriodInfo() : null;

  // Load daily tip based on current day
  useEffect(() => {
    const loadDailyTip = async () => {
      if (!pregnancyInfo) return;
      
      try {
        let tipsData: any;
        
        if (language === 'ar') {
          const response = await import('@/data/daily-tips-ar.json');
          tipsData = response.default;
        } else {
          const response = await import('@/data/daily-tips-en.json');
          tipsData = response.default;
        }
        
        const tipIndex = pregnancyInfo.totalDays > 0 ? ((pregnancyInfo.totalDays - 1) % tipsData.tips.length) : 0;
        const tip = tipsData.tips[tipIndex];
        
        setDailyTip(tip?.tip || 'Take care of yourself and your baby today!');
      } catch (error) {
        console.error('Error loading daily tips:', error);
        setDailyTip('Take care of yourself and your baby today!');
      }
    };

    if (pregnancyInfo && pregnancyInfo.totalDays > 0) {
      loadDailyTip();
    }
  }, [pregnancyInfo?.totalDays, language]);

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 dark:from-purple-950 dark:via-indigo-950 dark:to-pink-950 p-4 flex items-center justify-center safe-area-full">
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto mb-2 w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <Baby className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{t('welcomeTitle')}</CardTitle>
            <CardDescription className="text-base">
              {t('welcomeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Choose tracking mode */}
            {!trackingMode && (
              <div className="space-y-4">
                <Label className="text-center block text-lg font-semibold">{t('selectTrackingMode')}</Label>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setTrackingMode('pregnant')}
                    className="w-full h-auto py-6 flex flex-col items-center gap-3 border-2 hover:border-primary hover:bg-pink-50 transition-all"
                  >
                    <Baby className="w-8 h-8 text-primary" />
                    <span className="text-lg font-semibold">{t('pregnancyTracking')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setTrackingMode('period')}
                    className="w-full h-auto py-6 flex flex-col items-center gap-3 border-2 hover:border-secondary hover:bg-purple-50 transition-all"
                  >
                    <CalendarDays className="w-8 h-8 text-secondary" />
                    <span className="text-lg font-semibold">{t('periodTracking')}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Pregnancy tracking setup */}
            {trackingMode === 'pregnant' && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTrackingMode(null)}
                  className="mb-2"
                >
                  ← {t('back')}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant={dueDateMode === 'period' ? 'default' : 'outline'}
                    onClick={() => setDueDateMode('period')}
                    className="flex-1"
                  >
                    {t('lastPeriodOption')}
                  </Button>
                  <Button
                    variant={dueDateMode === 'duedate' ? 'default' : 'outline'}
                    onClick={() => setDueDateMode('duedate')}
                    className="flex-1"
                  >
                    {t('dueDateOption')}
                  </Button>
                </div>

                {dueDateMode === 'period' ? (
                  <div className="space-y-2">
                    <Label htmlFor="last-period">{t('firstDayLastPeriod')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : t('selectDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="due-date">{t('expectedDueDate')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDueDate ? format(selectedDueDate, "PPP", { locale: ar }) : t('selectDueDate')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDueDate}
                          onSelect={setSelectedDueDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                <Button 
                  onClick={handleDateSubmit} 
                  disabled={dueDateMode === 'period' ? !selectedDate : !selectedDueDate}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
                >
                  {t('startTracking')}
                </Button>
              </div>
            )}

            {/* Step 2: Period tracking setup */}
            {trackingMode === 'period' && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTrackingMode(null)}
                  className="mb-2"
                >
                  ← {t('back')}
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="last-period">{t('lastPeriodStart')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : t('selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycle-length">{t('cycleLengthLabel')}</Label>
                  <Input
                    id="cycle-length"
                    type="number"
                    min="21"
                    max="35"
                    value={cycleLength}
                    onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)}
                    placeholder="28"
                  />
                  <p className="text-xs text-muted-foreground">{t('cycleLengthHint')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period-duration">{t('periodDurationLabel')}</Label>
                  <Input
                    id="period-duration"
                    type="number"
                    min="2"
                    max="10"
                    value={periodDuration}
                    onChange={(e) => setPeriodDuration(parseInt(e.target.value) || 5)}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">{t('periodDurationHint')}</p>
                </div>

                <Button 
                  onClick={handleDateSubmit} 
                  disabled={!selectedDate}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg"
                >
                  {t('startTracking')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 safe-area-full">
      {showWelcomeDialog && isFirstTime && (
        <WelcomeDialog onComplete={() => setShowWelcomeDialog(false)} />
      )}
      {/* Fixed App Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 safe-area-top bg-gradient-to-r from-pink-500/95 via-purple-500/95 to-indigo-500/95 dark:from-pink-600/95 dark:via-purple-700/95 dark:to-indigo-800/95 backdrop-blur-md shadow-lg">
        {/* Header with logo and settings */}
        <div className="border-b border-white/20">
          <div className="container mx-auto px-4 py-2 max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={appLogo} alt={t('appLogoAlt')} className="w-8 h-8 rounded-xl shadow-md" />
                <h1 className="text-lg font-bold text-white drop-shadow-md">{t('appName')}</h1>
              </div>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-white/20 text-white">
                    <Settings className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('settings')}</DialogTitle>
                    <DialogDescription>
                      {t('updatePregnancyDates')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">

                    {/* Pregnancy Dates Section - Only show for pregnancy tracking */}
                    {/* New Start Section - Available for both pregnancy and period tracking */}
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <h4 className="text-sm font-medium">{t('newStart')}</h4>
                        <p className="text-xs text-muted-foreground">{t('newStartDescription')}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            {t('newStart')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('resetAppConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('resetAppConfirmDesc')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t('cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetApp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {t('newStart')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    
                    {/* Notification Settings */}
                    {(pregnancyInfo || periodInfo) && (
                      <div className="border-t pt-4">
                        <NotificationSettings 
                          currentWeek={pregnancyInfo?.weeksPregnant || 0}
                          pregnancyStartDate={lastPeriodDate}
                          trackingMode={trackingMode}
                          nextPeriodDate={periodInfo?.nextPeriodDate}
                        />
                      </div>
                    )}
                    
                    {/* Display Settings */}
                    <div className="border-t pt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">{t('displaySettings') || 'إعدادات العرض'}</h4>
                          
                          {/* Dark Mode Toggle */}
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                {isDarkMode ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                                )}
                              </div>
                              <Label htmlFor="dark-mode" className="text-sm font-medium cursor-pointer">
                                {t('darkMode') || 'الوضع الداكن'}
                              </Label>
                            </div>
                            <Switch
                              id="dark-mode"
                              checked={isDarkMode}
                              onCheckedChange={(checked) => {
                                setIsDarkMode(checked);
                                localStorage.setItem('darkMode', checked.toString());
                                document.documentElement.classList.toggle('dark', checked);
                                toast({
                                  title: checked ? (t('darkModeEnabled') || 'تم تفعيل الوضع الداكن') : (t('darkModeDisabled') || 'تم تعطيل الوضع الداكن'),
                                });
                              }}
                            />
                          </div>
                          
                          {/* Month Format Toggle */}
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <Label htmlFor="month-format" className="text-sm font-medium cursor-pointer">
                              {t('showMonthNumbers')}
                            </Label>
                            <Switch
                              id="month-format"
                              checked={showMonthNumbers}
                              onCheckedChange={(checked) => {
                                setShowMonthNumbers(checked);
                                localStorage.setItem('showMonthNumbers', checked.toString());
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{t('showMonthNumbersDesc')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="w-full">
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        
        {/* AdMob Banner Placeholder */}
        <div className="bg-white/10 border-b border-white/20 flex items-center justify-center h-[50px]">
          <span className="text-xs text-white/70">AdMob Banner</span>
        </div>
        
        {/* Top Navigation */}
        <BottomNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          trackingMode={trackingMode}
        />
      </div>

      {/* Main Content */}
      <div 
        className="min-h-screen pt-[160px] pb-4"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll'
        }}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgba(255, 255, 255, 0.55), rgba(215, 146, 248, 0.40))'
          }}
        ></div>
        {/* Dark mode overlay */}
        <div 
          className="absolute inset-0 pointer-events-none dark:block hidden"
          style={{
            background: 'linear-gradient(to right, rgba(30, 20, 40, 0.85), rgba(60, 30, 80, 0.85))'
          }}
        ></div>
        <div className="container mx-auto p-4 max-w-4xl relative z-10">
          {/* Render content based on activeTab */}
          {activeTab === 'dashboard' && trackingMode === 'pregnant' && pregnancyInfo && (
            <div className="space-y-4">
              {/* Trimester Progress Card */}
              <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-white/95 to-pink-50/95 dark:from-purple-900/40 dark:to-pink-900/40 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-right mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {format(pregnancyInfo.dueDate, "d/M")}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {format(lastPeriodDate || new Date(), "d/M")}
                      </div>
                    </div>
                    
                    <div className="relative h-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full mb-3 overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-lg"
                        style={{ width: `${Math.min((pregnancyInfo.weeksPregnant / 40) * 100, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>{t('thirdTrimester')}</span>
                      <span>{t('secondTrimester')}</span>
                      <span>{t('firstTrimester')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Days Remaining - Hero Card */}
              <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 dark:from-pink-600 dark:via-purple-700 dark:to-indigo-800">
                <CardContent className="p-8 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-4 p-0 h-auto hover:bg-white/20 rounded-xl"
                    onClick={() => setIsDailyTipOpen(true)}
                  >
                    <div className="w-14 h-14 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg relative hover:scale-105 transition-transform">
                      <Lightbulb className="w-7 h-7 text-amber-900" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-pulse"></div>
                    </div>
                  </Button>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-white/90 mb-2">{t('daysRemaining')}</h3>
                    <div className="text-7xl sm:text-8xl leading-none font-bold text-white drop-shadow-lg">
                      {pregnancyInfo.daysRemaining}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Cards Grid */}
              <div className="grid gap-4">
                {/* Expected Due Date Card */}
                <Card className="overflow-hidden border-none shadow-lg bg-white/95 dark:bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 text-right">
                        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center justify-end gap-2">
                          <CalendarDays className="w-5 h-5 text-primary" />
                          {t('expectedDueDate')}
                        </h3>
                        <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          {showMonthNumbers 
                            ? format(pregnancyInfo.dueDate, "yyyy/MM/dd")
                            : format(pregnancyInfo.dueDate, "yyyy/MM/dd")
                          }
                        </div>
                        <Button 
                          variant="link" 
                          className="text-primary p-0 h-auto text-sm font-medium mt-2 hover:text-accent"
                          onClick={() => {
                            toast({
                              title: t('comingSoon'),
                              description: t('hijriCalendarFeature')
                            });
                          }}
                        >
                          {t('hijriCalendar')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pregnancy Age Card */}
                <Card className="overflow-hidden border-none shadow-lg bg-white/95 dark:bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 text-right">
                        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center justify-end gap-2">
                          <Clock className="w-5 h-5 text-secondary" />
                          {t('pregnancyAge')}
                        </h3>
                        <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          {pregnancyInfo.weeksPregnant} <span className="text-xl">({t('plus')} {pregnancyInfo.daysInCurrentWeek} {t('days')})</span>
                        </div>
                        <Button 
                          variant="link" 
                          className="text-secondary p-0 h-auto text-sm font-medium mt-2 hover:text-accent"
                          onClick={() => setActiveTab('weekly')}
                        >
                          {t('weekDetails')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Month Card */}
                <Card className="overflow-hidden border-none shadow-lg bg-white/95 dark:bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 text-right">
                        <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {t(`month${calculatePregnancyMonth(pregnancyInfo.weeksPregnant)}`)}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="link" 
                              className="text-accent p-0 h-auto text-sm font-medium mt-2 hover:text-primary"
                            >
                              {t('monthCalculation')}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className={language === 'ar' ? 'text-right' : ''}>
                            <AlertDialogHeader>
                              <AlertDialogTitle className={language === 'ar' ? 'text-right' : ''}>{t('monthCalculationTitle')}</AlertDialogTitle>
                              <AlertDialogDescription className={language === 'ar' ? 'text-right' : 'text-left'} dir="auto">
                                <p className="space-y-2">{t('monthCalculationDescription')}</p>
                                <ul className={`list-disc space-y-1 text-sm ${language === 'ar' ? 'list-inside text-right' : 'list-inside'}`}>
                                  <li>{t('monthWeeks1')}</li>
                                  <li>{t('monthWeeks2')}</li>
                                  <li>{t('monthWeeks3')}</li>
                                  <li>{t('monthWeeks4')}</li>
                                  <li>{t('monthWeeks5')}</li>
                                  <li>{t('monthWeeks6')}</li>
                                  <li>{t('monthWeeks7')}</li>
                                  <li>{t('monthWeeks8')}</li>
                                  <li>{t('monthWeeks9')}</li>
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogAction>{t('gotIt')}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Tip Dialog */}
              <Dialog open={isDailyTipOpen} onOpenChange={setIsDailyTipOpen}>
                <DialogContent className="max-w-md w-[calc(100%-2rem)] [&>button]:hidden">
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-t-lg"></div>
                    
                    <div className="pt-6 pb-2">
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg relative">
                            <Lightbulb className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center -right-1">
                              <span className="text-white text-[10px] font-bold">{pregnancyInfo.totalDays}</span>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            {t('dailyTip')}
                          </h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent"></div>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base font-medium italic mb-6">
                          "{dailyTip}"
                        </p>
                        <Button 
                          onClick={() => setIsDailyTipOpen(false)}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                        >
                          {t('close') || 'Close'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

        {/* Period Tracking Dashboard */}
        {activeTab === 'dashboard' && trackingMode === 'period' && periodInfo && (
          <div className="space-y-4">
            {/* Hero Section for Period Tracking */}
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 dark:from-pink-600 dark:via-purple-700 dark:to-indigo-800">
              <CardContent className="p-8 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <h2 className="text-4xl font-bold text-white drop-shadow-lg mb-3">
                      {t('cycleDay')} {periodInfo.cycleDay}
                    </h2>
                    <p className="text-white/90 text-xl font-medium">
                      <span className="text-2xl font-bold">{periodInfo.daysUntilNextPeriod}</span> {t('daysUntilPeriod')}
                    </p>
                  </div>
                  
                  {/* Cycle Progress Visualization */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                    <div className="flex items-center justify-between mb-2 text-sm text-white/90">
                      <span>{t('cycleProgress')}</span>
                      <span className="font-bold">{Math.round((periodInfo.cycleDay / cycleLength) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${(periodInfo.cycleDay / cycleLength) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fertility Window Alert */}
            {periodInfo.isInFertileWindow && (
              <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-700">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <Heart className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1">{t('fertileWindowTitle')}</h3>
                      <p className="text-white/90">{t('fertileWindowMessage')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Period Date Card */}
            <Card className="overflow-hidden border-none shadow-lg bg-white/95 dark:bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="text-right mb-4">
                  <h3 className="text-base font-semibold text-foreground mb-3 flex items-center justify-end gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    {t('nextPeriod')}
                  </h3>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    {showMonthNumbers 
                      ? format(periodInfo.nextPeriodDate, "d/M/yyyy")
                      : format(periodInfo.nextPeriodDate, "PPP", { locale: ar })
                    }
                  </div>
                </div>
                <Popover open={isPeriodDatePickerOpen} onOpenChange={setIsPeriodDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-md">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodInfo.isInPeriod ? t('markPeriodEnded') : t('markPeriodStarted')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedPeriodStartDate}
                      onSelect={(date) => {
                        setSelectedPeriodStartDate(date);
                        if (periodInfo.isInPeriod) {
                          handlePeriodEnded(date);
                        } else {
                          handlePeriodStarted(date);
                        }
                      }}
                      disabled={(date) => 
                        periodInfo.isInPeriod 
                          ? (date > new Date() || date < lastPeriodDate!)
                          : date > new Date()
                      }
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-md">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    {cycleLength}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{t('cycleLength')}</div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {periodDuration}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{t('periodLength')}</div>
                </CardContent>
              </Card>
            </div>

            {/* Ovulation & Fertile Window Info */}
            <Card className="overflow-hidden border-none shadow-lg bg-white/95 dark:bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  {t('fertilityInfo')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">{t('ovulationDate')}</span>
                    <span className="font-semibold text-foreground">
                      {showMonthNumbers 
                        ? format(periodInfo.ovulationDate, "d/M/yyyy")
                        : format(periodInfo.ovulationDate, "PP", { locale: ar })
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                    <span className="text-sm text-muted-foreground">{t('fertileWindow')}</span>
                    <span className="font-semibold text-foreground text-sm">
                      {showMonthNumbers 
                        ? `${format(periodInfo.fertileWindowStart, "d/M")} - ${format(periodInfo.fertileWindowEnd, "d/M")}`
                        : `${format(periodInfo.fertileWindowStart, "PP", { locale: ar })} - ${format(periodInfo.fertileWindowEnd, "PP", { locale: ar })}`
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'weekly' && trackingMode === 'pregnant' && (
          <WeeklyInfo 
            currentWeek={pregnancyInfo?.weeksPregnant || 0} 
            openBabyMessage={openBabyMessage}
            onBabyMessageClose={() => setOpenBabyMessage(false)}
          />
        )}

        {activeTab === 'community' && (
          <Community />
        )}
        </div>
      </div>
    </div>
  );
};

export default Index;
