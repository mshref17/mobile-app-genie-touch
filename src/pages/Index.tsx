import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Baby, Users, Heart, Settings, CalendarDays, Clock, Star, Gift, Info } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, addDays, differenceInDays, differenceInWeeks, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

import WeeklyInfo from "@/components/WeeklyInfo";
import Community from "@/components/Community";
import DailyTip from "@/components/DailyTip";
import NotificationSettings from "@/components/NotificationSettings";
import { BottomNavigation } from "@/components/BottomNavigation";
import SplashScreen from "@/components/SplashScreen";
import { NotificationService } from "@/lib/notifications";

const appLogo = "/lovable-uploads/7a6df10b-0d20-4b9d-acd0-6b0536777e43.png";

const Index = () => {
  const { t, language } = useLanguage();
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<Date>();
  const [dueDateMode, setDueDateMode] = useState<'period' | 'duedate'>('period');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const savedDate = localStorage.getItem('lastPeriodDate');
    const savedMode = localStorage.getItem('dueDateMode') as 'period' | 'duedate' || 'period';
    
    if (savedDate) {
      const date = new Date(savedDate);
      setLastPeriodDate(date);
      setIsFirstTime(false);
      setDueDateMode(savedMode);
      
      // Initialize notifications when app loads
      const pregnancyInfo = calculatePregnancyInfoForDate(date);
      if (pregnancyInfo) {
        NotificationService.scheduleWeeklyNotification(pregnancyInfo.weeksPregnant, date);
        NotificationService.scheduleDailyTipNotification();
      }
    }
  }, []);

  const handleDateSubmit = () => {
    if (dueDateMode === 'period' && selectedDate) {
      setLastPeriodDate(selectedDate);
      localStorage.setItem('lastPeriodDate', selectedDate.toISOString());
      localStorage.setItem('dueDateMode', 'period');
      setIsFirstTime(false);
    } else if (dueDateMode === 'duedate' && selectedDueDate) {
      // Calculate last period date from due date (subtract 280 days)
      const calculatedLastPeriod = subDays(selectedDueDate, 280);
      setLastPeriodDate(calculatedLastPeriod);
      localStorage.setItem('lastPeriodDate', calculatedLastPeriod.toISOString());
      localStorage.setItem('dueDateMode', 'duedate');
      setIsFirstTime(false);
    }
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

  const calculatePregnancyInfoForDate = (periodDate: Date) => {
    if (!periodDate) return null;

    const today = new Date();
    const daysPregnant = differenceInDays(today, periodDate);
    const weeksPregnant = Math.floor(daysPregnant / 7);
    const daysInCurrentWeek = daysPregnant % 7;
    const dueDate = addDays(periodDate, 280); // 40 weeks
    const daysRemaining = differenceInDays(dueDate, today);

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

  const pregnancyInfo = calculatePregnancyInfo();

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
            <div className="space-y-4">
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
            </div>
            <Button 
              onClick={handleDateSubmit} 
              disabled={dueDateMode === 'period' ? !selectedDate : !selectedDueDate}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {t('startTracking')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-glow via-accent to-secondary safe-area-full">
      {/* Floating Header */}
      <div className="fixed top-6 left-6 right-6 z-50 safe-area-top">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-medium">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={appLogo} alt={t('appLogoAlt')} className="w-10 h-10 rounded-xl shadow-soft" />
                  <div className="absolute -inset-0.5 bg-gradient-primary rounded-xl opacity-20"></div>
                </div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">{t('appName')}</h1>
              </div>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/30 transition-all duration-200">
                    <Settings className="h-5 w-5 text-muted-foreground hover:text-accent-foreground" />
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

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">{t('pregnancyDates')}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant={dueDateMode === 'period' ? 'default' : 'outline'}
                          onClick={() => setDueDateMode('period')}
                          className="flex-1"
                        >
                          {t('lastPeriodDate')}
                        </Button>
                        <Button
                          variant={dueDateMode === 'duedate' ? 'default' : 'outline'}
                          onClick={() => setDueDateMode('duedate')}
                          className="flex-1"
                        >
                          {t('dueDate')}
                        </Button>
                      </div>

                      {dueDateMode === 'period' ? (
                        <div className="space-y-2">
                          <Label>{t('firstDayLastPeriod')}</Label>
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
                          <Label>{t('expectedDueDate')}</Label>
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
                    </div>
                    
                    {/* Notification Settings */}
                    {pregnancyInfo && (
                      <div className="border-t pt-4">
                        <NotificationSettings 
                          currentWeek={pregnancyInfo.weeksPregnant}
                          pregnancyStartDate={lastPeriodDate}
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="flex-1">
                        {t('cancel')}
                      </Button>
                      <Button 
                        onClick={handleSettingsUpdate}
                        disabled={dueDateMode === 'period' ? !selectedDate : !selectedDueDate}
                        className="flex-1 bg-pink-600 hover:bg-pink-700"
                      >
                        {t('update')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pt-28 pb-32 max-w-lg mx-auto">
        {/* Render content based on activeTab */}
        {activeTab === 'dashboard' && pregnancyInfo && (
          <div className="space-y-6">
            {/* Main Hero Card */}
            <div className="relative overflow-hidden bg-gradient-card rounded-3xl border border-border/30 shadow-strong">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/15 rounded-full translate-y-6 -translate-x-6"></div>
              
              <div className="relative z-10 p-8">
                {/* Week Display */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                    <Baby className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">الأسبوع الحالي</span>
                  </div>
                  
                  <h2 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3">
                    {pregnancyInfo.weeksPregnant}
                  </h2>
                  <p className="text-lg text-muted-foreground font-medium">
                    {pregnancyInfo.daysRemaining} يوم حتى موعد الولادة
                  </p>
                </div>
                
                {/* Progress Ring */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-border opacity-30"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(pregnancyInfo.weeksPregnant / 40) * 283} 283`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(340, 82%, 67%)" />
                        <stop offset="100%" stopColor="hsl(280, 70%, 75%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {Math.round((pregnancyInfo.weeksPregnant / 40) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Tip Card */}
            <DailyTip currentDay={pregnancyInfo.totalDays} />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Due Date Card */}
              <Card className="bg-gradient-card border border-border/30 shadow-medium overflow-hidden">
                <div className="relative p-6">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-accent/20 rounded-full -translate-y-4 translate-x-4"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-accent/20 rounded-xl">
                        <CalendarDays className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t('expectedDueDate')}</span>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground mb-1">
                        {format(pregnancyInfo.dueDate, "dd MMM", { locale: ar })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(pregnancyInfo.dueDate, "EEEE", { locale: ar })}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Pregnancy Month Card */}
              <Card className="bg-gradient-card border border-border/30 shadow-medium overflow-hidden">
                <div className="relative p-6">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-full -translate-y-4 translate-x-4"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/20 rounded-xl">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{t('month')}</span>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {calculatePregnancyMonth(pregnancyInfo.weeksPregnant)}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                            <Info className="w-3 h-3 text-muted-foreground hover:text-primary" />
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
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Progress Details */}
            <Card className="bg-gradient-card border border-border/30 shadow-medium">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">رحلة الحمل</h3>
                  <span className="text-sm text-muted-foreground">
                    {t('weekAbbrev')} {pregnancyInfo.weeksPregnant}.{pregnancyInfo.daysInCurrentWeek}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الأيام المتبقية</span>
                    <span className="font-medium text-foreground">{pregnancyInfo.daysRemaining}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">إجمالي الأيام</span>
                    <span className="font-medium text-foreground">{pregnancyInfo.totalDays}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'weekly' && (
          <WeeklyInfo currentWeek={pregnancyInfo?.weeksPregnant || 0} />
        )}

        {activeTab === 'community' && (
          <Community />
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default Index;
