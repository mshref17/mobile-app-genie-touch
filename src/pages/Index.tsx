import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Baby, Users, Heart, Settings, CalendarDays, Clock, Star, Gift, Info, Sparkles, Crown, TrendingUp } from "lucide-react";
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
      <div className="min-h-screen bg-[var(--gradient-hero)] p-4 flex items-center justify-center safe-area-full">
        <Card className="w-full max-w-md shadow-[var(--shadow-medium)] border-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[var(--gradient-primary)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-soft)]">
              <Baby className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-foreground font-bold">{t('welcomeTitle')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('welcomeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={dueDateMode === 'period' ? 'default' : 'outline'}
                  onClick={() => setDueDateMode('period')}
                  className="flex-1 rounded-xl"
                >
                  {t('lastPeriodOption')}
                </Button>
                <Button
                  variant={dueDateMode === 'duedate' ? 'default' : 'outline'}
                  onClick={() => setDueDateMode('duedate')}
                  className="flex-1 rounded-xl"
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
                          "w-full justify-start text-left font-normal rounded-xl",
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
                          "w-full justify-start text-left font-normal rounded-xl",
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
              className="w-full rounded-xl h-12 bg-[var(--gradient-primary)] border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all duration-300"
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
    <div className="min-h-screen bg-[var(--gradient-hero)] safe-area-full">
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-[var(--shadow-soft)] border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--gradient-primary)] rounded-xl flex items-center justify-center shadow-[var(--shadow-soft)]">
                  <img src={appLogo} alt={t('appLogoAlt')} className="w-6 h-6 rounded" />
                </div>
                <h1 className="text-xl font-bold bg-[var(--gradient-primary)] bg-clip-text text-transparent">{t('appName')}</h1>
              </div>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl">
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
                          className="flex-1 rounded-xl"
                        >
                          {t('lastPeriodDate')}
                        </Button>
                        <Button
                          variant={dueDateMode === 'duedate' ? 'default' : 'outline'}
                          onClick={() => setDueDateMode('duedate')}
                          className="flex-1 rounded-xl"
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
                                  "w-full justify-start text-left font-normal rounded-xl",
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
                                  "w-full justify-start text-left font-normal rounded-xl",
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
                      <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="flex-1 rounded-xl">
                        {t('cancel')}
                      </Button>
                      <Button 
                        onClick={handleSettingsUpdate}
                        disabled={dueDateMode === 'period' ? !selectedDate : !selectedDueDate}
                        className="flex-1 rounded-xl bg-[var(--gradient-primary)] border-0"
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
      <div className="container mx-auto px-4 max-w-4xl pt-24 pb-32">
        {/* Render content based on activeTab */}
        {activeTab === 'dashboard' && pregnancyInfo && (
          <div className="space-y-6">
            {/* Modern Hero Card */}
            <Card className="border-0 shadow-[var(--shadow-medium)] overflow-hidden bg-[var(--gradient-card)]">
              <div className="relative p-8">
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-primary/5 rounded-full blur-sm"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-primary/10 rounded-full blur-lg"></div>
                <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-2xl mb-6 shadow-[var(--shadow-soft)]">
                    <Crown className="w-6 h-6 text-primary" />
                    <span className="text-primary font-bold text-lg">{t('week')} {pregnancyInfo.weeksPregnant}</span>
                  </div>
                  
                  <div className="mb-6">
                    <h2 className="text-4xl font-bold text-foreground mb-2">
                      {t('weekAbbrev')} {pregnancyInfo.weeksPregnant} {pregnancyInfo.daysInCurrentWeek} {t('dayAbbrev')}
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      {Math.round((pregnancyInfo.weeksPregnant / 40) * 100)}% {t('journeyComplete')}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden mb-6">
                    <div 
                      className="absolute left-0 top-0 h-full bg-[var(--gradient-primary)] rounded-full transition-all duration-1000 ease-out shadow-[var(--shadow-soft)]"
                      style={{ width: `${Math.min((pregnancyInfo.weeksPregnant / 40) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-background/50 rounded-xl p-4 shadow-[var(--shadow-soft)]">
                      <CalendarDays className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">{pregnancyInfo.daysRemaining}</p>
                      <p className="text-sm text-muted-foreground">{t('daysRemaining')}</p>
                    </div>
                    <div className="bg-background/50 rounded-xl p-4 shadow-[var(--shadow-soft)]">
                      <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">{calculatePregnancyMonth(pregnancyInfo.weeksPregnant)}</p>
                      <p className="text-sm text-muted-foreground">{t('pregnancyMonth')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-[var(--shadow-soft)] bg-[var(--gradient-card)]">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{pregnancyInfo.totalDays}</h3>
                  <p className="text-sm text-muted-foreground">{t('totalDaysPregnant')}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-[var(--shadow-soft)] bg-[var(--gradient-card)]">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{format(pregnancyInfo.dueDate, 'dd/MM', { locale: ar })}</h3>
                  <p className="text-sm text-muted-foreground">{t('expectedDueDate')}</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-[var(--shadow-soft)] bg-[var(--gradient-card)]">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{40 - pregnancyInfo.weeksPregnant}</h3>
                  <p className="text-sm text-muted-foreground">{t('weeksRemaining')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Tip */}
            <DailyTip currentDay={pregnancyInfo.totalDays} />

            {/* Due Date Card */}
            <Card className="border-0 shadow-[var(--shadow-soft)] bg-[var(--gradient-card)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{t('dueDate')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(pregnancyInfo.dueDate, 'EEEE، dd MMMM yyyy', { locale: ar })}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
                        <Info className="h-5 w-5 text-primary" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('aboutDueDate')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('dueDateExplanation')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction className="rounded-xl">{t('understood')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
