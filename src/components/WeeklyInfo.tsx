
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

interface WeeklyInfoProps {
  currentWeek: number;
}

interface WeekData {
  title: string;
  babySize: string;
  sizeDescription: string;
  description: string;
  developments: string[];
  momTips: string[];
  image: string;
}

const WeeklyInfo = ({ currentWeek }: WeeklyInfoProps) => {
  const { language, t } = useLanguage();
  const [weeklyData, setWeeklyData] = useState<Record<string, WeekData>>({});

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const data = await import(`@/data/weeks-${language}.json`);
        setWeeklyData(data.default);
      } catch (error) {
        console.error('Error loading weekly data:', error);
        // Fallback to English if Arabic data fails to load
        if (language === 'ar') {
          const fallbackData = await import('@/data/weeks-en.json');
          setWeeklyData(fallbackData.default);
        }
      }
    };

    loadWeeklyData();
  }, [language]);

  // Find the closest week data
  const availableWeeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
  const closestWeek = availableWeeks.length > 0 
    ? availableWeeks.reduce((prev, curr) => 
        Math.abs(curr - currentWeek) < Math.abs(prev - currentWeek) ? curr : prev
      )
    : 4;

  const weekData = weeklyData[closestWeek.toString()];

  if (currentWeek === 0 || !weekData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('weeklyInformation')}</CardTitle>
          <CardDescription>
            {t('weeklyInfoDescription')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pink-800">{weekData.title}</CardTitle>
              <CardDescription>{t('currentWeek', { week: currentWeek })}</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
              {t('week')} {currentWeek}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{weekData.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-pink-800">{t('babySizeThisWeek')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <img 
              src={weekData.image} 
              alt={weekData.babySize}
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-pink-600">{weekData.babySize}</h3>
              <p className="text-gray-600">{weekData.sizeDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-pink-800">{t('babyDevelopment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {weekData.developments.map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-800">{t('tipsForMom')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {weekData.momTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyInfo;
