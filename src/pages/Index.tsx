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

  const pregnancyInfo = calculatePregnancyInfo();

  if (isFirstTime) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 safe-area-full">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center animate-scale-pulse">
              <Baby className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl gradient-text">{t('welcomeTitle')}</CardTitle>
            <CardDescription className="text-lg">
              {t('welcomeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={dueDateMode === 'period' ? 'default' : 'outline'}
                  onClick={() => setDueDateMode('period')}
                  className="flex-1 rounded-2xl"
                >
                  {t('lastPeriodOption')}
                </Button>
                <Button
                  variant={dueDateMode === 'duedate' ? 'default' : 'outline'}
                  onClick={() => setDueDateMode('duedate')}
                  className="flex-1 rounded-2xl"
                >
                  {t('dueDateOption')}
                </Button>
              </div>

              {dueDateMode === 'period' ? (
                <div className="space-y-3">
                  <Label htmlFor="last-period" className="text-base">{t('firstDayLastPeriod')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-2xl h-12",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : t('selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-card" align="start">
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
                <div className="space-y-3">
                  <Label htmlFor="due-date" className="text-base">{t('expectedDueDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-2xl h-12",
                          !selectedDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5" />
                        {selectedDueDate ? format(selectedDueDate, "PPP", { locale: ar }) : t('selectDueDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-card" align="start">
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
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-semibold"
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
    <div className="min-h-screen safe-area-full overflow-x-hidden">
      {/* Fixed App Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 glass-card border-b-0 safe-area-top">
        <div className="container mx-auto px-6 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-scale-pulse">
                <img src={appLogo} alt={t('appLogoAlt')} className="w-8 h-8 rounded-lg" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">{t('appName')}</h1>
            </div>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary-soft rounded-2xl">
                  <Settings className="h-6 w-6 text-muted-foreground hover:text-primary" />
                </Button>
              </DialogTrigger>
                <DialogContent className="sm:max-w-md glass-card">
                  <DialogHeader>
                    <DialogTitle className="gradient-text">{t('settings')}</DialogTitle>
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
                          className="flex-1 rounded-2xl"
                        >
                          {t('lastPeriodDate')}
                        </Button>
                        <Button
                          variant={dueDateMode === 'duedate' ? 'default' : 'outline'}
                          onClick={() => setDueDateMode('duedate')}
                          className="flex-1 rounded-2xl"
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
                                  "w-full justify-start text-left font-normal rounded-2xl",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : t('selectDate')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 glass-card" align="start">
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
                                  "w-full justify-start text-left font-normal rounded-2xl",
                                  !selectedDueDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDueDate ? format(selectedDueDate, "PPP", { locale: ar }) : t('selectDueDate')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 glass-card" align="start">
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
                    
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="flex-1 rounded-2xl">
                        {t('cancel')}
                      </Button>
                      <Button 
                        onClick={handleSettingsUpdate}
                        disabled={dueDateMode === 'period' ? !selectedDate : !selectedDueDate}
                        className="flex-1 rounded-2xl bg-primary hover:bg-primary/90"
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

      {/* Main Content */}
      <div className="container mx-auto px-6 max-w-6xl pt-24 pb-32">
        {/* Render content based on activeTab */}
        {activeTab === 'dashboard' && pregnancyInfo && (
          <div className="space-y-8">
            {/* Hero Section with Modern Layout */}
            <div className="relative">
              {/* Floating Background Elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary-glow to-accent-glow rounded-full opacity-20 animate-float blur-xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-secondary to-accent rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
              
              {/* Main Hero Card */}
              <div className="floating-card rounded-3xl p-8 relative overflow-hidden animate-slide-up">
                {/* Gradient Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-soft/50 via-transparent to-accent-glow/50 opacity-60"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-24 translate-x-24"></div>
                
                <div className="relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left Side - Week Info */}
                    <div className="text-center lg:text-right space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-5xl lg:text-6xl font-bold gradient-text">
                          {t('week')} {pregnancyInfo.weeksPregnant}
                        </h2>
                        <p className="text-xl text-muted-foreground">
                          {t('pregnancyMonth')} {calculatePregnancyMonth(pregnancyInfo.weeksPregnant)}
                        </p>
                      </div>
                      
                      {/* Days Counter */}
                      <div className="glass-card rounded-2xl p-6 pulse-glow">
                        <div className="text-center space-y-2">
                          <p className="text-3xl font-bold text-primary">{pregnancyInfo.daysRemaining}</p>
                          <p className="text-sm text-muted-foreground">{t('daysUntilBaby')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Circular Progress */}
                    <div className="flex justify-center lg:justify-start">
                      <div className="relative w-64 h-64">
                        {/* Outer Circle */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20"></div>
                        
                        {/* Progress Ring */}
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-border"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="url(#gradient)"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${(pregnancyInfo.weeksPregnant / 40) * 283} 283`}
                            className="transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="hsl(var(--primary))" />
                              <stop offset="100%" stopColor="hsl(var(--accent))" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <Baby className="w-12 h-12 mx-auto text-primary animate-scale-pulse" />
                            <p className="text-sm text-muted-foreground">{Math.round((pregnancyInfo.weeksPregnant / 40) * 100)}% {t('complete')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Due Date Card */}
              <div className="floating-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('dueDate')}</p>
                    <p className="font-semibold">{format(pregnancyInfo.dueDate, "MMM dd, yyyy")}</p>
                  </div>
                </div>
              </div>

              {/* Days in Week Card */}
              <div className="floating-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-dark to-secondary flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('daysThisWeek')}</p>
                    <p className="font-semibold">{pregnancyInfo.daysInCurrentWeek}/14</p>
                  </div>
                </div>
              </div>

              {/* Total Days Card */}
              <div className="floating-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalDays')}</p>
                    <p className="font-semibold">{pregnancyInfo.totalDays}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Info with Modern Design */}
            <div className="floating-card rounded-3xl p-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <WeeklyInfo currentWeek={pregnancyInfo.weeksPregnant} />
            </div>

            {/* Daily Tip with Creative Layout */}
            <div className="floating-card rounded-3xl p-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <DailyTip currentDay={pregnancyInfo.totalDays} />
            </div>

            {/* Community Section */}
            <div className="floating-card rounded-3xl p-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <Community />
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="animate-slide-up">
            <Community />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;