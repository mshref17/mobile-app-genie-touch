import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Baby, Users, Heart, Settings, CalendarDays, Clock, Star, Gift, Info } from "lucide-react";
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

  useEffect(() => {
    const savedDate = localStorage.getItem('lastPeriodDate');
    const savedMode = localStorage.getItem('dueDateMode') as 'period' | 'duedate' || 'period';
    const savedTrackingMode = localStorage.getItem('trackingMode') as 'pregnant' | 'period' || null;
    const savedCycleLength = localStorage.getItem('cycleLength');
    const savedPeriodDuration = localStorage.getItem('periodDuration');
    const savedMonthFormat = localStorage.getItem('showMonthNumbers');
    
    if (savedMonthFormat) setShowMonthNumbers(savedMonthFormat === 'true');
    
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

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-4 flex items-center justify-center safe-area-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
              <Baby className="w-8 h-8 text-pink-600" />
            </div>
            <CardTitle className="text-2xl text-pink-800">{t('welcomeTitle')}</CardTitle>
            <CardDescription>
              {t('welcomeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Choose tracking mode */}
            {!trackingMode && (
              <div className="space-y-4">
                <Label className="text-center block">{t('selectTrackingMode')}</Label>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setTrackingMode('pregnant')}
                    className="w-full h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Baby className="w-6 h-6" />
                    <span>{t('pregnancyTracking')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setTrackingMode('period')}
                    className="w-full h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <CalendarDays className="w-6 h-6" />
                    <span>{t('periodTracking')}</span>
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
                  className="w-full bg-pink-600 hover:bg-pink-700"
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
                  className="w-full bg-pink-600 hover:bg-pink-700"
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b safe-area-top">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={appLogo} alt={t('appLogoAlt')} className="w-8 h-8 rounded-lg" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{t('appName')}</h1>
            </div>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-pink-50">
                  <Settings className="h-6 w-6 text-gray-600 hover:text-pink-600" />
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
                    
                    {/* Month Format Settings */}
                    <div className="border-t pt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-3">{t('showMonthNumbers')}</h4>
                          <p className="text-xs text-muted-foreground mb-3">{t('showMonthNumbersDesc')}</p>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="month-format" className="text-sm">
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

      {/* Main Content */}
      <div 
        className="min-h-screen pt-20 pb-32 relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Light pink overlay */}
        <div className="absolute inset-0 bg-pink-200/30 pointer-events-none"></div>
        <div className="container mx-auto p-4 max-w-4xl relative z-10">
          {/* Render content based on activeTab */}
          {activeTab === 'dashboard' && trackingMode === 'pregnant' && pregnancyInfo && (
            <>
              {/* Trimester Progress Bar */}
              <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg text-right">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">
                    {format(pregnancyInfo.dueDate, "d/M/yyyy")}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(lastPeriodDate || new Date(), "d/M/yyyy")}
                  </div>
                </div>
                
                <div className="relative h-2 bg-gray-200 rounded-full mb-3">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((pregnancyInfo.weeksPregnant / 40) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{t('thirdTrimester')}</span>
                  <span>{t('secondTrimester')}</span>
                  <span>{t('firstTrimester')}</span>
                </div>
              </div>

              {/* Remaining Days Section */}
              <div className="mb-6">
                <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg mb-3 text-right">
                  <h3 className="text-xl text-gray-700">{t('daysRemaining')}</h3>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-bold text-purple-600">
                    {pregnancyInfo.daysRemaining}
                  </div>
                </div>
              </div>

              {/* Expected Due Date Section */}
              <div className="mb-6">
                <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg mb-3 text-right">
                  <h3 className="text-xl text-gray-700">{t('expectedDueDate')}</h3>
                </div>
                <div className="text-right flex items-center justify-end gap-2 flex-nowrap flex-row-reverse" dir="rtl">
                  <Button 
                    variant="link" 
                    className="text-blue-500 p-0 h-auto text-sm whitespace-nowrap"
                    onClick={() => {
                      // Future: Add Hijri calendar conversion
                      toast({
                        title: t('comingSoon'),
                        description: t('hijriCalendarFeature')
                      });
                    }}
                  >
                    {t('hijriCalendar')}
                  </Button>
                  <div className="text-2xl font-bold text-purple-600 whitespace-nowrap">
                    {showMonthNumbers 
                      ? format(pregnancyInfo.dueDate, "yyyy/MM/dd")
                      : format(pregnancyInfo.dueDate, "MMMM d, yyyy", { locale: ar })
                    }
                  </div>
                </div>
              </div>

              {/* Pregnancy Age Section */}
              <div className="mb-6">
                <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg mb-3 text-right">
                  <h3 className="text-xl text-gray-700">{t('pregnancyAge')}</h3>
                </div>
                <div className="text-right flex items-baseline justify-end gap-2 flex-nowrap" dir="rtl">
                  <div className="text-lg text-gray-600 whitespace-nowrap">
                    ({t('plus')} {pregnancyInfo.daysInCurrentWeek} {t('days')}) {t('weeksDetailed')}
                  </div>
                  <div className="text-5xl font-bold text-purple-600 whitespace-nowrap">
                    {pregnancyInfo.weeksPregnant}
                  </div>
                </div>
              </div>

              {/* Current Month Section */}
              <div className="mb-6">
                <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg mb-3 text-right">
                  <h3 className="text-xl text-gray-700">{t('monthPrefix')}</h3>
                </div>
                <div className="text-right flex items-center justify-end gap-2 flex-nowrap" dir="rtl">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-auto w-auto hover:bg-transparent">
                        <Info className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('monthCalculationTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-left space-y-2">
                          <p>{t('monthCalculationDescription')}</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
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
                  <div className="text-3xl font-bold text-purple-600 whitespace-nowrap">
                    {calculatePregnancyMonth(pregnancyInfo.weeksPregnant)}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <DailyTip currentDay={pregnancyInfo.totalDays} />
              </div>
            </>
          )}

        {/* Period Tracking Dashboard */}
        {activeTab === 'dashboard' && trackingMode === 'period' && periodInfo && (
          <>
            {/* Hero Section for Period Tracking */}
            <div className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 rounded-3xl p-6 mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/30 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/30 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {t('cycleDay')} {periodInfo.cycleDay}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    <span className="font-medium">{periodInfo.daysUntilNextPeriod}</span> {t('daysUntilPeriod')}
                  </p>
                </div>
                
                {/* Cycle Progress Visualization */}
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
                    <span>{t('cycleProgress')}</span>
                    <span className="font-medium">{Math.round((periodInfo.cycleDay / cycleLength) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(periodInfo.cycleDay / cycleLength) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fertility Window Alert */}
            {periodInfo.isInFertileWindow && (
              <Card className="mb-6 bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900 mb-1">{t('fertileWindowTitle')}</h3>
                      <p className="text-sm text-emerald-700">{t('fertileWindowMessage')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Period Date */}
            <Card className="mb-6 bg-white shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="w-5 h-5 text-pink-600" />
                  {t('nextPeriod')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-600 mb-4">
                  {showMonthNumbers 
                    ? format(periodInfo.nextPeriodDate, "d/M/yyyy")
                    : format(periodInfo.nextPeriodDate, "PPP", { locale: ar })
                  }
                </div>
                <Popover open={isPeriodDatePickerOpen} onOpenChange={setIsPeriodDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button className="w-full bg-pink-600 hover:bg-pink-700">
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CalendarIcon className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="text-2xl font-bold text-pink-700">
                    {cycleLength} {t('days')}
                  </div>
                  <div className="text-sm text-pink-600">{t('cycleLength')}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-md">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    {periodDuration} {t('days')}
                  </div>
                  <div className="text-sm text-purple-600">{t('periodLength')}</div>
                </CardContent>
              </Card>
            </div>

            {/* Ovulation & Fertile Window Info */}
            <Card className="mb-6 bg-white shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-rose-600" />
                  {t('fertilityInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('ovulationDate')}</span>
                  <span className="font-medium text-gray-900">
                    {showMonthNumbers 
                      ? format(periodInfo.ovulationDate, "d/M/yyyy")
                      : format(periodInfo.ovulationDate, "PP", { locale: ar })
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('fertileWindow')}</span>
                  <span className="font-medium text-gray-900">
                    {showMonthNumbers 
                      ? `${format(periodInfo.fertileWindowStart, "d/M/yyyy")} - ${format(periodInfo.fertileWindowEnd, "d/M/yyyy")}`
                      : `${format(periodInfo.fertileWindowStart, "PP", { locale: ar })} - ${format(periodInfo.fertileWindowEnd, "PP", { locale: ar })}`
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
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
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        trackingMode={trackingMode}
      />
    </div>
  );
};

export default Index;
