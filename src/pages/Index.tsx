import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Baby, Users, Heart, Settings, CalendarDays, Clock, Star, Gift } from "lucide-react";
import { format, addDays, differenceInDays, differenceInWeeks, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

import WeeklyInfo from "@/components/WeeklyInfo";
import Community from "@/components/Community";
import DailyTip from "@/components/DailyTip";
import NotificationSettings from "@/components/NotificationSettings";
import { NotificationService } from "@/lib/notifications";

import appLogo from "@/assets/app-logo.png";

const Index = () => {
  const { t, language, setLanguage } = useLanguage();
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<Date>();
  const [dueDateMode, setDueDateMode] = useState<'period' | 'duedate'>('period');

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
              <div className="flex space-x-2">
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
                        {selectedDate ? format(selectedDate, "PPP") : t('selectDate')}
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
                        {selectedDueDate ? format(selectedDueDate, "PPP") : t('selectDueDate')}
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

  
  
  return (
    <div className={`min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Fixed App Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b">
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
                    {/* Language Settings */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">{t('language')}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant={language === 'en' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setLanguage('en')}
                          className="flex-1"
                        >
                          {t('english')}
                        </Button>
                        <Button
                          variant={language === 'ar' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setLanguage('ar')}
                          className="flex-1"
                        >
                          {t('arabic')}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">{t('pregnancyDates')}</h4>
                      <div className="flex space-x-2">
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
                                {selectedDate ? format(selectedDate, "PPP") : t('selectDate')}
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
                                {selectedDueDate ? format(selectedDueDate, "PPP") : t('selectDueDate')}
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
                    
                    <div className="flex space-x-2">
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

      {/* Main Content with Top Padding */}
      <div className="container mx-auto p-4 max-w-4xl pt-32 pb-24">
        <Tabs defaultValue="dashboard" className="w-full">
          {/* Fixed Tabs Bar */}
          <div className="fixed top-[73px] left-0 right-0 z-40 bg-white border-b border-gray-200">
            <div className="container mx-auto max-w-4xl">
              <TabsList className="grid grid-cols-3 bg-white border-b border-gray-200 rounded-none p-0 h-auto w-full">
                <TabsTrigger value="dashboard" className="border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent bg-transparent rounded-none py-3 px-4 text-gray-600 data-[state=active]:text-pink-600">
                  {t('dashboard')}
                </TabsTrigger>
                <TabsTrigger value="weekly" className="border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent bg-transparent rounded-none py-3 px-4 text-gray-600 data-[state=active]:text-pink-600">
                  {t('weeklyInfo')}
                </TabsTrigger>
                <TabsTrigger value="community" className="border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent bg-transparent rounded-none py-3 px-4 text-gray-600 data-[state=active]:text-pink-600">
                  {t('community')}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            {pregnancyInfo && (
              <>
                {/* Hero Section with Baby Bump Progress */}
                <div className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 rounded-3xl p-6 mb-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/30 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/30 rounded-full translate-y-12 -translate-x-12"></div>
                  
                  <div className="relative z-10">
                    <div className="text-center mb-6">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        {t('week')} {pregnancyInfo.weeksPregnant}
                      </h2>
                      <p className="text-gray-600 text-lg">
                        {pregnancyInfo.daysRemaining} {t('daysUntilBaby')}
                      </p>
                    </div>
                    
                    {/* Pregnancy Progress Visualization */}
                    <div className="relative">
                      <div className="w-full bg-white/50 rounded-full h-4 mb-4">
                        <div 
                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-4 rounded-full transition-all duration-1000 relative overflow-hidden"
                          style={{ width: `${Math.min((pregnancyInfo.weeksPregnant / 40) * 100, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{t('week')} 1</span>
                        <span className="font-semibold text-pink-600">
                          {Math.round((pregnancyInfo.weeksPregnant / 40) * 100)}% {t('progressCompleted')}
                        </span>
                        <span>{t('week')} 40</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DailyTip currentDay={pregnancyInfo.totalDays} />

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CalendarDays className="w-6 h-6 text-pink-600" />
                      </div>
                      <div className="text-2xl font-bold text-pink-700">
                        {pregnancyInfo.weeksPregnant}{t('weekAbbrev')} {pregnancyInfo.daysInCurrentWeek}{t('dayAbbrev')}
                      </div>
                      <div className="text-sm text-pink-600">{t('yourProgressText')}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {pregnancyInfo.daysRemaining}
                      </div>
                      <div className="text-sm text-purple-600">{t('daysLeft')}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Due Date Card */}
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-emerald-800">
                      <div className="p-2 bg-emerald-100 rounded-full">
                        <CalendarDays className="w-5 h-5 text-emerald-600" />
                      </div>
                      {t('expectedDueDate')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-700 mb-1">
                        {format(pregnancyInfo.dueDate, "EEEE")}
                      </div>
                      <div className="text-xl text-emerald-600">
                        {format(pregnancyInfo.dueDate, "MMMM d, yyyy")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="weekly">
            <WeeklyInfo currentWeek={pregnancyInfo?.weeksPregnant || 0} />
          </TabsContent>

          <TabsContent value="community">
            <Community />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Index;
