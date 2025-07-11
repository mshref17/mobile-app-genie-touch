
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Baby, Users, Heart } from "lucide-react";
import { format, addDays, differenceInDays, differenceInWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import WeeklyInfo from "@/components/WeeklyInfo";
import Community from "@/components/Community";

const Index = () => {
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();

  useEffect(() => {
    const savedDate = localStorage.getItem('lastPeriodDate');
    if (savedDate) {
      setLastPeriodDate(new Date(savedDate));
      setIsFirstTime(false);
    }
  }, []);

  const handleDateSubmit = () => {
    if (selectedDate) {
      setLastPeriodDate(selectedDate);
      localStorage.setItem('lastPeriodDate', selectedDate.toISOString());
      setIsFirstTime(false);
    }
  };

  const calculatePregnancyInfo = () => {
    if (!lastPeriodDate) return null;

    const today = new Date();
    const daysPregnant = differenceInDays(today, lastPeriodDate);
    const weeksPregnant = Math.floor(daysPregnant / 7);
    const daysInCurrentWeek = daysPregnant % 7;
    const dueDate = addDays(lastPeriodDate, 280); // 40 weeks
    const daysRemaining = differenceInDays(dueDate, today);

    return {
      weeksPregnant,
      daysInCurrentWeek,
      dueDate,
      daysRemaining: Math.max(0, daysRemaining),
      totalDays: daysPregnant
    };
  };

  const pregnancyInfo = calculatePregnancyInfo();

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
              <Baby className="w-8 h-8 text-pink-600" />
            </div>
            <CardTitle className="text-2xl text-pink-800">Welcome to Your Pregnancy Journey</CardTitle>
            <CardDescription>
              Let's start by entering the first day of your last menstrual period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <Button 
              onClick={handleDateSubmit} 
              disabled={!selectedDate}
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-pink-800 mb-2">Your Pregnancy Journey</h1>
          <p className="text-pink-600">Track your beautiful journey to motherhood</p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Baby className="w-4 h-4" />
              Weekly Info
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {pregnancyInfo && (
              <>
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

                <div className="w-full bg-pink-200 rounded-full h-3">
                  <div 
                    className="bg-pink-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((pregnancyInfo.weeksPregnant / 40) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm text-pink-600">
                  {Math.round((pregnancyInfo.weeksPregnant / 40) * 100)}% Complete
                </p>
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
