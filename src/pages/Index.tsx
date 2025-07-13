import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Baby, Users, Heart, Settings } from "lucide-react";
import { format, addDays, differenceInDays, differenceInWeeks, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

import WeeklyInfo from "@/components/WeeklyInfo";
import Community from "@/components/Community";
import DailyTip from "@/components/DailyTip";
import NotificationSettings from "@/components/NotificationSettings";
import { NotificationService } from "@/lib/notifications";

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
            <CardTitle className="text-2xl text-pink-800">Welcome to Your Pregnancy Journey</CardTitle>
            <CardDescription>
              Choose how you'd like to start tracking your pregnancy
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
                  Last Period Date
                </Button>
                <Button
                  variant={dueDateMode === 'duedate' ? 'default' : 'outline'}
                  onClick={() => setDueDateMode('duedate')}
                  className="flex-1"
                >
                  Due Date
                </Button>
              </div>

              {dueDateMode === 'period' ? (
                <div className="space-y-2">
                  <Label htmlFor="last-period">First day of last period</Label>
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
                        {selectedDate ? format(selectedDate, "PPP") : "Select date"}
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
                  <Label htmlFor="due-date">Expected due date</Label>
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
                        {selectedDueDate ? format(selectedDueDate, "PPP") : "Select due date"}
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
              Start Tracking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  
  
  return (
    <div className={`min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 safe-area-full ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto p-4 max-w-4xl">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-3 bg-white border-b border-gray-200 rounded-none p-0 h-auto flex-1">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent bg-transparent rounded-none py-3 px-4 text-gray-600 data-[state=active]:text-pink-600">
                <Heart className="w-5 h-5" />
                {t('dashboard')}
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent bg-transparent rounded-none py-3 px-4 text-gray-600 data-[state=active]:text-pink-600">
                <Baby className="w-5 h-5" />
                {t('weeklyInfo')}
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-transparent bg-transparent rounded-none py-3 px-4 text-gray-600 data-[state=active]:text-pink-600">
                <Users className="w-5 h-5" />
                {t('community')}
              </TabsTrigger>
            </TabsList>
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 border-b-2 border-transparent hover:border-pink-500 rounded-none py-3">
                  <Settings className="h-5 w-5 text-gray-600 hover:text-pink-600" />
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

          {pregnancyInfo && (
            <div className="mb-6">
              <div className="w-full bg-pink-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-pink-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((pregnancyInfo.weeksPregnant / 40) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-pink-600">
                {Math.round((pregnancyInfo.weeksPregnant / 40) * 100)}% Complete
              </p>
            </div>
          )}

          <TabsContent value="dashboard" className="space-y-6">
            {pregnancyInfo && (
              <>
                <DailyTip currentDay={pregnancyInfo.totalDays} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-pink-800">Pregnancy Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-pink-100 rounded-lg">
                        <div className="text-3xl font-bold text-pink-600">
                          {pregnancyInfo.weeksPregnant}
                        </div>
                        <div className="text-sm text-pink-700">Weeks Pregnant</div>
                        <div className="text-xs text-pink-600">
                          +{pregnancyInfo.daysInCurrentWeek} days
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-100 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">
                          {pregnancyInfo.daysRemaining}
                        </div>
                        <div className="text-sm text-purple-700">Days to Go</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-pink-800">Important Dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-semibold text-pink-600">
                          {format(pregnancyInfo.dueDate, "PPP")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Days Pregnant:</span>
                        <span className="font-semibold text-purple-600">
                          {pregnancyInfo.totalDays} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Week:</span>
                        <span className="font-semibold text-pink-600">
                          {pregnancyInfo.weeksPregnant} of 40 weeks
                        </span>
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
